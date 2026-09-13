import tenantPlugin from './tenantPlugin.js'
import mongoose from "mongoose"

const membershipPlanSchema =
  new mongoose.Schema(
    {
      name: {
        type: String,
        required: true,
        trim: true,
      },

      description: {
        type: String,
        trim: true,
        default: "",
      },

      durationDays: {
        type: Number,
        required: true,
        min: 1,
      },

      price: {
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

      features: {
        type: [
          {
            type: String,
            trim: true,
          },
        ],
        default: [],
      },

      isActive: {
        type: Boolean,
        default: true,
      },

      displayOrder: {
        type: Number,
        default: 0,
      },
    },
    {
      timestamps: true,
    },
  )

membershipPlanSchema.plugin(tenantPlugin)

const MembershipPlan = mongoose.model(
    "MembershipPlan",
    membershipPlanSchema,
  )

export default MembershipPlan