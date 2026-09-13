import express from 'express'
import { verifyPlatformPayment } from '../controllers/platformPaymentController.js'
const router=express.Router();router.get('/verify/:reference',verifyPlatformPayment);router.post('/verify',verifyPlatformPayment);export default router
