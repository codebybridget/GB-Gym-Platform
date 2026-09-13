import crypto from "node:crypto"

import User from "../models/User.js"
import Gym from "../models/Gym.js"

const TOKEN_EXPIRES_MS =
  30 * 60 * 1000

const hashToken = (token) =>
  crypto
    .createHash("sha256")
    .update(token)
    .digest("hex")

const normalizeEmail = (email) =>
  String(email || "")
    .trim()
    .toLowerCase()

const genericResponse = (res) =>
  res.json({
    success: true,
    message:
      "If an eligible account exists, password reset instructions have been sent.",
  })

const requestReset = async (
  req,
  res,
  expectedRole,
) => {
  try {
    const email =
      normalizeEmail(
        req.body?.email,
      )

    if (!email) {
      return genericResponse(res)
    }

    const gymSlug =
      String(
        req.body?.gymSlug || "",
      )
        .trim()
        .toLowerCase()

    let user = null
    let gym = null

    if (gymSlug) {
      gym =
        await Gym.findOne({
          slug: gymSlug,
        })
          .select(
            "_id name emailSettings",
          )
          .lean()

      if (gym) {
        user =
          await User.findOne({
            email,
            role: expectedRole,
            gym: gym._id,
          })
      }
    } else {
      const matches =
        await User.find({
          email,
          role: expectedRole,
        })

      if (matches.length === 1) {
        user = matches[0]

        if (user.gym) {
          gym =
            await Gym.findById(
              user.gym,
            )
              .select(
                "_id name emailSettings",
              )
              .lean()
        }
      }
    }

    if (!user || !user.isActive) {
      return genericResponse(res)
    }

    const rawToken =
      crypto.randomBytes(32)
        .toString("hex")

    user.passwordResetToken =
      hashToken(
        rawToken,
      )

    user.passwordResetExpires =
      new Date(
        Date.now() +
          TOKEN_EXPIRES_MS,
      )

    await user.save()

    try {
      const {
        sendEmail,
        passwordResetEmail,
      } = await import(
        "../services/emailService.js"
      )

      const message =
        passwordResetEmail({
          firstName:
            user.firstName,
          token: rawToken,
          role: expectedRole,
        })

      await sendEmail({
        to: email,
        subject:
          message.subject,
        html:
          message.html,
        text:
          message.text,
        gym,
        category:
          "password_reset",
      })
    } catch (emailError) {
      console.error(
        "Password reset email error:",
        emailError,
      )
    }

    return genericResponse(res)
  } catch (error) {
    console.error(
      "Password reset request error:",
      error,
    )

    return genericResponse(res)
  }
}

export const requestMemberPasswordReset =
  (req, res) =>
    requestReset(
      req,
      res,
      "member",
    )

export const requestAdminPasswordReset =
  (req, res) =>
    requestReset(
      req,
      res,
      "admin",
    )

export const resetPassword =
  async (req, res) => {
    try {
      const {
        token,
        password,
        role = "member",
      } = req.body || {}

      if (
        !token ||
        typeof password !==
          "string" ||
        password.length < 8
      ) {
        return res.status(400).json({
          success: false,
          message:
            "A valid reset token and a password of at least 8 characters are required.",
        })
      }

      if (
        ![
          "member",
          "admin",
        ].includes(
          String(
            role,
          ).toLowerCase(),
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid password reset role.",
        })
      }

      const user =
        await User.findOne({
          role: String(
            role,
          ).toLowerCase(),
          passwordResetToken:
            hashToken(
              token,
            ),
          passwordResetExpires: {
            $gt: new Date(),
          },
        }).select(
          "+password",
        )

      if (!user) {
        return res.status(400).json({
          success: false,
          message:
            "The password reset link is invalid or expired.",
        })
      }

      user.password =
        password

      user.passwordResetToken =
        undefined

      user.passwordResetExpires =
        undefined

      await user.save()

      return res.json({
        success: true,
        message:
          "Password reset successful. You can now sign in.",
      })
    } catch (error) {
      console.error(
        "Password reset error:",
        error,
      )

      return res.status(500).json({
        success: false,
        message:
          "Unable to reset password.",
      })
    }
  }