import GymSubscription from '../models/GymSubscription.js'
import SaasPlan from '../models/SaasPlan.js'
export const getCurrentGymSubscription=async(req,res)=>{const s=await GymSubscription.findOne({gym:req.user.gym}).populate('plan').sort({createdAt:-1});res.json({success:true,subscription:s})}
export const getGymSubscriptionHistory=async(req,res)=>res.json({success:true,history:await GymSubscription.find({gym:req.user.gym}).populate('plan').sort({createdAt:-1})})
export const getSaasPlans=async(req,res)=>res.json({success:true,plans:await SaasPlan.find({active:true}).sort({displayOrder:1,price:1})})
