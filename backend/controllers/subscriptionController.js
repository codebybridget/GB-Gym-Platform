import Subscription from "../models/Subscription.js"

const buildSubscriptionData = (subscription) => {
  if (!subscription) {
    return null
  }

  const now = Date.now()
  const endTime = subscription.endDate
    ? new Date(subscription.endDate).getTime()
    : 0
  const startTime = subscription.startDate
    ? new Date(subscription.startDate).getTime()
    : endTime

  const totalDuration = Math.max(
    1,
    endTime - startTime,
  )
  const remainingDuration = Math.max(
    0,
    endTime - now,
  )

  const daysRemaining =
    Math.max(
      0,
      Math.ceil(
        remainingDuration /
          (1000 * 60 * 60 * 24),
      ),
    )

  const percentageRemaining =
    Math.min(
      100,
      Math.max(
        0,
        Math.round(
          (remainingDuration /
            totalDuration) *
            100,
        ),
      ),
    )

  const data =
    typeof subscription.toObject === "function"
      ? subscription.toObject()
      : { ...subscription }

  return {
    ...data,
    daysRemaining,
    percentageRemaining,
    status:
      endTime > now
        ? "active"
        : "expired",
  }
}

export const getMySubscription = async (
  req,
  res,
) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      })
    }

    if (
      req.user.role === "admin" ||
      req.user.role === "trainer"
    ) {
      return res.status(200).json({
        success: true,
        hasActiveSubscription: true,
        bypass: true,
        subscription: null,
      })
    }

    const subscription =
      await Subscription.findOne({
        user: req.user._id,
        status: "active",
        paymentStatus: "paid",
        endDate: {
          $gt: new Date(),
        },
      })
        .populate(
          "membershipPlan",
          "name description durationDays price currency features",
        )
        .sort({
          endDate: -1,
        })

    if (!subscription) {
      return res.status(200).json({
        success: true,
        hasActiveSubscription: false,
        bypass: false,
        subscription: null,
      })
    }

    return res.status(200).json({
      success: true,
      hasActiveSubscription: true,
      bypass: false,
      subscription: buildSubscriptionData(
        subscription,
      ),
    })
  } catch (error) {
    console.error(
      "Get my subscription error:",
      error,
    )

    return res.status(500).json({
      success: false,
      message:
        "Unable to check your membership subscription.",
    })
  }
}
