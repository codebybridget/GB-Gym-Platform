import express from "express"

import {
  assignTrainer,
  getMyTrainerMembers,
  getTrainerAssignments,
  removeTrainerAssignment,
} from "../controllers/trainerAssignmentController.js"

import {
  authorize,
  protect,
} from "../middleware/authMiddleware.js"

const router =
  express.Router()

/*
|--------------------------------------------------------------------------
| TRAINER ROUTES
|--------------------------------------------------------------------------
|
| Specific routes are defined before parameterized routes.
|
|--------------------------------------------------------------------------
*/

/*
 * Get members assigned to the logged-in trainer.
 */
router.get(
  "/my-members",
  protect,
  authorize("trainer"),
  getMyTrainerMembers,
)

/*
|--------------------------------------------------------------------------
| ADMIN ROUTES
|--------------------------------------------------------------------------
*/

/*
 * Assign a trainer to a member.
 */
router.post(
  "/",
  protect,
  authorize("admin"),
  assignTrainer,
)

/*
 * Get assignments for a specific trainer.
 */
router.get(
  "/trainer/:trainerId",
  protect,
  authorize("admin"),
  getTrainerAssignments,
)

/*
 * Remove a trainer assignment.
 */
router.delete(
  "/:id",
  protect,
  authorize("admin"),
  removeTrainerAssignment,
)

export default router