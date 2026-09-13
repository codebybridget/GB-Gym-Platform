import express from "express"

import { createMember, updateMember, updateTrainer } from "../controllers/adminCrudController.js"

import {
  createTrainer,
  getMemberById,
  getMembers,
  getTrainers,
  updateMemberStatus,
  updateTrainerStatus,
  updateUserRole,
} from "../controllers/adminController.js"

import {
  authorize,
  protect,
} from "../middleware/authMiddleware.js"

const router = express.Router()

/* Member Management */
router.get("/members", protect, authorize("admin"), getMembers)
router.post("/members", protect, authorize("admin"), createMember)
router.put("/members/:memberId", protect, authorize("admin"), updateMember)
router.get("/members/:memberId", protect, authorize("admin"), getMemberById)
router.patch("/members/:memberId/status", protect, authorize("admin"), updateMemberStatus)

/* Trainer Management */
router.get("/trainers", protect, authorize("admin"), getTrainers)
router.post("/trainers", protect, authorize("admin"), createTrainer)
router.patch("/trainers/:trainerId/status", protect, authorize("admin"), updateTrainerStatus)
router.put("/trainers/:trainerId", protect, authorize("admin"), updateTrainer)

/* Role Management */
router.patch("/users/:userId/role", protect, authorize("admin"), updateUserRole)

export default router
