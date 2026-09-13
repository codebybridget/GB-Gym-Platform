import express from "express"

import {
  requestAdminPasswordReset,
} from "../controllers/passwordResetController.js"

const router = express.Router()

router.post("/forgot-password", requestAdminPasswordReset)

export default router
