import express from "express"

import {
  createProgramAssignment,
  getProgramAssignments,
  getProgramAssignmentById,
  updateProgramAssignment,
  cancelProgramAssignment,
  getMyTodayWorkout,
  getMyProgramAssignments,
} from "../controllers/programAssignmentController.js"

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
  "/my-today",
  protect,
  authorize("member"),
  getMyTodayWorkout,
)

router.get(
  "/my-programs",
  protect,
  authorize("member"),
  getMyProgramAssignments,
)

/*
|--------------------------------------------------------------------------
| ADMIN + TRAINER ROUTES
|--------------------------------------------------------------------------
*/

router.post(
  "/",
  protect,
  authorize("admin", "trainer"),
  createProgramAssignment,
)

router.get(
  "/",
  protect,
  authorize("admin", "trainer"),
  getProgramAssignments,
)

router.get(
  "/:id",
  protect,
  authorize("admin", "trainer"),
  getProgramAssignmentById,
)

router.put(
  "/:id",
  protect,
  authorize("admin", "trainer"),
  updateProgramAssignment,
)

router.delete(
  "/:id",
  protect,
  authorize("admin", "trainer"),
  cancelProgramAssignment,
)

export default router
