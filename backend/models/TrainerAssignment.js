import tenantPlugin from './tenantPlugin.js'
import mongoose from "mongoose"

const trainerAssignmentSchema =
  new mongoose.Schema(
    {
      trainer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },

      member: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },

      assignedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },

      status: {
        type: String,
        enum: [
          "active",
          "inactive",
        ],
        default: "active",
      },
    },
    {
      timestamps: true,
    },
  )

trainerAssignmentSchema.index(
  {
    trainer: 1,
    member: 1,
  },
  {
    unique: true,
  },
)

trainerAssignmentSchema.index({
  trainer: 1,
  status: 1,
})

trainerAssignmentSchema.index({
  member: 1,
  status: 1,
})

trainerAssignmentSchema.plugin(tenantPlugin)

const TrainerAssignment = mongoose.model(
    "TrainerAssignment",
    trainerAssignmentSchema,
  )

export default TrainerAssignment