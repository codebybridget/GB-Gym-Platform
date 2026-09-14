import express from "express"
import { verifyPayment } from "../controllers/paymentVerificationController.js"
import { verifyPlatformPayment } from "../controllers/platformPaymentController.js"
import { protect } from "../middleware/authMiddleware.js"

const router = express.Router()

router.post("/verify", protect, verifyPayment)

router.get("/verify/:reference", verifyPlatformPayment)

export default router