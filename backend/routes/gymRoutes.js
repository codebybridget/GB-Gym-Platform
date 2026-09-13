import express from "express"

import {
  publicPlans,
  registerGym,
  currentGym,
  updateCurrentGym,
  uploadLogo,
  getPaymentSettings,
  updatePaymentSettings,
  getEmailSettings,
  updateEmailSettings,
  testEmailSettings,
} from "../controllers/gymController.js"

import {
  authorize,
  protect,
} from "../middleware/authMiddleware.js"

import {
  gymLogoUpload,
} from "../middleware/gymLogoUpload.js"

const router = express.Router()

router.get(
  "/public-plans",
  publicPlans,
)

router.get(
  "/entry/:slug",
  async (req, res, next) => {
    try {
      const { default: Gym } = await import(
        "../models/Gym.js"
      )

      const slug = String(
        req.params.slug || "",
      )
        .trim()
        .toLowerCase()

      if (!slug) {
        return res.status(400).json({
          success: false,
          message: "Gym slug is required.",
        })
      }

      const gym = await Gym.findOne({
        slug,
        isActive: true,
      }).select(
        "name slug logoUrl branding settings isActive",
      )

      if (!gym) {
        return res.status(404).json({
          success: false,
          message: "Gym not found or inactive.",
        })
      }

      return res.json({
        success: true,
        gym,
      })
    } catch (error) {
      return next(error)
    }
  },
)

router.post(
  "/register",
  registerGym,
)

router.get(
  "/current",
  protect,
  authorize("admin", "trainer", "member"),
  currentGym,
)

router.put(
  "/current",
  protect,
  authorize("admin"),
  updateCurrentGym,
)

router.put(
  "/current/logo",
  protect,
  authorize("admin"),
  gymLogoUpload.single("logo"),
  uploadLogo,
)

router.get(
  "/current/payment-settings",
  protect,
  authorize("admin"),
  getPaymentSettings,
)

router.put(
  "/current/payment-settings",
  protect,
  authorize("admin"),
  updatePaymentSettings,
)

router.get(
  "/current/email-settings",
  protect,
  authorize("admin"),
  getEmailSettings,
)

router.put(
  "/current/email-settings",
  protect,
  authorize("admin"),
  updateEmailSettings,
)

router.post(
  "/current/email-settings/test",
  protect,
  authorize("admin"),
  testEmailSettings,
)

export default router