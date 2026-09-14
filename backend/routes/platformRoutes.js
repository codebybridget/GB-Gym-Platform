import express from "express"

import {
  protect,
  authorize,
} from "../middleware/authMiddleware.js"

import {
  getDashboard,
  listGyms,
  updateGym,
  deleteGym,
  listPlans,
  createPlan,
  updatePlan,
  deletePlan,
  listSubscriptions,
  updateSubscription,
  cancelSubscription,
  reactivateSubscription,
  deleteSubscription,
  platformRevenue,
  settings,
  updateSettings,
} from "../controllers/platformController.js"

import {
  verifyPlatformPayment,
} from "../controllers/platformPaymentController.js"

const router =
  express.Router()


/*
|--------------------------------------------------------------------------
| Public platform routes
|--------------------------------------------------------------------------
*/

router.get(
  "/public-plans",
  (req, res) =>
    res.status(404).json({
      success: false,
      message:
        "Use /api/gyms/public-plans",
    }),
)


/*
|--------------------------------------------------------------------------
| Platform owner protection
|--------------------------------------------------------------------------
*/

router.use(
  protect,
  authorize("platform_owner"),
)


/*
|--------------------------------------------------------------------------
| Dashboard
|--------------------------------------------------------------------------
*/

router.get(
  "/dashboard",
  getDashboard,
)


/*
|--------------------------------------------------------------------------
| Gyms
|--------------------------------------------------------------------------
*/

router.get(
  "/gyms",
  listGyms,
)

router.put(
  "/gyms/:id",
  updateGym,
)

router.delete(
  "/gyms/:id",
  deleteGym,
)


/*
|--------------------------------------------------------------------------
| SaaS plans
|--------------------------------------------------------------------------
*/

router.get(
  "/plans",
  listPlans,
)

router.post(
  "/plans",
  createPlan,
)

router.put(
  "/plans/:id",
  updatePlan,
)

router.delete(
  "/plans/:id",
  deletePlan,
)


/*
|--------------------------------------------------------------------------
| Gym subscriptions
|--------------------------------------------------------------------------
*/

router.get(
  "/subscriptions",
  listSubscriptions,
)

router.put(
  "/subscriptions/:id",
  updateSubscription,
)

router.post(
  "/subscriptions/:id/cancel",
  cancelSubscription,
)

router.post(
  "/subscriptions/:id/reactivate",
  reactivateSubscription,
)


/*
|--------------------------------------------------------------------------
| Delete pending subscription
|--------------------------------------------------------------------------
|
| Only the controller will allow deletion when the subscription is
| pending and unpaid.
|
*/

router.delete(
  "/subscriptions/:id",
  deleteSubscription,
)


/*
|--------------------------------------------------------------------------
| Revenue
|--------------------------------------------------------------------------
*/

router.get(
  "/revenue",
  platformRevenue,
)


/*
|--------------------------------------------------------------------------
| Platform settings
|--------------------------------------------------------------------------
*/

router.get(
  "/settings",
  settings,
)

router.put(
  "/settings",
  updateSettings,
)


/*
|--------------------------------------------------------------------------
| Platform owner password
|--------------------------------------------------------------------------
*/

router.put(
  "/owner/password",
  async (
    req,
    res,
  ) => {
    try {
      const User =
        (
          await import(
            "../models/User.js"
          )
        ).default

      const user =
        await User.findById(
          req.user._id,
        ).select(
          "+password",
        )

      if (!user) {
        return res
          .status(404)
          .json({
            success: false,
            message:
              "Owner not found.",
          })
      }

      const valid =
        await user.comparePassword(
          req.body
            .currentPassword ||
            "",
        )

      if (!valid) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Current password is incorrect.",
          })
      }

      user.password =
        req.body.newPassword

      await user.save()

      return res.json({
        success: true,
      })
    } catch (error) {
      console.error(
        "Platform Owner Password Error:",
        error,
      )

      return res.status(500).json({
        success: false,
        message:
          error.message ||
          "Unable to update password.",
      })
    }
  },
)


/*
|--------------------------------------------------------------------------
| Platform payment verification
|--------------------------------------------------------------------------
*/

router.get(
  "/payment/verify/:reference",
  verifyPlatformPayment,
)


export default router