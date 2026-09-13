import tenantPlugin from './tenantPlugin.js'
import mongoose from "mongoose"

const paymentSchema =
  new mongoose.Schema(
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
      },

      subscription: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Subscription",
        default: null,
        index: true,
      },

      membershipPlan: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "MembershipPlan",
        required: true,
        index: true,
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

      /*
      |--------------------------------------------------------------------------
      | Paystack Transaction Reference
      |--------------------------------------------------------------------------
      */

      reference: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        index: true,
      },

      /*
      |--------------------------------------------------------------------------
      | Paystack Transaction ID
      |--------------------------------------------------------------------------
      */

      transactionId: {
        type: String,
        trim: true,
        default: "",
      },

      /*
      |--------------------------------------------------------------------------
      | Payment Status
      |--------------------------------------------------------------------------
      */

      status: {
        type: String,
        enum: [
          "pending",
          "success",
          "failed",
          "abandoned",
          "refunded",
        ],
        default: "pending",
        index: true,
      },

      /*
      |--------------------------------------------------------------------------
      | Payment Channel
      |--------------------------------------------------------------------------
      */

      channel: {
        type: String,
        trim: true,
        default: "",
      },

      /*
      |--------------------------------------------------------------------------
      | Customer Information
      |--------------------------------------------------------------------------
      */

      customerEmail: {
        type: String,
        trim: true,
        lowercase: true,
        default: "",
      },

      customerName: {
        type: String,
        trim: true,
        default: "",
      },

      /*
      |--------------------------------------------------------------------------
      | Paystack Response
      |--------------------------------------------------------------------------
      |
      | Stores the gateway response for transaction records,
      | troubleshooting and admin review.
      |
      */

      gatewayResponse: {
        type: mongoose.Schema.Types.Mixed,
        default: null,
      },

      paidAt: {
        type: Date,
        default: null,
      },

      failureReason: {
        type: String,
        trim: true,
        default: "",
      },

      metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: null,
      },
    },
    {
      timestamps: true,
    },
  )

/*
|--------------------------------------------------------------------------
| Helpful indexes
|--------------------------------------------------------------------------
*/

paymentSchema.index({
  user: 1,
  createdAt: -1,
})

paymentSchema.index({
  status: 1,
  createdAt: -1,
})

/*
|--------------------------------------------------------------------------
| Export
|--------------------------------------------------------------------------
*/

paymentSchema.plugin(tenantPlugin)

const Payment = mongoose.model("Payment", paymentSchema)

export default Payment