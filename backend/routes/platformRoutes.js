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
  revenueCleanup,
  settings,
  updateSettings,
} from "../controllers/platformController.js"

const router = express.Router()

router.use(
  protect,
  authorize("platform_owner"),
)

router.get("/dashboard", getDashboard)

router.get("/gyms", listGyms)
router.put("/gyms/:id", updateGym)
router.delete("/gyms/:id", deleteGym)

router.get("/plans", listPlans)
router.post("/plans", createPlan)
router.put("/plans/:id", updatePlan)
router.delete("/plans/:id", deletePlan)

router.get("/subscriptions", listSubscriptions)
router.put("/subscriptions/:id", updateSubscription)
router.delete("/subscriptions/:id", deleteSubscription)
router.post(
  "/subscriptions/:id/cancel",
  cancelSubscription,
)
router.post(
  "/subscriptions/:id/reactivate",
  reactivateSubscription,
)

router.get("/revenue", platformRevenue)
router.delete("/revenue/test-data", revenueCleanup)

router.get("/settings", settings)
router.put("/settings", updateSettings)

export default router
