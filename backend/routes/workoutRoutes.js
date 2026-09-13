import express from "express"

import {
  getTodayWorkout,
  getTomorrowWorkout,
  getWeeklySchedule,
  getWorkoutForDate,
} from "../controllers/workoutController.js"

import {
  authorize,
  protect,
} from "../middleware/authMiddleware.js"

const router =
  express.Router()

/*
|--------------------------------------------------------------------------
| Member Workout Routes
|--------------------------------------------------------------------------
*/

router.get(
  "/today",
  protect,
  authorize("member"),
  getTodayWorkout,
)

router.get(
  "/tomorrow",
  protect,
  authorize("member"),
  getTomorrowWorkout,
)

router.get(
  "/week",
  protect,
  authorize("member"),
  getWeeklySchedule,
)

router.get(
  "/date",
  protect,
  authorize("member"),
  getWorkoutForDate,
)

export default router