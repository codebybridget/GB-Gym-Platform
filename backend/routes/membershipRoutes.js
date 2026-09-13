import express from "express"

import {
  getMembershipPlans,
  getAllMembershipPlans,
  createMembershipPlan,
  updateMembershipPlan,
  deleteMembershipPlan,
} from "../controllers/membershipController.js"

import {
  protect,
  adminOnly,
} from "../middleware/authMiddleware.js"

const router =
  express.Router()

/*
|--------------------------------------------------------------------------
| Public / Member Routes
|--------------------------------------------------------------------------
|
| Members can view active membership plans.
|--------------------------------------------------------------------------
*/

router.get(
  "/",
  getMembershipPlans,
)


/*
|--------------------------------------------------------------------------
| Admin Routes
|--------------------------------------------------------------------------
|
| Admin can manage membership plans.
|--------------------------------------------------------------------------
*/

router.get(
  "/all",
  protect,
  adminOnly,
  getAllMembershipPlans,
)

router.post(
  "/",
  protect,
  adminOnly,
  createMembershipPlan,
)

router.put(
  "/:id",
  protect,
  adminOnly,
  updateMembershipPlan,
)

router.delete(
  "/:id",
  protect,
  adminOnly,
  deleteMembershipPlan,
)

export default router