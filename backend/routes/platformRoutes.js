import express from 'express'
import { protect, authorize } from '../middleware/authMiddleware.js'
import { getDashboard,listGyms,updateGym,listPlans,createPlan,updatePlan,deletePlan,listSubscriptions,updateSubscription,cancelSubscription,reactivateSubscription,platformRevenue,settings,updateSettings } from '../controllers/platformController.js'
import { verifyPlatformPayment } from '../controllers/platformPaymentController.js'
const router=express.Router()
router.get('/public-plans', (req,res)=>res.status(404).json({success:false,message:'Use /api/gyms/public-plans'}))
router.use(protect,authorize('platform_owner'))
router.get('/dashboard',getDashboard);router.get('/gyms',listGyms);router.put('/gyms/:id',updateGym)
router.get('/plans',listPlans);router.post('/plans',createPlan);router.put('/plans/:id',updatePlan);router.delete('/plans/:id',deletePlan)
router.get('/subscriptions',listSubscriptions);router.put('/subscriptions/:id',updateSubscription);router.post('/subscriptions/:id/cancel',cancelSubscription);router.post('/subscriptions/:id/reactivate',reactivateSubscription)
router.get('/revenue',platformRevenue);router.get('/settings',settings);router.put('/settings',updateSettings)
router.put('/owner/password',async(req,res)=>{const User=(await import('../models/User.js')).default;const u=await User.findById(req.user._id).select('+password');if(!u)return res.status(404).json({success:false,message:'Owner not found'});if(!(await u.comparePassword(req.body.currentPassword||'')))return res.status(400).json({success:false,message:'Current password is incorrect'});u.password=req.body.newPassword;await u.save();res.json({success:true})})
router.get('/payment/verify/:reference',verifyPlatformPayment)
export default router
