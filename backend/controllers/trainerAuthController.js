import crypto from "node:crypto"
import bcrypt from "bcryptjs"

import User from "../models/User.js"
import Gym from "../models/Gym.js"
import TrainerLoginCode from "../models/TrainerLoginCode.js"
import { issueSession } from "./authController.js"

import {
  sendEmail,
  trainerLoginCodeEmail,
} from "../services/emailService.js"

const normalizeEmail = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()

const sanitizeUser = (user) => {
  const value = user?.toObject
    ? user.toObject()
    : { ...user }

  delete value.password

  return value
}

const findTrainer = async (
  email,
  gymSlug = "",
) => {
  const query = {
    email,
    role: "trainer",
  }

  if (gymSlug) {
    const gym = await Gym.findOne({
      slug: String(gymSlug)
        .trim()
        .toLowerCase(),
    }).select("_id")

    if (!gym) {
      return {
        trainer: null,
        multiple: false,
        gym: null,
      }
    }

    query.gym = gym._id

    return {
      trainer: await User.findOne(query),
      multiple: false,
      gym,
    }
  }

  const matches = await User.find(query).sort({
    createdAt: 1,
  })

  return {
    trainer: matches[0] || null,
    multiple: matches.length > 1,
    gym: null,
  }
}

export const requestTrainerLoginCode =
  async (req, res) => {
    try {
      const email =
        normalizeEmail(
          req.body?.email,
        )

      const gymSlug =
        String(
          req.body?.gymSlug || "",
        )
          .trim()
          .toLowerCase()

      if (!email) {
        return res.status(400).json({
          success: false,
          message: "Email is required.",
        })
      }

      const result =
        await findTrainer(
          email,
          gymSlug,
        )

      const trainer =
        result.trainer

      if (result.multiple) {
        return res.status(409).json({
          success: false,
          code: "GYM_CODE_REQUIRED",
          message:
            "This email is registered as a trainer at more than one gym. Enter your gym code.",
        })
      }

      if (!trainer) {
        return res.status(404).json({
          success: false,
          message:
            "No trainer account was found for this email.",
        })
      }

      if (!trainer.isActive) {
        return res.status(403).json({
          success: false,
          message:
            "This trainer account has been deactivated.",
        })
      }

      if (!trainer.gym) {
        return res.status(403).json({
          success: false,
          message:
            "This trainer is not connected to a gym.",
        })
      }

      const gym =
        await Gym.findById(
          trainer.gym,
        ).lean()

      if (!gym) {
        return res.status(403).json({
          success: false,
          message:
            "The trainer's gym could not be found.",
        })
      }

      if (!gym.isActive) {
        return res.status(403).json({
          success: false,
          code:
            "GYM_SUBSCRIPTION_REQUIRED",
          message:
            "This gym is not active.",
        })
      }

      await TrainerLoginCode.deleteMany({
        trainer: trainer._id,
      })

      const code = String(
        crypto.randomInt(
          100000,
          1000000,
        ),
      )

      const codeHash =
        await bcrypt.hash(
          code,
          10,
        )

      const expiresAt =
        new Date(
          Date.now() +
            10 * 60 * 1000,
        )

      await TrainerLoginCode.create({
        trainer: trainer._id,
        email,
        codeHash,
        expiresAt,
        attempts: 0,
      })

      try {
        const message =
          trainerLoginCodeEmail({
            firstName:
              trainer.firstName,
            code,
            gymName:
              gym.name,
          })

        const emailResult =
          await sendEmail({
            to: email,
            subject:
              message.subject ||
              "Your GB Trainer Login Code",
            html: message.html,
            text: message.text,
            gym,
            category:
              "trainer_otp",
          })

        if (!emailResult?.sent) {
          const emailSendError =
            new Error(
              emailResult?.error ||
                `Trainer OTP email was not sent: ${
                  emailResult?.reason ||
                  "unknown_email_error"
                }`,
            )

          emailSendError.emailResult =
            emailResult

          throw emailSendError
        }
      } catch (emailError) {
        await TrainerLoginCode.deleteMany({
          trainer: trainer._id,
        })

        throw emailError
      }

      return res.json({
        success: true,
        message:
          "A trainer login code has been sent to your email.",
      })
    } catch (error) {
      console.error(
        "Trainer login code error:",
        error,
      )

      return res.status(500).json({
        success: false,
        message:
          "Unable to send trainer login code.",
      })
    }
  }

export const verifyTrainerLoginCode =
  async (req, res) => {
    try {
      const email =
        normalizeEmail(
          req.body?.email,
        )

      const code =
        String(
          req.body?.code || "",
        ).trim()

      const gymSlug =
        String(
          req.body?.gymSlug || "",
        )
          .trim()
          .toLowerCase()

      if (!email || !code) {
        return res.status(400).json({
          success: false,
          message:
            "Email and verification code are required.",
        })
      }

      if (!/^\d{6}$/.test(code)) {
        return res.status(400).json({
          success: false,
          message:
            "Verification code must contain 6 digits.",
        })
      }

      const result =
        await findTrainer(
          email,
          gymSlug,
        )

      const trainer =
        result.trainer

      if (result.multiple) {
        return res.status(409).json({
          success: false,
          code: "GYM_CODE_REQUIRED",
          message:
            "This email is registered as a trainer at more than one gym. Enter your gym code.",
        })
      }

      if (!trainer) {
        return res.status(404).json({
          success: false,
          message:
            "No trainer account was found for this email.",
        })
      }

      if (!trainer.isActive) {
        return res.status(403).json({
          success: false,
          message:
            "This trainer account has been deactivated.",
        })
      }

      if (!trainer.gym) {
        return res.status(403).json({
          success: false,
          message:
            "This trainer is not connected to a gym.",
        })
      }

      const gym =
        await Gym.findById(
          trainer.gym,
        ).lean()

      if (!gym || !gym.isActive) {
        return res.status(403).json({
          success: false,
          code:
            "GYM_SUBSCRIPTION_REQUIRED",
          message:
            "This gym is not active.",
        })
      }

      const loginCode =
        await TrainerLoginCode.findOne({
          trainer: trainer._id,
          email,
          expiresAt: {
            $gt: new Date(),
          },
        }).sort({
          createdAt: -1,
        })

      if (!loginCode) {
        return res.status(401).json({
          success: false,
          message:
            "The verification code has expired or is invalid.",
        })
      }

      if (
        Number(
          loginCode.attempts || 0,
        ) >= 5
      ) {
        await loginCode.deleteOne()

        return res.status(429).json({
          success: false,
          message:
            "Too many verification attempts. Request a new code.",
        })
      }

      const valid =
        await bcrypt.compare(
          code,
          loginCode.codeHash,
        )

      if (!valid) {
        loginCode.attempts =
          Number(
            loginCode.attempts || 0,
          ) + 1

        await loginCode.save()

        return res.status(401).json({
          success: false,
          message:
            "Invalid verification code.",
          attemptsRemaining:
            Math.max(
              0,
              5 -
                loginCode.attempts,
            ),
        })
      }

      await loginCode.deleteOne()

      trainer.lastLogin =
        new Date()

      await trainer.save()

      const token =
        issueSession(
          res,
          trainer,
        )

      return res.json({
        success: true,
        message:
          "Trainer login successful.",
        token,
        user:
          sanitizeUser(
            trainer,
          ),
      })
    } catch (error) {
      console.error(
        "Trainer code verification error:",
        error,
      )

      return res.status(500).json({
        success: false,
        message:
          "Unable to verify trainer login code.",
      })
    }
  }