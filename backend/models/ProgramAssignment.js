import tenantPlugin from './tenantPlugin.js'
import mongoose from "mongoose"

const programAssignmentSchema = new mongoose.Schema(
  {
    /*
    |--------------------------------------------------------------------------
    | Member
    |--------------------------------------------------------------------------
    */

    member: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    /*
    |--------------------------------------------------------------------------
    | Program
    |--------------------------------------------------------------------------
    */

    program: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Program",
      required: true,
      index: true,
    },

    /*
    |--------------------------------------------------------------------------
    | Assigned By
    |--------------------------------------------------------------------------
    */

    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    /*
    |--------------------------------------------------------------------------
    | Workout Date
    |--------------------------------------------------------------------------
    |
    | Exact calendar date on which the member should perform the workout.
    |
    */

    workoutDate: {
      type: Date,
      required: true,
      index: true,
    },

    /*
    |--------------------------------------------------------------------------
    | Day Of Week
    |--------------------------------------------------------------------------
    |
    | Automatically derived from workoutDate.
    |
    */

    dayOfWeek: {
      type: String,
      enum: [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
      ],
      required: true,
      index: true,
    },

    /*
    |--------------------------------------------------------------------------
    | Workout Start Time
    |--------------------------------------------------------------------------
    |
    | Stored as a local clock time, for example "06:00".
    | The workoutDate + startTime together determine when the reminder
    | should be triggered.
    |
    */

    startTime: {
      type: String,
      default: "",
      trim: true,
      match: /^([01]\d|2[0-3]):([0-5]\d)$/,
    },

    /*
    |--------------------------------------------------------------------------
    | Workout End Time
    |--------------------------------------------------------------------------
    |
    | Stored as a local clock time, for example "07:00".
    |
    */

    endTime: {
      type: String,
      default: "",
      trim: true,
      match: /^([01]\d|2[0-3]):([0-5]\d)$/,
    },

    /*
    |--------------------------------------------------------------------------
    | Workout Reminder
    |--------------------------------------------------------------------------
    |
    | Reminder is enabled by default when a workout time is supplied.
    |
    */

    reminderEnabled: {
      type: Boolean,
      default: true,
      index: true,
    },

    /*
    |--------------------------------------------------------------------------
    | Reminder Minutes Before
    |--------------------------------------------------------------------------
    |
    | Allows the system to send an optional early reminder.
    | Example: 5 means 5 minutes before the scheduled start time.
    |
    */

    reminderMinutesBefore: {
      type: Number,
      default: 5,
      min: 0,
      max: 60,
    },

    /*
    |--------------------------------------------------------------------------
    | Status
    |--------------------------------------------------------------------------
    */

    status: {
      type: String,
      enum: [
        "active",
        "completed",
        "cancelled",
      ],
      default: "active",
      index: true,
    },

    /*
    |--------------------------------------------------------------------------
    | Notes
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
|
| These indexes support:
|
| 1. Finding a member's workout for a specific date.
| 2. Listing a member's assignments.
| 3. Finding assignments for a particular program.
| 4. Finding active assignments that can generate reminders.
|
*/

programAssignmentSchema.index({
  member: 1,
  workoutDate: 1,
  status: 1,
})

programAssignmentSchema.index({
  member: 1,
  status: 1,
  workoutDate: 1,
})

programAssignmentSchema.index({
  program: 1,
  status: 1,
})

programAssignmentSchema.index({
  workoutDate: 1,
  startTime: 1,
  status: 1,
  reminderEnabled: 1,
})

/*
|--------------------------------------------------------------------------
| Model
|--------------------------------------------------------------------------
*/

programAssignmentSchema.plugin(tenantPlugin)

const ProgramAssignment = mongoose.model(
  "ProgramAssignment",
  programAssignmentSchema,
)

export default ProgramAssignment
