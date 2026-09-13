import express from "express"

import {
  register,
  login,
  refresh,
  logout,
  getMe,
  getLoginMethod,
} from "../controllers/authController.js"

import {
  requestTrainerLoginCode,
  verifyTrainerLoginCode,
} from "../controllers/trainerAuthController.js"

import { protect } from "../middleware/authMiddleware.js"

const router = express.Router()

router.post("/register", register)
router.post("/login-method", getLoginMethod)
router.post("/login", login)
router.post("/refresh", refresh)
router.post("/logout", logout)
router.get("/me", protect, getMe)

router.post(
  "/trainer/request-code",
  requestTrainerLoginCode,
)

router.post(
  "/trainer/verify-code",
  verifyTrainerLoginCode,
)

export default router
