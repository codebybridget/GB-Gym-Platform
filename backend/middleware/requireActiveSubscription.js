import Subscription from "../models/Subscription.js"

const requireActiveSubscription = async (
  req,
  res,
  next,
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
      return next()
    }

    const subscription =
      await Subscription.findOne({
        user: req.user._id,
        status: "active",
        paymentStatus: "paid",
        endDate: {
          $gt: new Date(),
        },
      }).sort({
        endDate: -1,
      })

    if (!subscription) {
      return res.status(403).json({
        success: false,
        code: "SUBSCRIPTION_REQUIRED",
        message:
          "Your membership subscription has expired or is not active.",
      })
    }

    req.subscription = subscription
    return next()
  } catch (error) {
    console.error(
      "Subscription authorization error:",
      error,
    )

    return res.status(500).json({
      success: false,
      message:
        "Unable to verify membership subscription.",
    })
  }
}

export default requireActiveSubscription
