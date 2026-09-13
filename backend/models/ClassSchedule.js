import tenantPlugin from './tenantPlugin.js'
import mongoose from "mongoose"

const classScheduleSchema =
  new mongoose.Schema(
    {
      dayOfWeek: {
        type: String,
        required: true,
        enum: [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
          "Sunday",
        ],
      },

      trainer: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },

      capacity: { type: Number, default: 0, min: 0 },

      location: { type: String, default: "", trim: true },

      workoutType: {
        type: String,
        required: true,
        enum: [
          "Lower Body",
          "Upper Body",
          "CrossFit",
          "Tabata",
          "Rest",
        ],
      },

      title: {
        type: String,
        required: true,
        trim: true,
      },

      startTime: {
        type: String,
        default: "",
        trim: true,
      },

      endTime: {
        type: String,
        default: "",
        trim: true,
      },

      description: {
        type: String,
        default: "",
        trim: true,
      },

      isActive: {
        type: Boolean,
        default: true,
      },

      createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },

      updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },
    },
    {
      timestamps: true,
    },
  )

classScheduleSchema.index(
  {
    dayOfWeek: 1,
  },
  {
    unique: false,
  },
)

classScheduleSchema.plugin(tenantPlugin)

const ClassSchedule = mongoose.model(
    "ClassSchedule",
    classScheduleSchema,
  )

export default ClassSchedule