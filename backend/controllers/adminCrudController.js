import User from "../models/User.js"
import Gym from "../models/Gym.js"
import GymSubscription from "../models/GymSubscription.js"
const safe=(u)=>{const v=u.toObject();delete v.password;return v}
const normalizePhone=(value)=>{const raw=String(value||"").trim().replace(/[\s().-]/g,"");if(!raw)return "";if(raw.startsWith("+"))return raw;if(raw.startsWith("0")&&raw.length>=10)return `+234${raw.slice(1)}`;return raw}
const enforcePlanLimit = async (gymId, type) => {
  const subscription = await GymSubscription.findOne({
    gym: gymId,
    status: { $in: ["trial", "active"] },
  }).populate("plan").sort({ createdAt: -1 }).lean()
  const limit = subscription?.plan?.[type]
  if (limit === null || limit === undefined) return null
  const role = type === "maxMembers" ? "member" : "trainer"
  const count = await User.countDocuments({ gym: gymId, role })
  if (count >= Number(limit)) return `Your ${subscription.plan.name} plan has reached its ${role} limit (${limit}).`
  return null
}

export const createMember=async(req,res)=>{try{const {firstName,lastName,email,password,phone}=req.body;if(!firstName||!lastName||!email||!password)return res.status(400).json({success:false,message:"First name, last name, email and password are required."});const normalizedEmail=String(email).trim().toLowerCase();const limitMessage=await enforcePlanLimit(req.user.gym,"maxMembers");if(limitMessage)return res.status(403).json({success:false,message:limitMessage});if(await User.findOne({email:normalizedEmail}))return res.status(409).json({success:false,message:"An account with this email already exists."});const user=await User.create({firstName:firstName.trim(),lastName:lastName.trim(),email:normalizedEmail,phone:normalizePhone(phone),password,role:"member",gym:req.user.gym,isActive:true,emailVerified:true});return res.status(201).json({success:true,member:safe(user)})}catch(e){console.error("Create member error:",e);return res.status(500).json({success:false,message:e.message||"Unable to create member."})}}
export const updateMember=async(req,res)=>{try{const u=await User.findOne({_id:req.params.memberId,role:"member"});if(!u)return res.status(404).json({success:false,message:"Member not found."});for(const k of ["firstName","lastName","email","phone","dateOfBirth","gender","fitnessGoal","address","age","height","weight"])if(req.body[k]!==undefined)u[k]=req.body[k];if(req.body.password) u.password=req.body.password;await u.save();return res.json({success:true,member:safe(u)})}catch(e){return res.status(500).json({success:false,message:e.message||"Unable to update member."})}}
export const updateTrainer=async(req,res)=>{try{const u=await User.findOne({_id:req.params.trainerId,role:"trainer"});if(!u)return res.status(404).json({success:false,message:"Trainer not found."});for(const k of ["firstName","lastName","email","phone","age","dateOfBirth","address"])if(req.body[k]!==undefined)u[k]=req.body[k];await u.save();return res.json({success:true,trainer:safe(u)})}catch(e){return res.status(500).json({success:false,message:e.message||"Unable to update trainer."})}}
