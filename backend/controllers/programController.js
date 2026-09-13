import Program from "../models/Program.js"
import Exercise from "../models/Exercise.js"

const getPrograms =
  async (req, res) => {
    try {
      const {
        workoutType,
        difficulty,
        search,
        active,
      } = req.query

      const filter = {}

      if (workoutType) {
        filter.workoutType =
          workoutType
      }

      if (difficulty) {
        filter.difficulty =
          difficulty
      }

      /*
      |--------------------------------------------------------------------------
      | Active program filtering
      |--------------------------------------------------------------------------
      |
      | When active=true:
      | - Include programs explicitly marked isActive: true
      | - Also include older programs where isActive does not exist
      |
      | When active=false:
      | - Only return programs explicitly marked inactive
      |
      |--------------------------------------------------------------------------
      */

      if (active !== undefined) {
        if (active === "true") {
          filter.$or = [
            {
              isActive: true,
            },
            {
              isActive: {
                $exists: false,
              },
            },
          ]
        } else {
          filter.isActive = false
        }
      }

      if (search?.trim()) {
        const value =
          search.trim()

        const searchConditions = [
          {
            name: {
              $regex: value,
              $options: "i",
            },
          },
          {
            description: {
              $regex: value,
              $options: "i",
            },
          },
        ]

        /*
        |--------------------------------------------------------------------------
        | Preserve the active filter while adding search conditions
        |--------------------------------------------------------------------------
        */

        if (filter.$or) {
          filter.$and = [
            {
              $or: filter.$or,
            },
            {
              $or: searchConditions,
            },
          ]

          delete filter.$or
        } else {
          filter.$or =
            searchConditions
        }
      }

      const programs =
        await Program.find(
          filter,
        )
          .populate({
            path:
              "exercises.exercise",
            select:
              "name category muscleGroup difficulty imageUrl videoUrl",
          })
          .populate(
            "createdBy",
            "firstName lastName role",
          )
          .populate(
            "updatedBy",
            "firstName lastName role",
          )
          .sort({
            createdAt: -1,
          })

      return res.status(200).json({
        success: true,
        count:
          programs.length,
        programs,
      })
    } catch (error) {
      console.error(
        "Get programs error:",
        error,
      )

      return res.status(500).json({
        success: false,
        message:
          "Unable to retrieve programs.",
      })
    }
  }

const getProgramById =
  async (req, res) => {
    try {
      const program =
        await Program.findById(
          req.params.id,
        )
          .populate({
            path:
              "exercises.exercise",
            select:
              "name category muscleGroup difficulty description instructions equipment imageUrl videoUrl",
          })
          .populate(
            "createdBy",
            "firstName lastName role",
          )
          .populate(
            "updatedBy",
            "firstName lastName role",
          )

      if (!program) {
        return res.status(404).json({
          success: false,
          message:
            "Program not found.",
        })
      }

      return res.status(200).json({
        success: true,
        program,
      })
    } catch (error) {
      console.error(
        "Get program error:",
        error,
      )

      return res.status(500).json({
        success: false,
        message:
          "Unable to retrieve program.",
      })
    }
  }

const validateExercises =
  async (exercises) => {
    if (
      !Array.isArray(
        exercises,
      )
    ) {
      throw new Error(
        "Exercises must be an array.",
      )
    }

    if (
      exercises.length === 0
    ) {
      throw new Error(
        "A program must contain at least one exercise.",
      )
    }

    const exerciseIds =
      exercises.map(
        (item) =>
          item.exercise,
      )

    const uniqueIds =
      new Set(
        exerciseIds.map(
          String,
        ),
      )

    if (
      uniqueIds.size !==
      exerciseIds.length
    ) {
      throw new Error(
        "An exercise cannot be added more than once to the same program.",
      )
    }

    const foundExercises =
      await Exercise.find({
        _id: {
          $in: exerciseIds,
        },

        isActive: true,
      }).select(
        "_id category",
      )

    if (
      foundExercises.length !==
      exerciseIds.length
    ) {
      throw new Error(
        "One or more selected exercises were not found or are inactive.",
      )
    }

    return foundExercises
  }

const normalizeExercises =
  (exercises) => {
    return exercises.map(
      (item, index) => ({
        exercise:
          item.exercise,

        order:
          Number(
            item.order ??
              index + 1,
          ),

        sets:
          Number(
            item.sets ?? 3,
          ),

        reps:
          item.reps ===
            null ||
          item.reps ===
            undefined ||
          item.reps ===
            ""
            ? null
            : Number(
                item.reps,
              ),

        duration:
          item.duration ===
            null ||
          item.duration ===
            undefined ||
          item.duration ===
            ""
            ? null
            : Number(
                item.duration,
              ),

        rest:
          Number(
            item.rest ?? 60,
          ),

        weight:
          item.weight === null ||
          item.weight === undefined ||
          item.weight === ""
            ? null
            : Number(item.weight),

        workInterval:
          item.workInterval === null ||
          item.workInterval === undefined ||
          item.workInterval === ""
            ? null
            : Number(item.workInterval),

        restInterval:
          item.restInterval === null ||
          item.restInterval === undefined ||
          item.restInterval === ""
            ? null
            : Number(item.restInterval),

        rounds:
          item.rounds === null ||
          item.rounds === undefined ||
          item.rounds === ""
            ? null
            : Number(item.rounds),

        notes:
          item.notes
            ?.trim() || "",
      }),
    )
  }

const validateProgramExercises =
  (exercises) => {
    for (
      const item of exercises
    ) {
      if (
        !Number.isInteger(
          item.sets,
        ) ||
        item.sets < 1
      ) {
        throw new Error(
          "Sets must be a whole number greater than zero.",
        )
      }

      if (
        item.reps !== null &&
        (!Number.isInteger(
          item.reps,
        ) ||
          item.reps < 1)
      ) {
        throw new Error(
          "Reps must be a whole number greater than zero.",
        )
      }

      if (
        item.duration !==
          null &&
        (!Number.isInteger(
          item.duration,
        ) ||
          item.duration < 1)
      ) {
        throw new Error(
          "Duration must be greater than zero.",
        )
      }

      if (
        !Number.isInteger(
          item.rest,
        ) ||
        item.rest < 0
      ) {
        throw new Error(
          "Rest must be zero or greater.",
        )
      }

      if (
        item.weight !== null &&
        (!Number.isFinite(item.weight) ||
          item.weight < 0)
      ) {
        throw new Error(
          "Weight must be zero or greater.",
        )
      }

      if (
        item.workInterval !== null &&
        (!Number.isInteger(item.workInterval) ||
          item.workInterval < 1)
      ) {
        throw new Error(
          "Work interval must be greater than zero.",
        )
      }

      if (
        item.restInterval !== null &&
        (!Number.isInteger(item.restInterval) ||
          item.restInterval < 0)
      ) {
        throw new Error(
          "Rest interval must be zero or greater.",
        )
      }

      if (
        item.rounds !== null &&
        (!Number.isInteger(item.rounds) ||
          item.rounds < 1)
      ) {
        throw new Error(
          "Rounds must be a whole number greater than zero.",
        )
      }
    }
  }

const createProgram =
  async (req, res) => {
    try {
      const {
        name,
        description,
        workoutType,
        difficulty,
        estimatedDuration,
        exercises,
        trainerNotes,
      } = req.body

      if (
        !name?.trim() ||
        !workoutType
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Program name and workout type are required.",
        })
      }

      const existing =
        await Program.findOne({
          name: {
            $regex:
              `^${name.trim()}$`,
            $options: "i",
          },

          workoutType,
        })

      if (existing) {
        return res.status(409).json({
          success: false,
          message:
            "A program with this name already exists for this workout type.",
        })
      }

      const foundExercises =
        await validateExercises(
          exercises,
        )

      const normalized =
        normalizeExercises(
          exercises,
        )

      validateProgramExercises(
        normalized,
      )

      /*
      |--------------------------------------------------------------------------
      | Make sure exercise order is unique
      |--------------------------------------------------------------------------
      */

      const orders =
        normalized.map(
          (item) =>
            item.order,
        )

      if (
        new Set(orders).size !==
        orders.length
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Exercise order values must be unique.",
        })
      }

      /*
      |--------------------------------------------------------------------------
      | Create active workout program
      |--------------------------------------------------------------------------
      */

      const program =
        await Program.create({
          name:
            name.trim(),

          description:
            description?.trim() ||
            "",

          workoutType,

          difficulty:
            difficulty ||
            "Beginner",

          estimatedDuration:
            estimatedDuration
              ? Number(
                  estimatedDuration,
                )
              : null,

          exercises:
            normalized,

          trainerNotes:
            trainerNotes?.trim() ||
            "",

          /*
          |--------------------------------------------------------------------------
          | IMPORTANT
          |--------------------------------------------------------------------------
          | New programs are active immediately so they appear in:
          | - Workout Programs
          | - Assignments
          | - Program selection dropdowns
          |--------------------------------------------------------------------------
          */

          isActive: true,

          createdBy:
            req.user._id,

          updatedBy:
            req.user._id,
        })

      const populated =
        await Program.findById(
          program._id,
        ).populate({
          path:
            "exercises.exercise",
        })

      return res.status(201).json({
        success: true,
        message:
          "Workout program created successfully.",
        program:
          populated,
      })
    } catch (error) {
      console.error(
        "Create program error:",
        error,
      )

      return res.status(400).json({
        success: false,
        message:
          error.message ||
          "Unable to create workout program.",
      })
    }
  }

const updateProgram =
  async (req, res) => {
    try {
      const program =
        await Program.findById(
          req.params.id,
        )

      if (!program) {
        return res.status(404).json({
          success: false,
          message:
            "Program not found.",
        })
      }

      const {
        name,
        description,
        workoutType,
        difficulty,
        estimatedDuration,
        exercises,
        trainerNotes,
        isActive,
      } = req.body

      if (
        name !== undefined
      ) {
        program.name =
          String(name).trim()
      }

      if (
        description !==
        undefined
      ) {
        program.description =
          String(
            description,
          ).trim()
      }

      if (
        workoutType !==
        undefined
      ) {
        program.workoutType =
          workoutType
      }

      if (
        difficulty !==
        undefined
      ) {
        program.difficulty =
          difficulty
      }

      if (
        estimatedDuration !==
        undefined
      ) {
        program.estimatedDuration =
          estimatedDuration ===
            null ||
          estimatedDuration ===
            ""
            ? null
            : Number(
                estimatedDuration,
              )
      }

      if (
        exercises !==
        undefined
      ) {
        await validateExercises(
          exercises,
        )

        const normalized =
          normalizeExercises(
            exercises,
          )

        validateProgramExercises(
          normalized,
        )

        const orders =
          normalized.map(
            (item) =>
              item.order,
          )

        if (
          new Set(orders).size !==
          orders.length
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Exercise order values must be unique.",
          })
        }

        program.exercises =
          normalized
      }

      if (
        trainerNotes !==
        undefined
      ) {
        program.trainerNotes =
          String(
            trainerNotes,
          ).trim()
      }

      /*
      |--------------------------------------------------------------------------
      | Only change active status when explicitly provided
      |--------------------------------------------------------------------------
      */

      if (
        isActive !==
        undefined
      ) {
        program.isActive =
          Boolean(isActive)
      }

      program.updatedBy =
        req.user._id

      await program.save()

      await program.populate({
        path:
          "exercises.exercise",
      })

      return res.status(200).json({
        success: true,
        message:
          "Workout program updated successfully.",
        program,
      })
    } catch (error) {
      console.error(
        "Update program error:",
        error,
      )

      return res.status(400).json({
        success: false,
        message:
          error.message ||
          "Unable to update workout program.",
      })
    }
  }

const deleteProgram =
  async (req, res) => {
    try {
      const program =
        await Program.findByIdAndUpdate(
          req.params.id,
          {
            isActive:
              false,

            updatedBy:
              req.user._id,
          },
          {
            new: true,
          },
        )

      if (!program) {
        return res.status(404).json({
          success: false,
          message:
            "Program not found.",
        })
      }

      return res.status(200).json({
        success: true,
        message:
          "Workout program deactivated successfully.",
        program,
      })
    } catch (error) {
      console.error(
        "Delete program error:",
        error,
      )

      return res.status(500).json({
        success: false,
        message:
          "Unable to deactivate workout program.",
      })
    }
  }

export {
  getPrograms,
  getProgramById,
  createProgram,
  updateProgram,
  deleteProgram,
}