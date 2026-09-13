import crypto from "node:crypto"

import User from "../models/User.js"
import Gym from "../models/Gym.js"
import SaasPlan from "../models/SaasPlan.js"
import GymSubscription from "../models/GymSubscription.js"
import PlatformTransaction from "../models/PlatformTransaction.js"

import cloudinary from "../config/cloudinary.js"

import {
  initializePaystackTransaction,
} from "../services/paymentService.js"

import {
  encryptPaymentSecret,
} from "../utils/paymentEncryption.js"

import {
  sendEmail,
} from "../services/emailService.js"

const slugify = (value) =>
  String(value || "gym")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")

const normalizePhone = (value, country = "Nigeria") => {
  const raw = String(value || "")
    .trim()
    .replace(/[\s().-]/g, "")

  if (!raw) return ""
  if (raw.startsWith("+")) return raw

  if (
    country === "Nigeria" &&
    raw.startsWith("0") &&
    raw.length >= 10
  ) {
    return `+234${raw.slice(1)}`
  }

  return raw
}

const uniqueSlug = async (name) => {
  const base = slugify(name)
  let slug = base || `gym-${Date.now()}`
  let number = 1

  while (await Gym.exists({ slug })) {
    slug = `${base}-${number++}`
  }

  return slug
}

const sanitize = (user) => {
  const value = user?.toObject
    ? user.toObject()
    : { ...user }

  delete value.password
  return value
}

const sanitizePaymentSettings = (
  paymentSettings = {},
) => ({
  provider: paymentSettings.provider || "none",
  enabled: Boolean(paymentSettings.enabled),
  publicKey: paymentSettings.publicKey || "",
  configured: Boolean(
    paymentSettings.secretKeyEncrypted,
  ),
  testMode:
    paymentSettings.testMode !== false,
  connectedAt:
    paymentSettings.connectedAt || null,
  lastVerifiedAt:
    paymentSettings.lastVerifiedAt || null,
})

const isValidEmail = (value) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    String(value || "").trim(),
  )

const sanitizeEmailSettings = (
  emailSettings = {},
) => ({
  enabled: Boolean(emailSettings.enabled),
  provider:
    emailSettings.provider === "smtp"
      ? "smtp"
      : "platform",
  senderName:
    emailSettings.senderName || "",
  senderEmail:
    emailSettings.senderEmail || "",
  replyToEmail:
    emailSettings.replyToEmail || "",
  smtpHost:
    emailSettings.smtpHost || "",
  smtpPort:
    Number(emailSettings.smtpPort) || 587,
  smtpUser:
    emailSettings.smtpUser || "",
  smtpSecure:
    Boolean(emailSettings.smtpSecure),
  hasSmtpPassword: Boolean(
    emailSettings.smtpPasswordEncrypted,
  ),
  trainerOtpEnabled:
    emailSettings.trainerOtpEnabled !== false,
  memberEmailsEnabled:
    emailSettings.memberEmailsEnabled !== false,
  passwordResetEmailsEnabled:
    emailSettings.passwordResetEmailsEnabled !== false,
  configuredAt:
    emailSettings.configuredAt || null,
  lastTestedAt:
    emailSettings.lastTestedAt || null,
})

/*
|--------------------------------------------------------------------------
| Upload a buffer to Cloudinary
|--------------------------------------------------------------------------
*/

const uploadBufferToCloudinary = (
  buffer,
  options = {},
) =>
  new Promise(
    (resolve, reject) => {
      const uploadStream =
        cloudinary.uploader.upload_stream(
          options,
          (error, result) => {
            if (error) {
              return reject(error)
            }

            resolve(result)
          },
        )

      uploadStream.end(buffer)
    },
  )

export const publicPlans = async (
  req,
  res,
) => {
  res.json({
    success: true,
    plans: await SaasPlan.find({
      active: true,
    })
      .sort({
        displayOrder: 1,
        price: 1,
      })
      .lean(),
  })
}

export const registerGym = async (
  req,
  res,
) => {
  let gym = null

  try {
    const {
      gymName,
      ownerName,
      email,
      password,
      phone,
      country = "Nigeria",
      planId,
    } = req.body

    if (
      !gymName ||
      !ownerName ||
      !email ||
      !password ||
      !planId
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Gym name, owner name, email, password and plan are required.",
      })
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message:
          "Password must be at least 8 characters.",
      })
    }

    const normalizedEmail = String(email)
      .trim()
      .toLowerCase()

    const normalizedPhone = normalizePhone(
      phone,
      country,
    )

    const plan = await SaasPlan.findOne({
      _id: planId,
      active: true,
    })

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: "SaaS plan not found.",
      })
    }

    const existingOwner =
      await User.findOne({
        email: normalizedEmail,
        role: {
          $in: [
            "admin",
            "platform_owner",
          ],
        },
      }).lean()

    if (existingOwner) {
      return res.status(409).json({
        success: false,
        message:
          "An owner account with this email already exists.",
      })
    }

    const parts = String(ownerName)
      .trim()
      .split(/\s+/)

    const firstName =
      parts.shift() || ownerName

    const lastName =
      parts.join(" ") || "Owner"

    gym = await Gym.create({
      name: gymName.trim(),
      slug: await uniqueSlug(gymName),
      email: normalizedEmail,
      phone: normalizedPhone,
      country,
      isActive: false,
    })

    const now = new Date()

    const trialDays = Number(
      plan.trialDays || 0,
    )

    const trialEnd = trialDays
      ? new Date(
          now.getTime() +
            trialDays * 86400000,
        )
      : null

    const immediatelyActive =
      Boolean(
        trialEnd ||
          Number(plan.price) === 0,
      )

    const owner = await User.create({
      firstName,
      lastName,
      email: normalizedEmail,
      phone: normalizedPhone,
      role: "admin",
      gym: gym._id,
      password,
      isActive: immediatelyActive,
      emailVerified: true,
    })

    const periodDays =
      plan.billingCycle === "yearly"
        ? 365
        : 30

    const currentPeriodEnd =
      trialEnd ||
      new Date(
        now.getTime() +
          periodDays * 86400000,
      )

    const sub =
      await GymSubscription.create({
        gym: gym._id,
        owner: owner._id,
        plan: plan._id,
        planName: plan.name,
        amount: plan.price,
        currency: plan.currency,
        billingCycle:
          plan.billingCycle,
        startDate: now,
        trialEndsAt: trialEnd,
        currentPeriodStart: now,
        currentPeriodEnd,
        nextBillingDate:
          currentPeriodEnd,
        status: trialEnd
          ? "trial"
          : Number(plan.price) === 0
            ? "active"
            : "pending",
        paymentStatus:
          Number(plan.price) === 0
            ? "paid"
            : "pending",
      })

    if (immediatelyActive) {
      gym.isActive = true
      await gym.save()
    }

    if (
      trialEnd ||
      Number(plan.price) === 0
    ) {
      return res.status(201).json({
        success: true,
        gym,
        user: sanitize(owner),
        subscription: sub,
        requiresPayment: false,
      })
    }

    const reference = `GB-${Date.now()}-${crypto
      .randomBytes(4)
      .toString("hex")}`

    sub.transactionReference =
      reference

    await sub.save()

    const tx =
      await PlatformTransaction.create(
        {
          gym: gym._id,
          subscription: sub._id,
          plan: plan._id,
          reference,
          amount: plan.price,
          currency: plan.currency,
          status: "pending",
          customerEmail: owner.email,
        },
      )

    const payment =
      await initializePaystackTransaction(
        {
          email: owner.email,
          amount: plan.price,
          reference,
          callbackUrl:
            `${
              process.env.FRONTEND_URL ||
              "http://localhost:5173"
            }/payment/callback`,
          metadata: {
            type: "gym_subscription",
            gymId: String(gym._id),
            ownerId: String(owner._id),
            planId: String(plan._id),
            transactionId: String(tx._id),
          },
        },
      )

    return res.status(201).json({
      success: true,
      gym,
      user: sanitize(owner),
      requiresPayment: true,
      reference,
      authorization_url:
        payment?.data?.authorization_url,
      subscription: sub,
    })
  } catch (error) {
    console.error(
      "Register gym error:",
      error,
    )

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Unable to register gym.",
    })
  }
}

export const currentGym = async (
  req,
  res,
) => {
  const gym = await Gym.findById(
    req.user.gym,
  ).lean()

  if (!gym) {
    return res.status(404).json({
      success: false,
      message: "Gym not found.",
    })
  }

  return res.json({
    success: true,
    gym: {
      ...gym,
      paymentSettings:
        sanitizePaymentSettings(
          gym.paymentSettings,
        ),
      emailSettings:
        sanitizeEmailSettings(
          gym.emailSettings,
        ),
    },
  })
}

/*
|--------------------------------------------------------------------------
| Upload Gym Logo
|--------------------------------------------------------------------------
|
| The multer middleware uses memoryStorage().
|
| Therefore:
|   req.file.buffer  -> Cloudinary
|   Cloudinary URL   -> MongoDB
|
| No local /uploads/logos storage is used.
|--------------------------------------------------------------------------
*/

export const uploadLogo = async (
  req,
  res,
) => {
  try {
    if (!req.user?.gym) {
      return res.status(403).json({
        success: false,
        message:
          "Your account is not connected to a gym.",
      })
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message:
          "Please select a gym logo image.",
      })
    }

    if (!req.file.buffer) {
      return res.status(400).json({
        success: false,
        message:
          "The uploaded logo file could not be read.",
      })
    }

    const gym = await Gym.findById(
      req.user.gym,
    )

    if (!gym) {
      return res.status(404).json({
        success: false,
        message: "Gym not found.",
      })
    }

    /*
    |--------------------------------------------------------------------------
    | Upload directly to Cloudinary
    |--------------------------------------------------------------------------
    */

    const result =
      await uploadBufferToCloudinary(
        req.file.buffer,
        {
          folder:
            "gb-gym/logos",
          resource_type: "image",
          transformation: [
            {
              width: 800,
              height: 800,
              crop: "limit",
              quality: "auto",
              fetch_format: "auto",
            },
          ],
        },
      )

    if (!result?.secure_url) {
      throw new Error(
        "Cloudinary did not return a logo URL.",
      )
    }

    /*
    |--------------------------------------------------------------------------
    | Save Cloudinary URL in MongoDB
    |--------------------------------------------------------------------------
    */

    gym.logoUrl =
      result.secure_url

    await gym.save()

    const updatedGym =
      gym.toObject()

    return res.json({
      success: true,
      message:
        "Gym logo uploaded successfully.",
      logoUrl:
        result.secure_url,
      gym: {
        ...updatedGym,
        paymentSettings:
          sanitizePaymentSettings(
            updatedGym.paymentSettings,
          ),
        emailSettings:
          sanitizeEmailSettings(
            updatedGym.emailSettings,
          ),
      },
    })
  } catch (error) {
    console.error(
      "Upload gym logo error:",
      error,
    )

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Unable to upload gym logo.",
    })
  }
}

export const updateCurrentGym =
  async (req, res) => {
    const allowed = [
      "name",
      "email",
      "phone",
      "address",
      "city",
      "state",
      "country",
      "logoUrl",
      "socialMedia",
      "branding",
      "settings",
    ]

    const patch = {}

    for (const key of allowed) {
      if (
        req.body[key] !==
        undefined
      ) {
        patch[key] =
          req.body[key]
      }
    }

    const gym =
      await Gym.findOneAndUpdate(
        {
          _id: req.user.gym,
        },
        patch,
        {
          new: true,
          runValidators: true,
        },
      ).lean()

    return res.json({
      success: true,
      gym: {
        ...gym,
        paymentSettings:
          sanitizePaymentSettings(
            gym?.paymentSettings,
          ),
        emailSettings:
          sanitizeEmailSettings(
            gym?.emailSettings,
          ),
      },
    })
  }

export const getPaymentSettings =
  async (req, res) => {
    const gym = await Gym.findById(
      req.user.gym,
    ).lean()

    if (!gym) {
      return res.status(404).json({
        success: false,
        message: "Gym not found.",
      })
    }

    return res.json({
      success: true,
      paymentSettings:
        sanitizePaymentSettings(
          gym.paymentSettings,
        ),
    })
  }

export const updatePaymentSettings =
  async (req, res) => {
    const {
      provider = "paystack",
      enabled = false,
      publicKey = "",
      secretKey = "",
      testMode = true,
    } = req.body || {}

    if (
      provider !== "paystack" &&
      provider !== "none"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Unsupported payment provider.",
      })
    }

    if (
      provider === "paystack" &&
      enabled &&
      !String(
        publicKey,
      ).trim()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Paystack public key is required when member payments are enabled.",
      })
    }

    const gym = await Gym.findById(
      req.user.gym,
    )

    if (!gym) {
      return res.status(404).json({
        success: false,
        message: "Gym not found.",
      })
    }

    const current =
      gym.paymentSettings || {}

    const next = {
      provider,
      enabled:
        provider === "paystack"
          ? Boolean(enabled)
          : false,
      publicKey:
        String(
          publicKey || "",
        ).trim(),
      secretKeyEncrypted:
        current.secretKeyEncrypted ||
        "",
      testMode:
        Boolean(testMode),
      connectedAt:
        current.connectedAt ||
        null,
      lastVerifiedAt:
        current.lastVerifiedAt ||
        null,
    }

    if (
      String(secretKey).trim()
    ) {
      next.secretKeyEncrypted =
        encryptPaymentSecret(
          secretKey,
        )

      next.connectedAt =
        new Date()

      next.lastVerifiedAt =
        null
    }

    gym.paymentSettings =
      next

    await gym.save()

    return res.json({
      success: true,
      paymentSettings:
        sanitizePaymentSettings(
          gym.paymentSettings,
        ),
    })
  }

export const getEmailSettings =
  async (req, res) => {
    const gym = await Gym.findById(
      req.user.gym,
    ).lean()

    if (!gym) {
      return res.status(404).json({
        success: false,
        message: "Gym not found.",
      })
    }

    return res.json({
      success: true,
      emailSettings:
        sanitizeEmailSettings(
          gym.emailSettings,
        ),
    })
  }

export const updateEmailSettings =
  async (req, res) => {
    try {
      const {
        enabled = false,
        provider = "platform",
        senderName = "",
        senderEmail = "",
        replyToEmail = "",
        smtpHost = "",
        smtpPort = 587,
        smtpUser = "",
        smtpPassword = "",
        smtpSecure = false,
        trainerOtpEnabled = true,
        memberEmailsEnabled = true,
        passwordResetEmailsEnabled = true,
      } = req.body || {}

      if (
        ![
          "platform",
          "smtp",
        ].includes(
          String(
            provider,
          ).toLowerCase(),
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Unsupported email provider.",
        })
      }

      const normalizedProvider =
        String(
          provider,
        ).toLowerCase()

      const normalizedSenderEmail =
        String(
          senderEmail || "",
        )
          .trim()
          .toLowerCase()

      const normalizedReplyTo =
        String(
          replyToEmail || "",
        )
          .trim()
          .toLowerCase()

      if (
        normalizedSenderEmail &&
        !isValidEmail(
          normalizedSenderEmail,
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Please enter a valid sender email address.",
        })
      }

      if (
        normalizedReplyTo &&
        !isValidEmail(
          normalizedReplyTo,
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Please enter a valid reply-to email address.",
        })
      }

      const gym = await Gym.findById(
        req.user.gym,
      )

      if (!gym) {
        return res.status(404).json({
          success: false,
          message:
            "Gym not found.",
        })
      }

      const current =
        gym.emailSettings || {}

      const next = {
        enabled:
          Boolean(enabled),
        provider:
          normalizedProvider,
        senderName:
          String(
            senderName || "",
          ).trim(),
        senderEmail:
          normalizedSenderEmail,
        replyToEmail:
          normalizedReplyTo,
        smtpHost:
          String(
            smtpHost || "",
          ).trim(),
        smtpPort:
          Number(smtpPort) || 587,
        smtpUser:
          String(
            smtpUser || "",
          ).trim(),
        smtpPasswordEncrypted:
          current.smtpPasswordEncrypted ||
          "",
        smtpSecure:
          Boolean(smtpSecure),
        trainerOtpEnabled:
          Boolean(
            trainerOtpEnabled,
          ),
        memberEmailsEnabled:
          Boolean(
            memberEmailsEnabled,
          ),
        passwordResetEmailsEnabled:
          Boolean(
            passwordResetEmailsEnabled,
          ),
        configuredAt:
          current.configuredAt ||
          null,
        lastTestedAt:
          current.lastTestedAt ||
          null,
      }

      if (
        normalizedProvider ===
        "smtp"
      ) {
        if (
          !normalizedSenderEmail ||
          !isValidEmail(
            normalizedSenderEmail,
          )
        ) {
          return res.status(400).json({
            success: false,
            message:
              "A valid sender email is required for custom SMTP.",
          })
        }

        if (!next.smtpHost) {
          return res.status(400).json({
            success: false,
            message:
              "SMTP host is required for custom SMTP.",
          })
        }

        if (!next.smtpUser) {
          return res.status(400).json({
            success: false,
            message:
              "SMTP username is required for custom SMTP.",
          })
        }

        if (
          !Number.isInteger(
            next.smtpPort,
          ) ||
          next.smtpPort < 1 ||
          next.smtpPort > 65535
        ) {
          return res.status(400).json({
            success: false,
            message:
              "SMTP port must be between 1 and 65535.",
          })
        }

        if (
          String(
            smtpPassword || "",
          ).trim()
        ) {
          next.smtpPasswordEncrypted =
            encryptPaymentSecret(
              smtpPassword,
            )
        } else if (
          !current.smtpPasswordEncrypted
        ) {
          return res.status(400).json({
            success: false,
            message:
              "SMTP password is required when configuring custom SMTP.",
          })
        }
      }

      next.configuredAt =
        new Date()

      gym.emailSettings =
        next

      await gym.save()

      return res.json({
        success: true,
        emailSettings:
          sanitizeEmailSettings(
            gym.emailSettings,
          ),
      })
    } catch (error) {
      console.error(
        "Update email settings error:",
        error,
      )

      return res.status(500).json({
        success: false,
        message:
          error.message ||
          "Unable to update email settings.",
      })
    }
  }

export const testEmailSettings =
  async (req, res) => {
    try {
      const gym =
        await Gym.findById(
          req.user.gym,
        ).lean()

      if (!gym) {
        return res.status(404).json({
          success: false,
          message:
            "Gym not found.",
        })
      }

      const recipient =
        String(
          req.body?.recipient ||
            req.user?.email ||
            "",
        )
          .trim()
          .toLowerCase()

      if (
        !recipient ||
        !isValidEmail(
          recipient,
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "A valid test recipient email is required.",
        })
      }

      const message = {
        subject:
          `${
            gym.name ||
            "GB Gym"
          } Email Test`,

        html: `
        <div style="font-family:Arial,sans-serif;line-height:1.6">
          <h2>${
            gym.name ||
            "GB Gym"
          } Email Configuration</h2>

          <p>
            This is a test email from your gym email settings.
          </p>

          <p>
            If you received this message, the email configuration is working correctly.
          </p>
        </div>
      `,

        text:
          `${
            gym.name ||
            "GB Gym"
          } email configuration test. If you received this message, the email configuration is working correctly.`,
      }

      await sendEmail({
        to: recipient,
        subject:
          message.subject,
        html:
          message.html,
        text:
          message.text,
        gym,
        category:
          "test",
      })

      await Gym.updateOne(
        {
          _id: gym._id,
        },
        {
          $set: {
            "emailSettings.lastTestedAt":
              new Date(),
          },
        },
      )

      return res.json({
        success: true,
        message:
          "Test email sent successfully.",
        emailSettings:
          sanitizeEmailSettings({
            ...gym.emailSettings,
            lastTestedAt:
              new Date(),
          }),
      })
    } catch (error) {
      console.error(
        "Test email settings error:",
        error,
      )

      return res.status(500).json({
        success: false,
        message:
          error.message ||
          "Unable to send test email.",
      })
    }
  }