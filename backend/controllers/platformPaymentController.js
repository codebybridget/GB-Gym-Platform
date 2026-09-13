import PlatformTransaction from "../models/PlatformTransaction.js"
import GymSubscription from "../models/GymSubscription.js"
import Gym from "../models/Gym.js"
import User from "../models/User.js"
import { verifyPaystackTransaction } from "../services/paymentService.js"

const periodEndFrom = (subscription, start = new Date()) => {
  const days = subscription?.billingCycle === "yearly" ? 365 : 30
  return new Date(start.getTime() + days * 24 * 60 * 60 * 1000)
}

const activateSubscription = async (subscriptionId, transactionReference, paidAt = new Date()) => {
  if (!subscriptionId) return null

  const sub = await GymSubscription.findById(subscriptionId)
  if (!sub) return null

  const now = new Date()
  const start = sub.startDate && new Date(sub.startDate) <= now ? new Date(sub.startDate) : paidAt
  const existingEnd = sub.currentPeriodEnd ? new Date(sub.currentPeriodEnd) : null
  const currentPeriodEnd = existingEnd && existingEnd > now ? existingEnd : periodEndFrom(sub, paidAt)

  // There must be one current active subscription per gym. Older active/trial/pending
  // subscriptions remain in history but are no longer current after a successful payment.
  await GymSubscription.updateMany(
    {
      gym: sub.gym,
      _id: { $ne: sub._id },
      status: { $in: ["active", "trial", "pending"] },
    },
    {
      $set: {
        status: "cancelled",
        cancelledAt: now,
      },
    },
  )

  const updated = await GymSubscription.findByIdAndUpdate(
    sub._id,
    {
      $set: {
        status: "active",
        paymentStatus: "paid",
        startDate: sub.startDate || start,
        currentPeriodStart: sub.currentPeriodStart || paidAt,
        currentPeriodEnd,
        nextBillingDate: currentPeriodEnd,
        transactionReference: sub.transactionReference || transactionReference,
        cancelledAt: null,
        suspendedAt: null,
      },
    },
    { new: true },
  )

  if (updated?.gym) await Gym.findByIdAndUpdate(updated.gym, { isActive: true })
  if (updated?.owner) await User.findByIdAndUpdate(updated.owner, { isActive: true })
  return updated
}

export const verifyPlatformPayment = async (req, res) => {
  try {
    const reference = String(req.params.reference || req.body.reference || "").trim()
    if (!reference) return res.status(400).json({ success: false, message: "Payment reference is required." })

    const tx = await PlatformTransaction.findOne({ reference })
    if (!tx) return res.status(404).json({ success: false, message: "Platform transaction not found." })

    // Idempotent verification: a successful transaction must still leave the linked
    // subscription and gym in the correct active state.
    if (tx.status === "success") {
      const sub = await activateSubscription(tx.subscription, tx.reference, tx.paidAt || new Date())
      return res.json({ success: true, transaction: tx, subscription: sub })
    }

    const response = await verifyPaystackTransaction(reference)
    const data = response?.data

    if (!response?.status || !data) {
      return res.status(400).json({ success: false, message: response?.message || "Verification failed." })
    }

    const expectedAmount = Math.round(Number(tx.amount) * 100)
    const actualAmount = Number(data.amount)
    const actualCurrency = String(data.currency || tx.currency || "").toUpperCase()
    const expectedCurrency = String(tx.currency || "").toUpperCase()

    if (data.status !== "success" || actualAmount !== expectedAmount || (expectedCurrency && actualCurrency && actualCurrency !== expectedCurrency)) {
      tx.status = data.status === "failed" ? "failed" : "failed"
      tx.gatewayResponse = data
      tx.channel = data.channel || tx.channel || ""
      await tx.save()
      return res.status(400).json({ success: false, message: "Payment verification failed." })
    }

    tx.status = "success"
    tx.transactionId = String(data.id || "")
    tx.channel = data.channel || ""
    tx.paidAt = data.paid_at ? new Date(data.paid_at) : new Date()
    tx.gatewayResponse = data
    await tx.save()

    const subscription = await activateSubscription(tx.subscription, tx.reference, tx.paidAt)

    if (!subscription) {
      return res.status(500).json({ success: false, message: "Payment succeeded, but the GB subscription could not be resolved." })
    }

    return res.json({ success: true, transaction: tx, subscription })
  } catch (error) {
    console.error("Platform payment verification error:", error)
    return res.status(500).json({ success: false, message: error.message || "Unable to verify platform payment." })
  }
}
