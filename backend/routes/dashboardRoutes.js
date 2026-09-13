import express from "express"

import {
  getDashboardStats,
} from "../controllers/dashboardController.js"

import {
  authorize,
  protect,
} from "../middleware/authMiddleware.js"

const router = express.Router()

router.get(
  "/",
  protect,
  authorize("admin"),
  getDashboardStats,
)

export default router