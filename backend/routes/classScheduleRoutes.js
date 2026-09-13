import express from "express"

import {
  createSchedule,
  getSchedule,
  seedDefaultSchedule,
  updateSchedule,
} from "../controllers/classScheduleController.js"

import {
  authorize,
  protect,
} from "../middleware/authMiddleware.js"

const router =
  express.Router()

/*
|--------------------------------------------------------------------------
| View Schedule
|--------------------------------------------------------------------------
*/

router.get(
  "/",
  protect,
  getSchedule,
)

/*
|--------------------------------------------------------------------------
| Admin / Trainer Management
|--------------------------------------------------------------------------
*/

router.post(
  "/",
  protect,
  authorize(
    "admin",
    "trainer",
  ),
  createSchedule,
)

router.put(
  "/:id",
  protect,
  authorize(
    "admin",
    "trainer",
  ),
  updateSchedule,
)

/*
|--------------------------------------------------------------------------
| Create Default Weekly Schedule
|--------------------------------------------------------------------------
*/

router.post(
  "/seed-default",
  protect,
  authorize("admin"),
  seedDefaultSchedule,
)

router.delete('/:id', protect, authorize('admin','trainer'), async (req,res)=>{ const ClassSchedule=(await import('../models/ClassSchedule.js')).default; const item=await ClassSchedule.findByIdAndDelete(req.params.id); if(!item)return res.status(404).json({success:false,message:'Schedule not found.'}); res.json({success:true}); })

export default router