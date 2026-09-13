import express from "express"

import {
  getTrainerMemberById,
  getTrainerMembers,
} from "../controllers/trainerController.js"

import {
  getTrainerMemberWorkoutProgress,
  getTrainerWorkoutProgress,
} from "../controllers/trainerWorkoutController.js"

import {
  authorize,
  protect,
} from "../middleware/authMiddleware.js"

const router = express.Router()

router.get(
  "/members",
  protect,
  authorize("trainer"),
  getTrainerMembers,
)

router.get(
  "/members/:memberId/progress",
  protect,
  authorize("trainer"),
  getTrainerMemberWorkoutProgress,
)

router.get(
  "/members/:memberId",
  protect,
  authorize("trainer"),
  getTrainerMemberById,
)

router.get(
  "/progress",
  protect,
  authorize("trainer"),
  getTrainerWorkoutProgress,
)

export default router
