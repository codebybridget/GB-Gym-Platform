import express from "express"

import {
  getMemberWorkoutProgress,
  getMemberWorkoutProgressById,
} from "../controllers/adminWorkoutController.js"

import {
  authorize,
  protect,
} from "../middleware/authMiddleware.js"

const router =
  express.Router()

/*
|--------------------------------------------------------------------------
| Get all member workout progress
|--------------------------------------------------------------------------
*/

router.get(
  "/progress",
  protect,
  authorize("admin"),
  getMemberWorkoutProgress,
)

/*
|--------------------------------------------------------------------------
| Get one member's workout progress
|--------------------------------------------------------------------------
*/

router.get(
  "/progress/:memberId",
  protect,
  authorize("admin"),
  getMemberWorkoutProgressById,
)

export default router