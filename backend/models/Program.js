import tenantPlugin from "./tenantPlugin.js"
import mongoose from "mongoose"

const programExerciseSchema =
  new mongoose.Schema(
    {
      exercise: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Exercise",
        required: true,
      },

      order: {
        type: Number,
        required: true,
        min: 1,
      },

      sets: {
        type: Number,
        default: 3,
        min: 1,
      },

      reps: {
        type: Number,
        default: null,
        min: 1,
      },

      duration: {
        type: Number,
        default: null,
        min: 1,
      },

      rest: {
        type: Number,
        default: 60,
        min: 0,
      },

      notes: {
        type: String,
        default: "",
        trim: true,
      },
    },
    {
      _id: true,
    },
  )

const programSchema =
  new mongoose.Schema(
    {
      name: {
        type: String,
        required: true,
        trim: true,
      },

      description: {
        type: String,
        default: "",
        trim: true,
      },

      goal: {
        type: String,
        default: "",
      },

      durationWeeks: {
        type: Number,
        default: 0,
        min: 0,
      },

      workoutType: {
        type: String,
        required: false,
        enum: [
          "Upper Body",
          "Lower Body",
          "Full Body",
          "Core",
          "Cardio",
          "HIIT",
          "Tabata",
          "CrossFit",
          "Strength Training",
          "Functional Training",
          "Mobility & Flexibility",
          "Plyometrics",
        ],
      },

      difficulty: {
        type: String,
        enum: [
          "Beginner",
          "Intermediate",
          "Advanced",
        ],
        default: "Beginner",
      },

      estimatedDuration: {
        type: Number,
        default: null,
        min: 1,
      },

      exercises: {
        type: [
          programExerciseSchema,
        ],
        default: [],
      },

      days: {
        type: mongoose.Schema.Types.Mixed,
        default: [],
      },

      trainerNotes: {
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
        required: true,
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

programSchema.index({
  workoutType: 1,
  isActive: 1,
})

programSchema.index({
  name: "text",
  description: "text",
})

programSchema.plugin(tenantPlugin)

const Program = mongoose.model(
  "Program",
  programSchema,
)

export default Program