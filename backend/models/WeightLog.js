import tenantPlugin from './tenantPlugin.js'
import mongoose from "mongoose"

const weightLogSchema =
  new mongoose.Schema(
    {
      member: {
        type:
          mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },

      weight: {
        value: {
          type: Number,
          required: true,
          min: 1,
        },

        unit: {
          type: String,
          enum: [
            "kg",
            "lb",
          ],
          default: "kg",
        },
      },

      recordedAt: {
        type: Date,
        default: Date.now,
      },

      notes: {
        type: String,
        default: "",
        trim: true,
      },
    },
    {
      timestamps: true,
    },
  )

/*
|--------------------------------------------------------------------------
| Indexes
|--------------------------------------------------------------------------
*/

weightLogSchema.index({
  member: 1,
  recordedAt: -1,
})

weightLogSchema.index({
  member: 1,
  createdAt: -1,
})

weightLogSchema.plugin(tenantPlugin)

const WeightLog = mongoose.model(
    "WeightLog",
    weightLogSchema,
  )

export default WeightLog