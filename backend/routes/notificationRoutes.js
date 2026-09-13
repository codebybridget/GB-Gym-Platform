import {
  Router,
} from "express"

import {
  getMyNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  subscribeToPush,
  unsubscribeFromPush,
  getPushPublicKey,
  sendTestPushNotification,
} from "../controllers/notificationController.js"

/*
 * IMPORTANT:
 *
 * This router is mounted inside the existing
 * authenticated route layer.
 *
 * Example:
 *
 * app.use(
 *   "/api/notifications",
 *   authenticate,
 *   notificationRoutes,
 * )
 */

const router =
  Router()

// Get member notifications
router.get(
  "/",
  getMyNotifications,
)

// Get VAPID public key for device push setup
router.get(
  "/push/public-key",
  getPushPublicKey,
)

// Register a member's browser/device for push notifications
router.post(
  "/push/subscribe",
  subscribeToPush,
)

// Remove a member's browser/device from push notifications
router.delete(
  "/push/unsubscribe",
  unsubscribeFromPush,
)

// Send a real backend-to-device test push
router.post(
  "/push/test",
  sendTestPushNotification,
)

// Mark all notifications as read
router.patch(
  "/read-all",
  markAllNotificationsRead,
)

// Mark one notification as read
router.patch(
  "/:id/read",
  markNotificationRead,
)

export default router
