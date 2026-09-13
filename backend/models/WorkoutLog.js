import tenantPlugin from './tenantPlugin.js'
import mongoose from "mongoose"

const completedSetSchema =
  new mongoose.Schema(
    {
      setNumber: {
        type: Number,
        required: true,
        min: 1,
      },

      completed: {
        type: Boolean,
        default: false,
      },

      actualReps: {
        type: Number,
        default: null,
        min: 0,
      },

      actualWeight: {
        type: String,
        default: "",
        trim: true,
      },

      completedAt: {
        type: Date,
        default: null,
      },
    },
    {
      _id: false,
    },
  )

const workoutExerciseSchema =
  new mongoose.Schema(
    {
      exercise: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Exercise",
        required: true,
      },

      sets: {
        type: [
          completedSetSchema,
        ],
        default: [],
      },
    },
    {
      _id: false,
    },
  )

const workoutLogSchema =
  new mongoose.Schema(
    {
      /*
      |--------------------------------------------------------------------------
      | Member
      |--------------------------------------------------------------------------
      */

      member: {
        type:
          mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },

      /*
      |--------------------------------------------------------------------------
      | Program
      |--------------------------------------------------------------------------
      */

      program: {
        type:
          mongoose.Schema.Types.ObjectId,
        ref: "Program",
        required: true,
      },

      /*
      |--------------------------------------------------------------------------
      | Workout date
      |--------------------------------------------------------------------------
      */

      workoutDate: {
        type: Date,
        required: true,
      },

      /*
      |--------------------------------------------------------------------------
      | Exercises and completed sets
      |--------------------------------------------------------------------------
      */

      exercises: {
        type: [
          workoutExerciseSchema,
        ],
        default: [],
      },

      /*
      |--------------------------------------------------------------------------
      | Workout completion
      |--------------------------------------------------------------------------
      */

      completed: {
        type: Boolean,
        default: false,
      },

      completedAt: {
        type: Date,
        default: null,
      },

      /*
      |--------------------------------------------------------------------------
      | Calories burned
      |--------------------------------------------------------------------------
      |
      | Estimated calories burned for this completed workout.
      |
      */

      caloriesBurned: {
        type: Number,
        default: 0,
        min: 0,
      },

      /*
      |--------------------------------------------------------------------------
      | Member notes
      |--------------------------------------------------------------------------
      */

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

workoutLogSchema.index({
  member: 1,
  workoutDate: 1,
})

workoutLogSchema.index({
  member: 1,
  program: 1,
})

workoutLogSchema.index({
  completed: 1,
  completedAt: -1,
})

workoutLogSchema.index({
  member: 1,
  completed: 1,
  completedAt: -1,
})

/*
|--------------------------------------------------------------------------
| Model
|--------------------------------------------------------------------------
*/

workoutLogSchema.plugin(tenantPlugin)

const WorkoutLog = mongoose.model(
    "WorkoutLog",
    workoutLogSchema,
  )

export default WorkoutLog