import tenantPlugin from './tenantPlugin.js'
import mongoose from "mongoose"

const subscriptionSchema =
  new mongoose.Schema(
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
      },

      membershipPlan: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "MembershipPlan",
        required: true,
        index: true,
      },

      planName: {
        type: String,
        required: true,
        trim: true,
      },

      amount: {
        type: Number,
        required: true,
        min: 0,
      },

      currency: {
        type: String,
        trim: true,
        uppercase: true,
        default: "NGN",
      },

      startDate: {
        type: Date,
        default: null,
      },

      endDate: {
        type: Date,
        default: null,
      },

      status: {
        type: String,
        enum: [
          "pending",
          "active",
          "expired",
          "cancelled",
        ],
        default: "pending",
        index: true,
      },

      paymentStatus: {
        type: String,
        enum: [
          "pending",
          "paid",
          "failed",
          "refunded",
        ],
        default: "pending",
        index: true,
      },

      paymentReference: {
        type: String,
        trim: true,
        default: "",
        index: true,
      },

      autoRenew: {
        type: Boolean,
        default: false,
      },

      cancelledAt: {
        type: Date,
        default: null,
      },

      notes: {
        type: String,
        trim: true,
        default: "",
      },
    },
    {
      timestamps: true,
    },
  )

/*
|--------------------------------------------------------------------------
| One user can have many subscriptions over time.
|--------------------------------------------------------------------------
*/

subscriptionSchema.index({
  user: 1,
  createdAt: -1,
})

/*
|--------------------------------------------------------------------------
| Export
|--------------------------------------------------------------------------
*/

subscriptionSchema.plugin(tenantPlugin)

const Subscription = mongoose.model("Subscription", subscriptionSchema)

export default Subscription