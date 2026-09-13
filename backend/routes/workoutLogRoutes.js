import express from "express"

import {
  completeSet,
  completeWorkout,
  getAdminMemberWorkoutProgress,
  getAdminWorkoutProgress,
  getMyWorkoutHistory,
  getMyWorkoutLog,
  uncompleteSet,
} from "../controllers/workoutLogController.js"

import {
  authorize,
  protect,
} from "../middleware/authMiddleware.js"

const router = express.Router()

/*
|--------------------------------------------------------------------------
| MEMBER ROUTES
|--------------------------------------------------------------------------
*/

router.get(
  "/me",
  protect,
  authorize("member"),
  getMyWorkoutLog,
)

router.get(
  "/me/history",
  protect,
  authorize("member"),
  getMyWorkoutHistory,
)

router.post(
  "/set/complete",
  protect,
  authorize("member"),
  completeSet,
)

router.post(
  "/set/uncomplete",
  protect,
  authorize("member"),
  uncompleteSet,
)

router.post(
  "/complete",
  protect,
  authorize("member"),
  completeWorkout,
)

/*
|--------------------------------------------------------------------------
| ADMIN + TRAINER PROGRESS ROUTES
|--------------------------------------------------------------------------
*/

router.get(
  "/admin/progress",
  protect,
  authorize("admin", "trainer"),
  getAdminWorkoutProgress,
)

router.get(
  "/admin/members/:memberId/progress",
  protect,
  authorize("admin", "trainer"),
  getAdminMemberWorkoutProgress,
)

export default router
