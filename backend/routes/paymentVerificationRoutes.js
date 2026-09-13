import express from 'express';import {verifyPayment} from '../controllers/paymentVerificationController.js';import {verifyPlatformPayment} from '../controllers/platformPaymentController.js';import {protect} from '../middleware/authMiddleware.js';
const r=express.Router();
r.post('/verify',protect,verifyPayment)
r.get('/verify/:reference',async(req,res)=>{const PlatformTransaction=(await import('../models/PlatformTransaction.js')).default;const found=await PlatformTransaction.findOne({reference:req.params.reference});if(found)return verifyPlatformPayment(req,res);return res.status(404).json({success:false,message:'Payment record not found.'})})
export default r
