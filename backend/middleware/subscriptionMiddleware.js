import Subscription from "../models/Subscription.js"

/*
|--------------------------------------------------------------------------
| Require Active Subscription
|--------------------------------------------------------------------------
|
| Members must have a valid active subscription before accessing
| protected gym functionality.
|
| Admins and trainers are not blocked by this middleware.
|
*/

export const requireActiveSubscription = async (
  req,
  res,
  next,
) => {
  try {
    /*
    |--------------------------------------------------------------------------
    | Authentication check
    |--------------------------------------------------------------------------
    */

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      })
    }

    /*
    |--------------------------------------------------------------------------
    | Admin / Trainer bypass
    |--------------------------------------------------------------------------
    |
    | Staff accounts do not need a membership payment to use
    | the management side of the application.
    |
    */

    if (
      req.user.role === "admin" ||
      req.user.role === "trainer"
    ) {
      return next()
    }

    /*
    |--------------------------------------------------------------------------
    | Only members require a subscription
    |--------------------------------------------------------------------------
    */

    if (req.user.role !== "member") {
      return res.status(403).json({
        success: false,
        message: "Access denied.",
      })
    }

    /*
    |--------------------------------------------------------------------------
    | Find the user's active subscription
    |--------------------------------------------------------------------------
    */

    const subscription =
      await Subscription.findOne({
        user: req.user._id,
        status: "active",
        paymentStatus: "paid",
        endDate: {
          $gt: new Date(),
        },
      })
        .sort({
          endDate: -1,
        })

    /*
    |--------------------------------------------------------------------------
    | No valid subscription
    |--------------------------------------------------------------------------
    */

    if (!subscription) {
      return res.status(402).json({
        success: false,
        code: "SUBSCRIPTION_REQUIRED",
        message:
          "An active membership subscription is required to access this feature.",
      })
    }

    /*
    |--------------------------------------------------------------------------
    | Attach subscription to request
    |--------------------------------------------------------------------------
    |
    | Controllers can use req.subscription if they need
    | membership information.
    |
    */

    req.subscription = subscription

    next()
  } catch (error) {
    console.error(
      "Subscription middleware error:",
      error,
    )

    return res.status(500).json({
      success: false,
      message:
        "Unable to verify membership subscription.",
    })
  }
}