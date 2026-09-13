import jwt from "jsonwebtoken"
import User from "../models/User.js"
import Gym from "../models/Gym.js"
import GymSubscription from "../models/GymSubscription.js"
import PlatformTransaction from "../models/PlatformTransaction.js"

const ACCESS_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d"
const REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || "30d"

const sanitizeUser = (user) => {
  const value = user?.toObject ? user.toObject() : { ...user }
  delete value.password
  return value
}

const signAccess = (user) => jwt.sign(
  {
    userId: String(user._id),
    role: user.role,
    gymId: user.gym ? String(user.gym) : null,
    type: "access",
  },
  process.env.JWT_SECRET,
  { expiresIn: ACCESS_EXPIRES_IN },
)

const signRefresh = (user) => jwt.sign(
  { userId: String(user._id), type: "refresh" },
  process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
  { expiresIn: REFRESH_EXPIRES_IN },
)

const refreshCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  maxAge: 30 * 24 * 60 * 60 * 1000,
  path: "/api/auth",
})

const setRefreshCookie = (res, token) => {
  const o = refreshCookieOptions()
  const parts = [
    `gb_refresh_token=${encodeURIComponent(token)}`,
    `Max-Age=${Math.floor(o.maxAge / 1000)}`,
    `Path=${o.path}`,
    "HttpOnly",
    `SameSite=${o.sameSite === "none" ? "None" : "Lax"}`,
  ]
  if (o.secure) parts.push("Secure")
  res.setHeader("Set-Cookie", parts.join("; "))
}

const clearRefreshCookie = (res) => {
  const o = refreshCookieOptions()
  const parts = [
    "gb_refresh_token=",
    "Max-Age=0",
    `Path=${o.path}`,
    "HttpOnly",
    `SameSite=${o.sameSite === "none" ? "None" : "Lax"}`,
  ]
  if (o.secure) parts.push("Secure")
  res.setHeader("Set-Cookie", parts.join("; "))
}

const readRefreshCookie = (req) => {
  const raw = req.headers.cookie || ""
  const match = raw
    .split(";")
    .map((v) => v.trim())
    .find((v) => v.startsWith("gb_refresh_token="))

  return match
    ? decodeURIComponent(match.slice("gb_refresh_token=".length))
    : null
}

const hasValidGymSubscription = async (gymId) => {
  const now = new Date()

  const active = await GymSubscription.findOne({
    gym: gymId,
    status: { $in: ["active", "trial"] },
    $or: [
      {
        status: "active",
        paymentStatus: "paid",
        currentPeriodEnd: { $gt: now },
      },
      {
        status: "trial",
        trialEndsAt: { $gt: now },
      },
    ],
  }).sort({
    currentPeriodEnd: -1,
    trialEndsAt: -1,
    createdAt: -1,
  })

  if (active) return active

  // Self-heal only from a verified successful GB platform transaction.
  const tx = await PlatformTransaction.findOne({
    gym: gymId,
    status: "success",
  }).sort({ paidAt: -1, createdAt: -1 })

  if (!tx?.subscription) return null

  const sub = await GymSubscription.findById(tx.subscription)
  if (!sub) return null

  const periodEnd =
    sub.currentPeriodEnd &&
    new Date(sub.currentPeriodEnd) > now
      ? new Date(sub.currentPeriodEnd)
      : new Date(
          now.getTime() +
            (sub.billingCycle === "yearly" ? 365 : 30) *
              24 *
              60 *
              60 *
              1000,
        )

  await GymSubscription.findByIdAndUpdate(sub._id, {
    status: "active",
    paymentStatus: "paid",
    startDate: sub.startDate || now,
    currentPeriodStart: sub.currentPeriodStart || now,
    currentPeriodEnd: periodEnd,
    nextBillingDate: periodEnd,
    transactionReference:
      sub.transactionReference || tx.reference,
  })

  await Gym.findByIdAndUpdate(gymId, { isActive: true })

  return GymSubscription.findById(sub._id)
}

export const issueSession = (res, user) => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is missing from the .env file.")
  }

  const accessToken = signAccess(user)
  const refreshToken = signRefresh(user)

  setRefreshCookie(res, refreshToken)

  return accessToken
}

export const getLoginMethod = async (req, res) => {
  try {
    const email = String(req.body?.email || "").trim().toLowerCase()
    if (!email) return res.status(400).json({ success: false, message: "Email is required." })

    const users = await User.find({ email }).select("role gym isActive").lean()
    if (!users.length) {
      return res.json({ success: true, method: "password", requiresGym: false })
    }

    const trainerCount = users.filter((user) => user.role === "trainer").length
    if (trainerCount > 0) {
      return res.json({ success: true, method: "trainer_code", requiresGym: trainerCount > 1 })
    }

    const tenantCount = users.filter((user) => user.role !== "platform_owner").length
    return res.json({
      success: true,
      method: "password",
      requiresGym: tenantCount > 1,
    })
  } catch (error) {
    console.error("Login method error:", error)
    return res.status(500).json({ success: false, message: "Unable to determine login method." })
  }
}

export const register = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      phone,
      gymSlug,
    } = req.body

    if (
      !firstName?.trim() ||
      !lastName?.trim() ||
      !email?.trim() ||
      !password ||
      !gymSlug?.trim()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "First name, last name, email, password and gym code are required.",
      })
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters.",
      })
    }

    const normalizedEmail = email.trim().toLowerCase()
    const normalizedGymSlug = gymSlug.trim().toLowerCase()

    const gym = await Gym.findOne({
      slug: normalizedGymSlug,
      isActive: true,
    })

    if (!gym) {
      return res.status(404).json({
        success: false,
        message:
          "Active gym not found. Ask your gym for its GB gym code.",
      })
    }

    // Email uniqueness is tenant-specific: the same email may exist
    // at another gym, but not twice in this gym.
    if (
      await User.exists({
        gym: gym._id,
        email: normalizedEmail,
      })
    ) {
      return res.status(409).json({
        success: false,
        message:
          "An account with this email already exists at this gym.",
      })
    }

    const user = await User.create({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: normalizedEmail,
      password,
      phone: phone?.trim() || "",
      role: "member",
      gym: gym._id,
      emailVerified: true,
      isActive: true,
    })

    const token = issueSession(res, user)

    user.lastLogin = new Date()
    await user.save()

    return res.status(201).json({
      success: true,
      message: "Member account created successfully.",
      token,
      user: sanitizeUser(user),
    })
  } catch (error) {
    console.error("Register error:", error)

    // MongoDB duplicate-key protection in case two registration
    // requests arrive at nearly the same time.
    if (error?.code === 11000) {
      return res.status(409).json({
        success: false,
        message:
          "An account with this email already exists at this gym.",
      })
    }

    return res.status(500).json({
      success: false,
      message: "Unable to create account.",
    })
  }
}

export const login = async (req, res) => {
  try {
    const { email, password, gymSlug } = req.body

    if (!email?.trim() || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required.",
      })
    }

    const normalizedEmail = email.trim().toLowerCase()
    const normalizedGymSlug = gymSlug
      ? String(gymSlug).trim().toLowerCase()
      : ""

    let requestedGym = null

    if (normalizedGymSlug) {
      requestedGym = await Gym.findOne({
        slug: normalizedGymSlug,
      }).lean()

      if (!requestedGym) {
        return res.status(404).json({
          success: false,
          message: "Gym not found.",
        })
      }
    }

    const userQuery = {
      email: normalizedEmail,
    }

    // When a user enters through a gym code/QR link, resolve the account
    // inside that exact tenant. This prevents the same email from being
    // authenticated against the wrong gym.
    if (requestedGym) {
      userQuery.gym = requestedGym._id
    }

    let user

    if (requestedGym) {
      user = await User.findOne(userQuery).select("+password")
    } else {
      const matches = await User.find({ email: normalizedEmail }).select("+password")
      if (matches.length > 1) {
        const tenantMatches = matches.filter((candidate) => candidate.role !== "platform_owner")
        if (tenantMatches.length > 1) {
          return res.status(409).json({
            success: false,
            code: "GYM_CODE_REQUIRED",
            message: "This email is registered at more than one gym. Enter your gym code and try again.",
          })
        }
      }
      user = matches[0] || null
    }

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      })
    }

    if (user.role === "trainer") {
      return res.status(403).json({
        success: false,
        code: "TRAINER_CODE_LOGIN_REQUIRED",
        message: "Trainers must sign in through the Trainer Portal using the one-time email code.",
      })
    }

    /*
     * Platform Owner does not require a gym.
     *
     * A gym owner may be inactive while a newly created gym
     * is waiting for its first verified SaaS payment. We therefore
     * evaluate the gym subscription before permanently rejecting
     * an inactive non-platform account.
     */
    if (
      !user.isActive &&
      user.role === "platform_owner"
    ) {
      return res.status(403).json({
        success: false,
        message: "This account has been deactivated.",
      })
    }

    if (
      requestedGym &&
      user.role !== "platform_owner" &&
      (!user.gym ||
        String(user.gym) !== String(requestedGym._id))
    ) {
      return res.status(403).json({
        success: false,
        message:
          `This account does not belong to ${requestedGym.name}.`,
      })
    }

    if (user.role !== "platform_owner") {
      if (!user.gym) {
        return res.status(403).json({
          success: false,
          message: "Your account is not connected to a gym.",
        })
      }

      let gym = await Gym.findById(user.gym).lean()

      if (!gym) {
        return res.status(403).json({
          success: false,
          message: "Your gym could not be found.",
        })
      }

      if (!gym.isActive) {
        const validSubscription =
          await hasValidGymSubscription(user.gym)

        if (validSubscription) {
          gym = await Gym.findById(user.gym).lean()
        }
      }

      if (!gym?.isActive) {
        return res.status(403).json({
          success: false,
          code: "GYM_SUBSCRIPTION_REQUIRED",
          message:
            "This gym is not active. Complete or renew the gym subscription to continue.",
        })
      }

      /*
       * Successful gym subscription activation makes the
       * corresponding Gym Owner/Admin account usable.
       */
      if (!user.isActive) {
        user.isActive = true
      }
    }

    user.lastLogin = new Date()
    await user.save()

    const token = issueSession(res, user)

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      token,
      user: sanitizeUser(user),
    })
  } catch (error) {
    console.error("Login error:", error)

    return res.status(500).json({
      success: false,
      message: "Unable to log in.",
    })
  }
}

export const refresh = async (req, res) => {
  try {
    const token = readRefreshCookie(req)

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Refresh session not found.",
      })
    }

    const payload = jwt.verify(
      token,
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
    )

    if (payload.type !== "refresh") {
      throw new Error("Invalid refresh token.")
    }

    const user = await User.findById(payload.userId)

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: "Refresh session is no longer valid.",
      })
    }

    const accessToken = issueSession(res, user)

    return res.json({
      success: true,
      token: accessToken,
      user: sanitizeUser(user),
    })
  } catch {
    clearRefreshCookie(res)

    return res.status(401).json({
      success: false,
      message:
        "Refresh session expired. Please sign in again.",
    })
  }
}

export const logout = (req, res) => {
  clearRefreshCookie(res)

  return res.json({
    success: true,
    message: "Logged out successfully.",
  })
}

export const getMe = async (req, res) =>
  res.json({
    success: true,
    user: sanitizeUser(req.user),
  })
