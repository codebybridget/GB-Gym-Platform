import tenantPlugin from './tenantPlugin.js'
import mongoose from "mongoose"

const exerciseSchema =
  new mongoose.Schema(
    {
      /*
      |--------------------------------------------------------------------------
      | Basic Information
      |--------------------------------------------------------------------------
      */

      name: {
        type: String,
        required: true,
        trim: true,
      },

      category: {
        type: String,
        required: true,
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

      /*
      |--------------------------------------------------------------------------
      | Muscle Information
      |--------------------------------------------------------------------------
      */

      muscleGroup: {
        type: String,
        default: "",
        trim: true,
      },

      secondaryMuscles: {
        type: [String],
        default: [],
      },

      /*
      |--------------------------------------------------------------------------
      | Recommendation Targeting
      |--------------------------------------------------------------------------
      |
      | These fields are arrays because an exercise can apply to
      | multiple genders and multiple fitness goals.
      |
      */

      targetGender: {
        type: [
          {
            type: String,
            enum: [
              "Male",
              "Female",
            ],
          },
        ],
        default: [
          "Male",
          "Female",
        ],
      },

      fitnessGoals: {
        type: [
          {
            type: String,
            enum: [
              "Lose Weight",
              "Keep Fit",
              "Gain Weight",
              "Train to Become a Trainer",
            ],
          },
        ],
        default: [],
      },

      /*
      |--------------------------------------------------------------------------
      | Exercise Details
      |--------------------------------------------------------------------------
      */

      description: {
        type: String,
        default: "",
        trim: true,
      },

      instructions: {
        type: [String],
        default: [],
      },

      safetyTips: {
        type: [String],
        default: [],
      },

      equipment: {
        type: [String],
        default: [],
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

      /*
      |--------------------------------------------------------------------------
      | Workout Defaults
      |--------------------------------------------------------------------------
      */

      defaultSets: {
        type: Number,
        default: 3,
        min: 1,
      },

      defaultReps: {
        type: Number,
        default: null,
        min: 1,
      },

      defaultDuration: {
        type: Number,
        default: null,
        min: 1,
      },

      defaultRest: {
        type: Number,
        default: 60,
        min: 0,
      },

      caloriesEstimate: {
        type: Number,
        default: null,
        min: 0,
      },

      /*
      |--------------------------------------------------------------------------
      | Exercise Image
      |--------------------------------------------------------------------------
      */

      imageUrl: {
        type: String,
        default: "",
        trim: true,
      },

      imagePublicId: {
        type: String,
        default: "",
        trim: true,
      },

      /*
      |--------------------------------------------------------------------------
      | Exercise Video
      |--------------------------------------------------------------------------
      */

      videoUrl: {
        type: String,
        default: "",
        trim: true,
      },

      videoPublicId: {
        type: String,
        default: "",
        trim: true,
      },

      /*
      |--------------------------------------------------------------------------
      | Status
      |--------------------------------------------------------------------------
      */

      isActive: {
        type: Boolean,
        default: true,
      },

      /*
      |--------------------------------------------------------------------------
      | Audit
      |--------------------------------------------------------------------------
      */

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


/*
|--------------------------------------------------------------------------
| Indexes
|--------------------------------------------------------------------------
*/

/*
 * Category + active status index.
 *
 * This is safe because both fields are scalar values.
 */

exerciseSchema.index({
  category: 1,
  isActive: 1,
})


/*
 * Text search index.
 *
 * This allows the exercise library to search by:
 * - name
 * - description
 * - primary muscle group
 */

exerciseSchema.index({
  name: "text",
  description: "text",
  muscleGroup: "text",
})


/*
|--------------------------------------------------------------------------
| Model
|--------------------------------------------------------------------------
*/

exerciseSchema.plugin(tenantPlugin)

const Exercise = mongoose.model(
  "Exercise",
  exerciseSchema,
)

export default Exercise