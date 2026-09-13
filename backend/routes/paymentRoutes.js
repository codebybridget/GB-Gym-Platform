import express from "express"

import {
  initializePayment,
} from "../controllers/paymentController.js"

import {
  protect,
} from "../middleware/authMiddleware.js"


const router =
  express.Router()


/*
|--------------------------------------------------------------------------
| Initialize Payment
|--------------------------------------------------------------------------
|
| POST /api/payments/initialize
|
| Only authenticated members can initialize
| a membership payment.
|
|--------------------------------------------------------------------------
*/

router.post(
  "/initialize",
  protect,
  initializePayment,
)


router.get('/history', protect, async (req,res)=>{ const Payment=(await import('../models/Payment.js')).default; const rows=await Payment.find({user:req.user._id}).populate('membershipPlan','name').sort({createdAt:-1}); res.json({success:true,history:rows}) })

export default router