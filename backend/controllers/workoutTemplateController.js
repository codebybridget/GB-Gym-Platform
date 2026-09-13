import Workout from '../models/Workout.js'
export const listWorkouts=async(req,res)=>res.json({success:true,workouts:await Workout.find().sort({createdAt:-1})})
export const getWorkout=async(req,res)=>{const w=await Workout.findById(req.params.id);if(!w)return res.status(404).json({success:false,message:'Workout not found.'});res.json({success:true,workout:w})}
export const createWorkout=async(req,res)=>res.status(201).json({success:true,workout:await Workout.create({...req.body,createdBy:req.user._id})})
export const updateWorkout=async(req,res)=>{const w=await Workout.findByIdAndUpdate(req.params.id,{$set:req.body},{new:true,runValidators:true});if(!w)return res.status(404).json({success:false,message:'Workout not found.'});res.json({success:true,workout:w})}
export const deleteWorkout=async(req,res)=>{const w=await Workout.findByIdAndDelete(req.params.id);if(!w)return res.status(404).json({success:false,message:'Workout not found.'});res.json({success:true})}
