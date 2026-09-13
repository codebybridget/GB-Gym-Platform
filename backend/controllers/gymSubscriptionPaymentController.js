import User from "../models/User.js"
import SaasPlan from "../models/SaasPlan.js"
import GymSubscription from "../models/GymSubscription.js"
import PlatformTransaction from "../models/PlatformTransaction.js"
import crypto from "node:crypto"
import { initializePaystackTransaction } from "../services/paymentService.js"

export const initializeGymSubscription = async (req, res) => {
  try {
    if (req.user.role !== "admin") return res.status(403).json({ success: false, message: "Admin only." })

    const plan = await SaasPlan.findOne({ _id: req.body.planId, active: true })
    if (!plan) return res.status(404).json({ success: false, message: "SaaS plan not found." })

    const user = await User.findById(req.user._id)
    if (!user) return res.status(404).json({ success: false, message: "Admin account not found." })

    const existingPending = await GymSubscription.findOne({
      gym: req.user.gym,
      plan: plan._id,
      status: "pending",
      paymentStatus: "pending",
    }).sort({ createdAt: -1 })

    if (existingPending?.transactionReference) {
      const existingTx = await PlatformTransaction.findOne({ reference: existingPending.transactionReference })
      if (existingTx?.status === "pending") {
        const pay = await initializePaystackTransaction({
          email: user.email,
          amount: plan.price,
          reference: existingTx.reference,
          callbackUrl: `${process.env.FRONTEND_URL || "http://localhost:5173"}/payment/callback`,
          metadata: {
            type: "gym_subscription",
            gymId: String(req.user.gym),
            subscriptionId: String(existingPending._id),
            transactionId: String(existingTx._id),
          },
        })
        return res.json({ success: true, reference: existingTx.reference, authorization_url: pay?.data?.authorization_url, subscription: existingPending })
      }
    }

    const ref = `GB-${Date.now()}-${crypto.randomBytes(4).toString("hex")}`

    const sub = await GymSubscription.create({
      gym: req.user.gym,
      owner: user._id,
      plan: plan._id,
      planName: plan.name,
      amount: plan.price,
      currency: plan.currency,
      billingCycle: plan.billingCycle,
      status: "pending",
      paymentStatus: "pending",
      transactionReference: ref,
    })

    const tx = await PlatformTransaction.create({
      gym: req.user.gym,
      subscription: sub._id,
      plan: plan._id,
      reference: ref,
      amount: plan.price,
      currency: plan.currency,
      status: "pending",
      customerEmail: user.email,
    })

    const pay = await initializePaystackTransaction({
      email: user.email,
      amount: plan.price,
      reference: ref,
      callbackUrl: `${process.env.FRONTEND_URL || "http://localhost:5173"}/payment/callback`,
      metadata: {
        type: "gym_subscription",
        gymId: String(req.user.gym),
        subscriptionId: String(sub._id),
        transactionId: String(tx._id),
      },
    })

    return res.json({
      success: true,
      reference: ref,
      authorization_url: pay?.data?.authorization_url,
      subscription: sub,
    })
  } catch (error) {
    console.error("Initialize gym subscription error:", error)
    return res.status(500).json({ success: false, message: error.message || "Unable to initialize subscription." })
  }
}
