import express from "express"

import {
  addEmergencyContact,
  deleteEmergencyContact,
  getEmergencyContacts,
  updateEmergencyContact,
} from "../controllers/emergencyContactController.js"

import {
  protect,
} from "../middleware/authMiddleware.js"

const router =
  express.Router()

router.get(
  "/",
  protect,
  getEmergencyContacts,
)

router.post(
  "/",
  protect,
  addEmergencyContact,
)

router.put(
  "/:contactId",
  protect,
  updateEmergencyContact,
)

router.delete(
  "/:contactId",
  protect,
  deleteEmergencyContact,
)

export default router