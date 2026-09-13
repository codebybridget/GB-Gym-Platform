import User from "../models/User.js"
import Gym from "../models/Gym.js"
import axios from "axios"

import Payment from "../models/Payment.js"
import Subscription from "../models/Subscription.js"
import MembershipPlan from "../models/MembershipPlan.js"

import {
  decryptPaymentSecret,
} from "../utils/paymentEncryption.js"


/*
|--------------------------------------------------------------------------
| Verify Paystack Payment
|--------------------------------------------------------------------------
*/

export const verifyPayment = async (
  req,
  res,
) => {
  try {
    /*
    |--------------------------------------------------------------------------
    | Paystack Secret Key
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
      await User.findById(userId)

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

    const paymentSettings =
      gym.paymentSettings || {}

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
      paystackSecretKey =
        decryptPaymentSecret(
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
    | Payment Reference
    |--------------------------------------------------------------------------
    */

    const {
      reference,
    } = req.body


    if (!reference) {
      return res.status(400).json({
        success: false,
        message:
          "Payment reference is required.",
      })
    }


    /*
    |--------------------------------------------------------------------------
    | Find Pending Payment
    |--------------------------------------------------------------------------
    */

    const payment =
      await Payment.findOne({
        reference:
          String(reference),
        user:
          userId,
      })


    if (!payment) {
      return res.status(404).json({
        success: false,
        message:
          "Payment record not found.",
      })
    }

    const paymentGymId =
      payment.gym
        ? String(payment.gym)
        : payment.metadata?.gymId
          ? String(payment.metadata.gymId)
          : null

    if (
      paymentGymId &&
      paymentGymId !== String(gym._id)
    ) {
      return res.status(403).json({
        success: false,
        message:
          "This payment does not belong to your gym.",
      })
    }


    /*
    |--------------------------------------------------------------------------
    | Prevent Duplicate Processing
    |--------------------------------------------------------------------------
    */

    if (
      payment.status === "success"
    ) {
      const subscription =
        payment.subscription
          ? await Subscription.findById(
              payment.subscription,
            )
          : null

      return res.status(200).json({
        success: true,
        message:
          "Payment has already been verified.",
        payment,
        subscription,
      })
    }


    /*
    |--------------------------------------------------------------------------
    | Verify Transaction With Paystack
    |--------------------------------------------------------------------------
    */

    const response =
      await axios.get(
        `https://api.paystack.co/transaction/verify/${encodeURIComponent(
          reference,
        )}`,
        {
          headers: {
            Authorization:
              `Bearer ${paystackSecretKey}`,

            "Content-Type":
              "application/json",
          },
        },
      )


    const paystackResponse =
      response.data


    /*
    |--------------------------------------------------------------------------
    | Verify Paystack Response
    |--------------------------------------------------------------------------
    */

    if (
      !paystackResponse?.status ||
      !paystackResponse?.data
    ) {
      payment.status =
        "failed"

      payment.failureReason =
        paystackResponse?.message ||
        "Paystack verification failed."

      payment.gatewayResponse =
        paystackResponse

      await payment.save()

      return res.status(400).json({
        success: false,
        message:
          payment.failureReason,
      })
    }


    const transaction =
      paystackResponse.data


    /*
    |--------------------------------------------------------------------------
    | Verify Transaction Status
    |--------------------------------------------------------------------------
    */

    if (
      transaction.status !==
      "success"
    ) {
      payment.status =
        transaction.status ===
        "abandoned"
          ? "abandoned"
          : "failed"

      payment.failureReason =
        transaction.gateway_response ||
        `Payment status: ${transaction.status}`

      payment.gatewayResponse =
        transaction

      payment.channel =
        transaction.channel ||
        undefined

      payment.transactionId =
        transaction.id
          ? String(transaction.id)
          : undefined

      await payment.save()

      return res.status(400).json({
        success: false,
        message:
          payment.failureReason,
        status:
          payment.status,
      })
    }


    /*
    |--------------------------------------------------------------------------
    | Verify Amount
    |--------------------------------------------------------------------------
    |
    | Never trust the frontend or callback alone.
    | Compare Paystack's actual amount with our database amount.
    |
    */

    const expectedAmount =
      Math.round(
        Number(payment.amount) * 100,
      )

    const paidAmount =
      Number(
        transaction.amount,
      )


    if (
      paidAmount !==
      expectedAmount
    ) {
      payment.status =
        "failed"

      payment.failureReason =
        "Payment amount does not match the membership plan."

      payment.gatewayResponse =
        transaction

      await payment.save()

      return res.status(400).json({
        success: false,
        message:
          payment.failureReason,
      })
    }


    /*
    |--------------------------------------------------------------------------
    | Verify Currency
    |--------------------------------------------------------------------------
    */

    const expectedCurrency =
      String(
        payment.currency ||
          "NGN",
      ).toUpperCase()

    const paidCurrency =
      String(
        transaction.currency ||
          "",
      ).toUpperCase()


    if (
      paidCurrency &&
      paidCurrency !==
        expectedCurrency
    ) {
      payment.status =
        "failed"

      payment.failureReason =
        "Payment currency does not match the membership plan."

      payment.gatewayResponse =
        transaction

      await payment.save()

      return res.status(400).json({
        success: false,
        message:
          payment.failureReason,
      })
    }


    const transactionEmail =
      String(
        transaction.customer?.email ||
          transaction.email ||
          "",
      )
        .trim()
        .toLowerCase()

    const userEmail =
      String(user.email || "")
        .trim()
        .toLowerCase()

    if (
      transactionEmail &&
      userEmail &&
      transactionEmail !== userEmail
    ) {
      payment.status =
        "failed"

      payment.failureReason =
        "Payment customer does not match the member account."

      payment.gatewayResponse =
        transaction

      await payment.save()

      return res.status(400).json({
        success: false,
        message:
          payment.failureReason,
      })
    }


    /*
    |--------------------------------------------------------------------------
    | Find Membership Plan
    |--------------------------------------------------------------------------
    */

    const plan =
      await MembershipPlan.findById(
        payment.membershipPlan,
      )


    if (!plan) {
      return res.status(404).json({
        success: false,
        message:
          "Membership plan associated with this payment was not found.",
      })
    }

    if (
      plan.gym &&
      String(plan.gym) !== String(gym._id)
    ) {
      return res.status(403).json({
        success: false,
        message:
          "The membership plan does not belong to this gym.",
      })
    }


    /*
    |--------------------------------------------------------------------------
    | Calculate Subscription Dates
    |--------------------------------------------------------------------------
    */

    const startDate =
      new Date()


    const durationDays =
      Number(
        plan.durationDays,
      )


    if (
      !Number.isFinite(
        durationDays,
      ) ||
      durationDays <= 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid membership plan duration.",
      })
    }


    const endDate =
      new Date(
        startDate,
      )

    endDate.setDate(
      endDate.getDate() +
        durationDays,
    )


    /*
    |--------------------------------------------------------------------------
    | Create Or Reuse Subscription
    |--------------------------------------------------------------------------
    */

    let subscription =
      await Subscription.findOne({
        paymentReference:
          payment.reference,
      })


    if (!subscription) {
      subscription =
        await Subscription.create({
          user:
            userId,

          gym:
            gym._id,

          membershipPlan:
            plan._id,

          planName:
            plan.name,

          amount:
            payment.amount,

          currency:
            payment.currency ||
            "NGN",

          startDate,

          endDate,

          status:
            "active",

          paymentStatus:
            "paid",

          paymentReference:
            payment.reference,

          autoRenew:
            false,

          notes:
            "Membership activated after successful Paystack payment.",
        })
    } else {
      subscription.status =
        "active"

      subscription.paymentStatus =
        "paid"

      subscription.startDate =
        subscription.startDate ||
        startDate

      subscription.endDate =
        subscription.endDate ||
        endDate

      await subscription.save()
    }


    /*
    |--------------------------------------------------------------------------
    | Update Payment
    |--------------------------------------------------------------------------
    */

    payment.status =
      "success"

    payment.transactionId =
      transaction.id
        ? String(transaction.id)
        : undefined

    payment.channel =
      transaction.channel ||
      undefined

    payment.gatewayResponse =
      transaction

    payment.paidAt =
      transaction.paid_at
        ? new Date(
            transaction.paid_at,
          )
        : new Date()

    payment.subscription =
      subscription._id

    payment.failureReason =
      undefined

    await payment.save()


    /*
    |--------------------------------------------------------------------------
    | Return Success
    |--------------------------------------------------------------------------
    */

    return res.status(200).json({
      success: true,

      message:
        "Payment verified successfully. Membership activated.",

      payment,

      subscription,
    })
  } catch (error) {

    console.error(
      "Verify Paystack payment error:",
      error.response?.data ||
        error.message ||
        error,
    )


    const message =
      error.response?.data?.message ||
      "Unable to verify payment."


    return res.status(
      error.statusCode ||
        error.response?.status ||
        500,
    ).json({
      success: false,
      message,
    })
  }
}