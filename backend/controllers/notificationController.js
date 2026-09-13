import Notification from "../models/Notification.js"
import User from "../models/User.js"
import webPush from "web-push"

function normalizePushSubscription(
  subscription,
) {
  if (!subscription) {
    return null
  }

  const endpoint =
    String(
      subscription.endpoint || "",
    ).trim()

  const p256dh =
    String(
      subscription?.keys?.p256dh ||
        "",
    ).trim()

  const auth =
    String(
      subscription?.keys?.auth || "",
    ).trim()

  if (
    !endpoint ||
    !p256dh ||
    !auth
  ) {
    return null
  }

  return {
    endpoint,
    expirationTime:
      subscription.expirationTime ??
      null,
    keys: {
      p256dh,
      auth,
    },
    updatedAt: new Date(),
  }
}

export async function getMyNotifications(
  req,
  res,
) {
  try {
    const limit = Math.min(
      Number(
        req.query.limit || 30,
      ),
      100,
    )

    const notifications =
      await Notification.find({
        user: req.user._id,
      })
        .sort({
          createdAt: -1,
        })
        .limit(limit)

    const unreadCount =
      await Notification.countDocuments({
        user: req.user._id,
        read: false,
      })

    return res.status(200).json({
      success: true,
      notifications,
      unreadCount,
    })
  } catch (error) {
    console.error(
      "Get notifications error:",
      error,
    )

    return res.status(500).json({
      success: false,
      message:
        "Unable to retrieve notifications.",
    })
  }
}

export async function markNotificationRead(
  req,
  res,
) {
  try {
    const notification =
      await Notification.findOneAndUpdate(
        {
          _id:
            req.params.id,
          user:
            req.user._id,
        },
        {
          read: true,
        },
        {
          new: true,
        },
      )

    if (!notification) {
      return res.status(404).json({
        success: false,
        message:
          "Notification not found.",
      })
    }

    return res.status(200).json({
      success: true,
      notification,
    })
  } catch (error) {
    console.error(
      "Mark notification read error:",
      error,
    )

    return res.status(500).json({
      success: false,
      message:
        "Unable to update notification.",
    })
  }
}

export async function markAllNotificationsRead(
  req,
  res,
) {
  try {
    await Notification.updateMany(
      {
        user:
          req.user._id,
        read: false,
      },
      {
        $set: {
          read: true,
        },
      },
    )

    return res.status(200).json({
      success: true,
      message:
        "All notifications marked as read.",
    })
  } catch (error) {
    console.error(
      "Mark all notifications read error:",
      error,
    )

    return res.status(500).json({
      success: false,
      message:
        "Unable to update notifications.",
    })
  }
}

export async function subscribeToPush(
  req,
  res,
) {
  try {
    const subscription =
      normalizePushSubscription(
        req.body?.subscription ||
          req.body,
      )

    if (!subscription) {
      return res.status(400).json({
        success: false,
        message:
          "A valid push subscription is required.",
      })
    }

    const user =
      await User.findById(
        req.user._id,
      )

    if (!user) {
      return res.status(404).json({
        success: false,
        message:
          "User not found.",
      })
    }

    if (
      !Array.isArray(
        user.pushSubscriptions,
      )
    ) {
      user.pushSubscriptions = []
    }

    const existingIndex =
      user.pushSubscriptions.findIndex(
        (item) =>
          item.endpoint ===
          subscription.endpoint,
      )

    if (existingIndex >= 0) {
      user.pushSubscriptions[
        existingIndex
      ] = {
        ...user.pushSubscriptions[
          existingIndex
        ].toObject?.() ||
          user.pushSubscriptions[
            existingIndex
          ],
        ...subscription,
      }
    } else {
      user.pushSubscriptions.push(
        subscription,
      )
    }

    await user.save()

    return res.status(200).json({
      success: true,
      message:
        "Device notifications enabled.",
    })
  } catch (error) {
    console.error(
      "Subscribe to push error:",
      error,
    )

    return res.status(500).json({
      success: false,
      message:
        "Unable to enable device notifications.",
    })
  }
}

export async function unsubscribeFromPush(
  req,
  res,
) {
  try {
    const endpoint =
      String(
        req.body?.endpoint || "",
      ).trim()

    if (!endpoint) {
      return res.status(400).json({
        success: false,
        message:
          "Push subscription endpoint is required.",
      })
    }

    const user =
      await User.findById(
        req.user._id,
      )

    if (!user) {
      return res.status(404).json({
        success: false,
        message:
          "User not found.",
      })
    }

    const subscriptions =
      Array.isArray(
        user.pushSubscriptions,
      )
        ? user.pushSubscriptions
        : []

    user.pushSubscriptions =
      subscriptions.filter(
        (item) =>
          item.endpoint !==
          endpoint,
      )

    await user.save()

    return res.status(200).json({
      success: true,
      message:
        "Device notifications disabled.",
    })
  } catch (error) {
    console.error(
      "Unsubscribe from push error:",
      error,
    )

    return res.status(500).json({
      success: false,
      message:
        "Unable to disable device notifications.",
    })
  }
}

export async function getPushPublicKey(
  req,
  res,
) {
  const publicKey =
    process.env.VAPID_PUBLIC_KEY ||
    ""

  if (!publicKey) {
    return res.status(503).json({
      success: false,
      message:
        "Device notification service is not configured.",
    })
  }

  return res.status(200).json({
    success: true,
    publicKey,
  })
}

export async function sendTestPushNotification(
  req,
  res,
) {
  try {
    const publicKey =
      process.env.VAPID_PUBLIC_KEY ||
      ""

    const privateKey =
      process.env.VAPID_PRIVATE_KEY ||
      ""

    const subject =
      process.env.VAPID_SUBJECT ||
      ""

    if (
      !publicKey ||
      !privateKey ||
      !subject
    ) {
      return res.status(503).json({
        success: false,
        message:
          "Device notification service is not configured.",
      })
    }

    const user =
      await User.findById(
        req.user._id,
      )

    if (!user) {
      return res.status(404).json({
        success: false,
        message:
          "User not found.",
      })
    }

    const subscriptions =
      Array.isArray(
        user.pushSubscriptions,
      )
        ? user.pushSubscriptions
        : []

    if (!subscriptions.length) {
      return res.status(400).json({
        success: false,
        message:
          "No device notification subscription was found for this account.",
      })
    }

    webPush.setVapidDetails(
      subject,
      publicKey,
      privateKey,
    )

    const payload =
      JSON.stringify({
        title:
          "GB Test",
        body:
          "Background notifications are working on this device.",
        icon:
          "/favicon.ico",
        badge:
          "/favicon.ico",
        tag:
          `gb-test-${Date.now()}`,
        requireInteraction:
          true,
        url:
          "/weekly-schedule",
      })

    let sent = 0
    let removed = 0

    const invalidEndpoints = []

    for (
      const subscription of subscriptions
    ) {
      try {
        await webPush.sendNotification(
          subscription.toObject?.() ||
            subscription,
          payload,
          {
            TTL: 60,
          },
        )

        sent += 1
      } catch (error) {
        console.error(
          "Test push send error:",
          error,
        )

        if (
          error?.statusCode === 404 ||
          error?.statusCode === 410
        ) {
          invalidEndpoints.push(
            subscription.endpoint,
          )
        }
      }
    }

    if (
      invalidEndpoints.length
    ) {
      user.pushSubscriptions =
        subscriptions.filter(
          (subscription) =>
            !invalidEndpoints.includes(
              subscription.endpoint,
            ),
        )

      removed =
        invalidEndpoints.length

      await user.save()
    }

    if (!sent) {
      return res.status(502).json({
        success: false,
        message:
          "The test notification could not be delivered to any registered device.",
        sent,
        removed,
      })
    }

    return res.status(200).json({
      success: true,
      message:
        "Test push notification sent.",
      sent,
      removed,
    })
  } catch (error) {
    console.error(
      "Send test push notification error:",
      error,
    )

    return res.status(500).json({
      success: false,
      message:
        "Unable to send test device notification.",
    })
  }
}
