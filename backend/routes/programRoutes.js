import express from "express"

import {
  createProgram,
  deleteProgram,
  getProgramById,
  getPrograms,
  updateProgram,
} from "../controllers/programController.js"

import {
  authorize,
  protect,
} from "../middleware/authMiddleware.js"

const router =
  express.Router()

/*
|--------------------------------------------------------------------------
| View Programs
|--------------------------------------------------------------------------
*/

router.get(
  "/",
  protect,
  getPrograms,
)

router.get(
  "/:id",
  protect,
  getProgramById,
)

/*
|--------------------------------------------------------------------------
| Admin / Trainer Program Builder
|--------------------------------------------------------------------------
*/

router.post(
  "/",
  protect,
  authorize(
    "admin",
    "trainer",
  ),
  createProgram,
)

router.put(
  "/:id",
  protect,
  authorize(
    "admin",
    "trainer",
  ),
  updateProgram,
)

router.delete(
  "/:id",
  protect,
  authorize(
    "admin",
    "trainer",
  ),
  deleteProgram,
)

export default router