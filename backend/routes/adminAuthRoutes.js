import express from "express"

import {
  createFirstAdmin,
} from "../controllers/adminAuthController.js"

import {
  requestAdminPasswordReset,
} from "../controllers/passwordResetController.js"

const router = express.Router()

router.post("/setup", createFirstAdmin)

// Admin password recovery
router.post("/forgot-password", requestAdminPasswordReset)

export default router
