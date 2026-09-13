import express from "express"

import {
  getRevenueOverview,
  getRevenueTransactions,
  getRevenueByPlan,
  getRevenueSummary,
} from "../controllers/revenueController.js"

import {
  authorize,
  protect,
} from "../middleware/authMiddleware.js"

const router = express.Router()

/*
|--------------------------------------------------------------------------
| Revenue Overview
|--------------------------------------------------------------------------
*/

router.get(
  "/overview",
  protect,
  authorize("admin"),
  getRevenueOverview,
)

/*
|--------------------------------------------------------------------------
| Revenue Transactions
|--------------------------------------------------------------------------
*/

router.get(
  "/transactions",
  protect,
  authorize("admin"),
  getRevenueTransactions,
)

/*
|--------------------------------------------------------------------------
| Revenue By Membership Plan
|--------------------------------------------------------------------------
*/

router.get(
  "/by-plan",
  protect,
  authorize("admin"),
  getRevenueByPlan,
)

/*
|--------------------------------------------------------------------------
| Revenue Summary
|--------------------------------------------------------------------------
*/

router.get(
  "/summary",
  protect,
  authorize("admin"),
  getRevenueSummary,
)

export default router