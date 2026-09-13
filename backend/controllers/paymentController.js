import axios from "axios"

import User from "../models/User.js"
import Gym from "../models/Gym.js"
import MembershipPlan from "../models/MembershipPlan.js"
import Payment from "../models/Payment.js"
import Subscription from "../models/Subscription.js"

import {
  decryptPaymentSecret,
} from "../utils/paymentEncryption.js"


/*
|--------------------------------------------------------------------------
| Initialize CGF Paystack Payment
|--------------------------------------------------------------------------
*/

export const initializePayment = async (
  req,
  res,
) => {
  try {
    /*
    |--------------------------------------------------------------------------
    | Current User
    |--------------------------------------------------------------------------
    */

    const userId =
      req.user?._id

    if (!userId) {
      return res.status(401).json({
        success: false,
        message:
          "Authentication required.",
      })
    }


    const user =
      await User.findById(
        userId,
      )

    if (!user) {
      return res.status(404).json({
        success: false,
        message:
          "User account not found.",
      })
    }

    if (!user.gym) {
      return res.status(400).json({
        success: false,
        message:
          "Your account is not associated with a gym.",
      })
    }

    const gym =
      await Gym.findById(user.gym)

    if (!gym) {
      return res.status(404).json({
        success: false,
        message:
          "Gym account not found.",
      })
    }

    const paymentSettings = gym.paymentSettings || {}

    if (paymentSettings.provider !== "paystack") {
      return res.status(400).json({
        success: false,
        message:
          "This gym has not configured Paystack for member payments.",
      })
    }

    if (!paymentSettings.enabled) {
      return res.status(400).json({
        success: false,
        message:
          "Member payments are currently disabled for this gym.",
      })
    }

    if (!paymentSettings.secretKeyEncrypted) {
      return res.status(400).json({
        success: false,
        message:
          "This gym has not configured its Paystack secret key.",
      })
    }

    let paystackSecretKey

    try {
      paystackSecretKey = decryptPaymentSecret(
        paymentSettings.secretKeyEncrypted,
      )
    } catch (error) {
      console.error(
        "Unable to decrypt gym Paystack secret:",
        error.message,
      )

      return res.status(500).json({
        success: false,
        message:
          "The gym's Paystack configuration could not be loaded securely.",
      })
    }


    /*
    |--------------------------------------------------------------------------
    | Membership Plan
    |--------------------------------------------------------------------------
    */

    const {
      planId,
    } = req.body

    if (!planId) {
      return res.status(400).json({
        success: false,
        message:
          "Membership plan is required.",
      })
    }


    const plan =
      await MembershipPlan.findById(
        planId,
      )

    if (!plan) {
      return res.status(404).json({
        success: false,
        message:
          "Membership plan not found.",
      })
    }

    if (plan.gym && String(plan.gym) !== String(gym._id)) {
      return res.status(403).json({
        success: false,
        message:
          "This membership plan does not belong to your gym.",
      })
    }


    /*
    |--------------------------------------------------------------------------
    | Active Plan Check
    |--------------------------------------------------------------------------
    */

    if (!plan.isActive) {
      return res.status(400).json({
        success: false,
        message:
          "This membership plan is no longer available.",
      })
    }


    /*
    |--------------------------------------------------------------------------
    | Validate Price
    |--------------------------------------------------------------------------
    */

    const price =
      Number(
        plan.price,
      )

    if (
      !Number.isFinite(
        price,
      ) ||
      price <= 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid membership plan price.",
      })
    }


    /*
    |--------------------------------------------------------------------------
    | Paystack Amount
    |--------------------------------------------------------------------------
    |
    | Paystack expects NGN amounts in kobo.
    |
    | ₦3,000   = 300,000 kobo
    | ₦10,000  = 1,000,000 kobo
    | ₦25,000  = 2,500,000 kobo
    |
    */

    const amount =
      Math.round(
        price * 100,
      )


    /*
    |--------------------------------------------------------------------------
    | Customer Email
    |--------------------------------------------------------------------------
    */

    const email =
      String(
        user.email || "",
      )
        .trim()
        .toLowerCase()

    if (!email) {
      return res.status(400).json({
        success: false,
        message:
          "Your account does not have a valid email address.",
      })
    }


    /*
    |--------------------------------------------------------------------------
    | Callback URL
    |--------------------------------------------------------------------------
    */

    const callbackUrl =
      process.env.PAYSTACK_CALLBACK_URL ||
      `${process.env.CLIENT_URL || "http://localhost:5173"}/payment/callback`


    /*
    |--------------------------------------------------------------------------
    | Initialize Paystack Transaction
    |--------------------------------------------------------------------------
    */

    const response =
      await axios.post(
        "https://api.paystack.co/transaction/initialize",
        {
          email,

          amount:
            String(
              amount,
            ),

          currency:
            String(
              plan.currency ||
                "NGN",
            ).toUpperCase(),

          callback_url:
            callbackUrl,

          metadata:
            {
              userId:
                String(
                  user._id,
                ),

              planId:
                String(
                  plan._id,
                ),

              planName:
                plan.name,

              durationDays:
                plan.durationDays,

              paymentPurpose:
                "CGF Fitness Membership",

              gymId:
                String(gym._id),
            },
        },
        {
          headers: {
            Authorization:
              `Bearer ${paystackSecretKey}`,

            "Content-Type":
              "application/json",
          },
        },
      )


    /*
    |--------------------------------------------------------------------------
    | Paystack Response
    |--------------------------------------------------------------------------
    */

    if (
      !response.data?.status ||
      !response.data?.data
    ) {
      return res.status(502).json({
        success: false,
        message:
          response.data?.message ||
          "CGF Paystack could not initialize the payment.",
      })
    }


    const paymentData =
      response.data.data


    /*
    |--------------------------------------------------------------------------
    | Validate Authorization URL
    |--------------------------------------------------------------------------
    */

    if (
      !paymentData.authorization_url ||
      !paymentData.reference
    ) {
      return res.status(502).json({
        success: false,
        message:
          "CGF Paystack returned an incomplete payment response.",
      })
    }


    /*
    |--------------------------------------------------------------------------
    | Create Pending Payment
    |--------------------------------------------------------------------------
    |
    | Payment is NOT successful yet.
    |
    | Paystack has only initialized the transaction.
    | Verification happens after the customer completes payment.
    |
    */

    const existingPayment =
      await Payment.findOne({
        reference:
          paymentData.reference,
      })


    if (!existingPayment) {
      await Payment.create({
        user:
          user._id,

        gym:
          gym._id,

        membershipPlan:
          plan._id,

        amount:
          price,

        currency:
          plan.currency ||
          "NGN",

        reference:
          paymentData.reference,

        status:
          "pending",

        customerEmail:
          email,

        customerName:
          `${user.firstName || ""} ${user.lastName || ""}`.trim(),

        metadata:
          {
            userId:
              String(
                user._id,
              ),

            planId:
              String(
                plan._id,
              ),

            planName:
              plan.name,

            durationDays:
              plan.durationDays,

            paymentPurpose:
              "CGF Fitness Membership",

            gymId:
              String(gym._id),

            paystackAccessCode:
              paymentData.access_code,
          },
      })
    }


    /*
    |--------------------------------------------------------------------------
    | Return Payment Information
    |--------------------------------------------------------------------------
    */

    return res.status(200).json({
      success: true,

      message:
        "CGF membership payment initialized successfully.",

      authorizationUrl:
        paymentData.authorization_url,

      accessCode:
        paymentData.access_code,

      reference:
        paymentData.reference,

      plan: {
        id:
          plan._id,

        name:
          plan.name,

        price:
          plan.price,

        currency:
          plan.currency,

        durationDays:
          plan.durationDays,
      },
    })
  } catch (error) {
    console.error(
      "Initialize CGF Paystack payment error:",
      error.response?.data ||
        error.message ||
        error,
    )


    const paystackMessage =
      error.response?.data?.message


    return res.status(
      error.response?.status ||
        500,
    ).json({
      success: false,

      message:
        paystackMessage ||
        "Unable to initialize CGF membership payment.",
    })
  }
}


/*
|--------------------------------------------------------------------------
| Verify CGF Paystack Payment
|--------------------------------------------------------------------------
*/

export { verifyPayment } from "./paymentVerificationController.js"
