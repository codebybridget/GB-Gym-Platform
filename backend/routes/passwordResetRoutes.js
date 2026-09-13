import express from "express"

import {
  requestMemberPasswordReset,
  requestAdminPasswordReset,
  resetPassword,
} from "../controllers/passwordResetController.js"

const router = express.Router()

router.post(
  "/forgot-password",
  requestMemberPasswordReset,
)

router.post(
  "/admin-forgot-password",
  requestAdminPasswordReset,
)

router.post(
  "/reset-password",
  resetPassword,
)

export default router
