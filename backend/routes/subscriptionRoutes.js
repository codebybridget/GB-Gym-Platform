import express from "express"

import {
  getMySubscription,
} from "../controllers/subscriptionController.js"

import {
  protect,
} from "../middleware/authMiddleware.js"

const router = express.Router()

/*
|--------------------------------------------------------------------------
| Get Current User Subscription
|--------------------------------------------------------------------------
*/

router.get(
  "/me",
  protect,
  getMySubscription,
)

export default router