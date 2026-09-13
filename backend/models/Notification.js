import mongoose from "mongoose"

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    type: {
      type: String,
      required: true,
      enum: [
        "workout_completed",
        "workout_reminder",
      ],
      index: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    message: {
      type: String,
      required: true,
      trim: true,
    },

    read: {
      type: Boolean,
      default: false,
      index: true,
    },

    workoutLog: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "WorkoutLog",
      default: null,
      index: true,
    },

    workoutDate: {
      type: Date,
      default: null,
      index: true,
    },

    emailSent: {
      type: Boolean,
      default: false,
    },

    emailSentAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
)

notificationSchema.index({
  user: 1,
  type: 1,
  workoutDate: 1,
})

const Notification = mongoose.model(
  "Notification",
  notificationSchema,
)

export default Notification
