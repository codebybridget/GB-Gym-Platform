import express from "express"

import {
  createExercise,
  deleteExercise,
  getExerciseById,
  getExercises,
  updateExercise,
} from "../controllers/exerciseController.js"

import exerciseUploadMiddleware from "../middleware/exerciseUploadMiddleware.js"

import {
  authorize,
  protect,
} from "../middleware/authMiddleware.js"

const router =
  express.Router()

/*
|--------------------------------------------------------------------------
| View Exercises
|--------------------------------------------------------------------------
*/

/*
 * Get all exercises.
 *
 * GET /api/exercises
 */
router.get(
  "/",
  protect,
  getExercises,
)

/*
 * Get one exercise.
 *
 * IMPORTANT:
 * This route stays after "/".
 *
 * GET /api/exercises/:id
 */
router.get(
  "/:id",
  protect,
  getExerciseById,
)

/*
|--------------------------------------------------------------------------
| Admin / Trainer Exercise Management
|--------------------------------------------------------------------------
*/

/*
 * Create Exercise
 *
 * POST /api/exercises
 *
 * Supports:
 *
 * image -> exercise demonstration picture
 * video -> exercise demonstration video
 *
 * Both files are optional.
 *
 * The frontend sends these files using multipart/form-data.
 */
router.post(
  "/",
  protect,
  authorize(
    "admin",
    "trainer",
  ),
  exerciseUploadMiddleware,
  createExercise,
)

/*
 * Update Exercise
 *
 * PUT /api/exercises/:id
 *
 * Supports replacing:
 *
 * image -> new demonstration picture
 * video -> new demonstration video
 *
 * Both files are optional.
 */
router.put(
  "/:id",
  protect,
  authorize(
    "admin",
    "trainer",
  ),
  exerciseUploadMiddleware,
  updateExercise,
)

/*
 * Delete / Deactivate Exercise
 *
 * DELETE /api/exercises/:id
 */
router.delete(
  "/:id",
  protect,
  authorize(
    "admin",
    "trainer",
  ),
  deleteExercise,
)

/*
|--------------------------------------------------------------------------
| Export
|--------------------------------------------------------------------------
*/

export default router