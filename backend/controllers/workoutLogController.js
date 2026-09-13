import WorkoutLog from "../models/WorkoutLog.js"
import ProgramAssignment from "../models/ProgramAssignment.js"
import Exercise from "../models/Exercise.js"
import User from "../models/User.js"

/*
|--------------------------------------------------------------------------
| DATE HELPERS
|--------------------------------------------------------------------------
*/

const getStartOfDay = (date) => {
  const source = new Date(date)

  return new Date(
    Date.UTC(
      source.getUTCFullYear(),
      source.getUTCMonth(),
      source.getUTCDate(),
    ),
  )
}

const getEndOfDay = (date) => {
  const start = getStartOfDay(date)

  return new Date(
    start.getTime() +
      24 * 60 * 60 * 1000 -
      1,
  )
}

const parseWorkoutDate = (value) => {
  if (!value) return null

  // The application uses calendar dates (YYYY-MM-DD), not date ranges.
  // Parse an explicit YYYY-MM-DD as UTC midnight so the same calendar
  // date is used consistently by the API, MongoDB, and frontend.
  if (typeof value === "string") {
    const match = value.trim().match(/^(\d{4})-(\d{2})-(\d{2})/)
    if (!match) return null

    const year = Number(match[1])
    const month = Number(match[2])
    const day = Number(match[3])

    const date = new Date(
      Date.UTC(year, month - 1, day),
    )

    if (
      date.getUTCFullYear() !== year ||
      date.getUTCMonth() !== month - 1 ||
      date.getUTCDate() !== day
    ) {
      return null
    }

    return date
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return null
  }

  return date
}

/*
|--------------------------------------------------------------------------
| FIND MEMBER ASSIGNMENT FOR DATE
|--------------------------------------------------------------------------
*/

const getAssignmentForDate =
  async (
    memberId,
    workoutDate,
  ) => {
    const startOfDay =
      new Date(
        Date.UTC(
          workoutDate.getUTCFullYear(),
          workoutDate.getUTCMonth(),
          workoutDate.getUTCDate(),
        ),
      )

    const nextDay =
      new Date(
        startOfDay.getTime() +
          24 * 60 * 60 * 1000,
      )

    return ProgramAssignment.findOne({
      member: memberId,
      status: "active",
      workoutDate: {
        $gte: startOfDay,
        $lt: nextDay,
      },
    })
      .sort({
        createdAt: -1,
      })
      .populate({
        path: "program",
        populate: {
          path: "exercises.exercise",
        },
      })
  }

/*
|--------------------------------------------------------------------------
| GET OR CREATE WORKOUT LOG
|--------------------------------------------------------------------------
*/

const getOrCreateWorkoutLog =
  async (
    memberId,
    programId,
    workoutDate,
  ) => {
    const startOfDay =
      getStartOfDay(
        workoutDate,
      )

    const endOfDay =
      getEndOfDay(
        workoutDate,
      )

    let workoutLog =
      await WorkoutLog.findOne({
        member: memberId,

        program: programId,

        workoutDate: {
          $gte: startOfDay,
          $lte: endOfDay,
        },
      })

    if (workoutLog) {
      return workoutLog
    }

    workoutLog =
      await WorkoutLog.create({
        member: memberId,

        program: programId,

        workoutDate:
          startOfDay,

        exercises: [],

        completed: false,

        completedAt: null,

        caloriesBurned: 0,

        notes: "",
      })

    return workoutLog
  }

/*
|--------------------------------------------------------------------------
| CALCULATE CALORIES
|--------------------------------------------------------------------------
*/

const calculateCaloriesBurned =
  async (
    workoutLog,
  ) => {
    if (
      !workoutLog?.exercises?.length
    ) {
      return 0
    }

    const exerciseIds =
      workoutLog.exercises
        .map(
          (item) =>
            item.exercise,
        )
        .filter(Boolean)

    if (!exerciseIds.length) {
      return 0
    }

    const exercises =
      await Exercise.find({
        _id: {
          $in: exerciseIds,
        },
      }).select(
        "caloriesEstimate",
      )

    const calorieMap =
      new Map(
        exercises.map(
          (exercise) => [
            exercise._id.toString(),
            Number(
              exercise.caloriesEstimate,
            ) || 0,
          ],
        ),
      )

    let calories = 0

    for (
      const workoutExercise of
        workoutLog.exercises
    ) {
      const exerciseId =
        workoutExercise.exercise?.toString()

      const caloriesPerSet =
        calorieMap.get(
          exerciseId,
        ) || 0

      const completedSets =
        workoutExercise.sets.filter(
          (set) =>
            set.completed,
        ).length

      calories +=
        caloriesPerSet *
        completedSets
    }

    return Math.round(
      calories,
    )
  }

/*
|--------------------------------------------------------------------------
| WORKOUT TIMER HELPERS
|--------------------------------------------------------------------------
*/

const TIMER_FIELDS = [
  "startedAt",
  "pausedAt",
  "totalPausedSeconds",
  "durationSeconds",
]

const getTimerState = (workoutLog) => ({
  startedAt: workoutLog?.startedAt || null,
  pausedAt: workoutLog?.pausedAt || null,
  totalPausedSeconds:
    Number(workoutLog?.totalPausedSeconds || 0),
  durationSeconds:
    workoutLog?.durationSeconds === null ||
    workoutLog?.durationSeconds === undefined
      ? null
      : Number(workoutLog.durationSeconds),
})

const calculateDurationSeconds = (
  startedAt,
  pausedAt,
  totalPausedSeconds,
  endAt,
) => {
  if (!startedAt) return 0

  const start = new Date(startedAt).getTime()
  const end = new Date(endAt || Date.now()).getTime()
  const paused = Number(totalPausedSeconds || 0) * 1000

  if (!Number.isFinite(start) || !Number.isFinite(end)) {
    return 0
  }

  const currentPause = pausedAt
    ? Math.max(
        0,
        end - new Date(pausedAt).getTime(),
      )
    : 0

  return Math.max(
    0,
    Math.round((end - start - paused - currentPause) / 1000),
  )
}

const updateTimerFields = async (
  workoutLog,
  fields,
) => {
  const values = {}

  TIMER_FIELDS.forEach((field) => {
    if (Object.prototype.hasOwnProperty.call(fields, field)) {
      values[field] = fields[field]
    }
  })

  if (Object.keys(values).length) {
    const result = await WorkoutLog.collection.updateOne(
      { _id: workoutLog._id },
      { $set: values },
    )

    if (!result.acknowledged) {
      throw new Error("Workout timer update was not acknowledged by MongoDB.")
    }

    const persisted = await readPersistedTimerState(workoutLog)
    Object.assign(workoutLog, persisted)
  }

  return workoutLog
}

const readPersistedTimerState = async (workoutLog) => {
  if (!workoutLog?._id) {
    return {
      startedAt: null,
      pausedAt: null,
      totalPausedSeconds: 0,
      durationSeconds: null,
    }
  }

  const rawLog = await WorkoutLog.collection.findOne(
    { _id: workoutLog._id },
    {
      projection: {
        startedAt: 1,
        pausedAt: 1,
        totalPausedSeconds: 1,
        durationSeconds: 1,
      },
    },
  )

  return {
    startedAt: rawLog?.startedAt ?? null,
    pausedAt: rawLog?.pausedAt ?? null,
    totalPausedSeconds: Number(rawLog?.totalPausedSeconds ?? 0),
    durationSeconds:
      rawLog?.durationSeconds === undefined || rawLog?.durationSeconds === null
        ? null
        : Number(rawLog.durationSeconds),
  }
}

const attachPersistedTimerFields = async (workoutLog) => {
  const timer = await readPersistedTimerState(workoutLog)
  Object.assign(workoutLog, timer)
  return workoutLog
}


const findWorkoutLogForAssignment = async (
  memberId,
  programId,
  workoutDate,
) => {
  const start = new Date(
    Date.UTC(
      workoutDate.getUTCFullYear(),
      workoutDate.getUTCMonth(),
      workoutDate.getUTCDate(),
    ),
  )
  const next = new Date(start.getTime() + 24 * 60 * 60 * 1000)

  return WorkoutLog.findOne({
    member: memberId,
    program: programId,
    workoutDate: { $gte: start, $lt: next },
  })
}

const resolveWorkoutTimerContext = async (req, res) => {
  const requestedDate =
    req.body?.date || req.body?.workoutDate

  const workoutDate = parseWorkoutDate(requestedDate)

  if (!workoutDate) {
    res.status(400).json({
      success: false,
      message: "Invalid workout date.",
    })
    return null
  }

  const assignment = await getAssignmentForDate(
    req.user._id,
    workoutDate,
  )

  if (!assignment) {
    res.status(404).json({
      success: false,
      message: "No active workout assignment found for this date.",
    })
    return null
  }

  if (!assignment.program) {
    res.status(404).json({
      success: false,
      message: "The assigned program could not be found.",
    })
    return null
  }

  let workoutLog = await findWorkoutLogForAssignment(
    req.user._id,
    assignment.program._id,
    workoutDate,
  )

  if (!workoutLog) {
    workoutLog = await getOrCreateWorkoutLog(
      req.user._id,
      assignment.program._id,
      workoutDate,
    )
  }

  await attachPersistedTimerFields(
    workoutLog,
  )

  return { workoutDate, assignment, workoutLog }
}

/*
|--------------------------------------------------------------------------
| START WORKOUT
|--------------------------------------------------------------------------
*/

const startWorkout = async (req, res) => {
  try {
    const context = await resolveWorkoutTimerContext(req, res)
    if (!context) return

    const { workoutLog } = context

    await attachPersistedTimerFields(
      workoutLog,
    )

    if (workoutLog.completed) {
      return res.status(400).json({
        success: false,
        message: "This workout has already been completed.",
        workoutLog,
      })
    }

    const timer = getTimerState(workoutLog)

    if (timer.startedAt && !timer.pausedAt) {
      return res.status(200).json({
        success: true,
        message: "Workout is already in progress.",
        workoutLog,
      })
    }

    if (timer.pausedAt) {
      return res.status(400).json({
        success: false,
        message: "Workout is paused. Resume the workout instead.",
        workoutLog,
      })
    }

    const now = new Date()
    const updatedLog = await updateTimerFields(workoutLog, {
      startedAt: now,
      pausedAt: null,
      totalPausedSeconds: 0,
      durationSeconds: null,
    })

    return res.status(200).json({
      success: true,
      message: "Workout started.",
      workoutLog: updatedLog,
    })
  } catch (error) {
    console.error("Start workout error:", error)
    return res.status(500).json({
      success: false,
      message: "Unable to start workout.",
    })
  }
}

/*
|--------------------------------------------------------------------------
| PAUSE WORKOUT
|--------------------------------------------------------------------------
*/

const pauseWorkout = async (req, res) => {
  try {
    const context = await resolveWorkoutTimerContext(req, res)
    if (!context) return

    const { workoutLog } = context

    await attachPersistedTimerFields(
      workoutLog,
    )

    if (workoutLog.completed) {
      return res.status(400).json({
        success: false,
        message: "This workout has already been completed.",
        workoutLog,
      })
    }

    const timer = getTimerState(workoutLog)

    if (!timer.startedAt) {
      return res.status(400).json({
        success: false,
        message: "Start the workout before pausing it.",
      })
    }

    if (timer.pausedAt) {
      return res.status(200).json({
        success: true,
        message: "Workout is already paused.",
        workoutLog,
      })
    }

    const updatedLog = await updateTimerFields(workoutLog, {
      pausedAt: new Date(),
    })

    return res.status(200).json({
      success: true,
      message: "Workout paused.",
      workoutLog: updatedLog,
    })
  } catch (error) {
    console.error("Pause workout error:", error)
    return res.status(500).json({
      success: false,
      message: "Unable to pause workout.",
    })
  }
}

/*
|--------------------------------------------------------------------------
| RESUME WORKOUT
|--------------------------------------------------------------------------
*/

const resumeWorkout = async (req, res) => {
  try {
    const context = await resolveWorkoutTimerContext(req, res)
    if (!context) return

    const { workoutLog } = context

    await attachPersistedTimerFields(
      workoutLog,
    )

    if (workoutLog.completed) {
      return res.status(400).json({
        success: false,
        message: "This workout has already been completed.",
        workoutLog,
      })
    }

    const timer = getTimerState(workoutLog)

    if (!timer.startedAt) {
      return res.status(400).json({
        success: false,
        message: "Start the workout before resuming it.",
      })
    }

    if (!timer.pausedAt) {
      return res.status(200).json({
        success: true,
        message: "Workout is already running.",
        workoutLog,
      })
    }

    const now = new Date()
    const pausedAt = new Date(timer.pausedAt)
    const addedPauseSeconds = Math.max(
      0,
      Math.round((now.getTime() - pausedAt.getTime()) / 1000),
    )

    const updatedLog = await updateTimerFields(workoutLog, {
      pausedAt: null,
      totalPausedSeconds:
        timer.totalPausedSeconds + addedPauseSeconds,
    })

    return res.status(200).json({
      success: true,
      message: "Workout resumed.",
      workoutLog: updatedLog,
    })
  } catch (error) {
    console.error("Resume workout error:", error)
    return res.status(500).json({
      success: false,
      message: "Unable to resume workout.",
    })
  }
}

/*
|--------------------------------------------------------------------------
| GET MY WORKOUT LOG
|--------------------------------------------------------------------------
*/

const getMyWorkoutLog =
  async (req, res) => {
    try {
      const workoutDate =
        parseWorkoutDate(
          req.query.date,
        )

      if (!workoutDate) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid workout date.",
        })
      }

      const assignment =
        await getAssignmentForDate(
          req.user._id,
          workoutDate,
        )

      if (!assignment) {
        return res.status(404).json({
          success: false,
          message:
            "No workout is assigned for this date.",
        })
      }

      const workoutLog =
        await getOrCreateWorkoutLog(
          req.user._id,
          assignment.program._id,
          workoutDate,
        )

      await attachPersistedTimerFields(
        workoutLog,
      )

      await workoutLog.populate({
        path:
          "exercises.exercise",
      })

      return res.status(200).json({
        success: true,

        workoutLog,

        program:
          assignment.program,

        assignment: {
          _id:
            assignment._id,

          member:
            assignment.member,

          program:
            assignment.program,

          workoutDate:
            assignment.workoutDate,

          dayOfWeek:
            assignment.dayOfWeek,

          status:
            assignment.status,

          notes:
            assignment.notes,
        },
      })
    } catch (error) {
      console.error(
        "Get workout log error:",
        error,
      )

      return res.status(500).json({
        success: false,
        message:
          "Unable to retrieve workout progress.",
      })
    }
  }

/*
|--------------------------------------------------------------------------
| COMPLETE ONE SET
|--------------------------------------------------------------------------
*/

const completeSet =
  async (req, res) => {
    try {
      const {
        date,
        workoutDate:
          bodyWorkoutDate,
        exerciseId,
        setNumber,
        actualReps,
        actualWeight,
      } = req.body

      /*
      |--------------------------------------------------------------------------
      | Use either "date" or "workoutDate".
      |--------------------------------------------------------------------------
      */

      const requestedWorkoutDate =
        date ||
        bodyWorkoutDate

      if (!exerciseId) {
        return res.status(400).json({
          success: false,
          message:
            "Exercise ID is required.",
        })
      }

      if (
        setNumber === undefined ||
        setNumber === null
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Set number is required.",
        })
      }

      const numericSetNumber =
        Number(setNumber)

      if (
        !Number.isInteger(
          numericSetNumber,
        ) ||
        numericSetNumber < 1
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid set number.",
        })
      }

      const workoutDate =
        parseWorkoutDate(
          requestedWorkoutDate,
        )

      if (!workoutDate) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid workout date.",
        })
      }

      /*
      |--------------------------------------------------------------------------
      | Find assignment
      |--------------------------------------------------------------------------
      */

      const assignment =
        await getAssignmentForDate(
          req.user._id,
          workoutDate,
        )

      if (!assignment) {
        return res.status(404).json({
          success: false,
          message:
            "No active workout assignment found for this date.",
        })
      }

      if (!assignment.program) {
        return res.status(404).json({
          success: false,
          message:
            "The assigned program could not be found.",
        })
      }

      /*
      |--------------------------------------------------------------------------
      | Find exercise inside assigned program
      |--------------------------------------------------------------------------
      */

      const programExercises =
        Array.isArray(
          assignment.program
            .exercises,
        )
          ? assignment.program
              .exercises
          : []

      const programExercise =
        programExercises.find(
          (item) => {
            const assignedExerciseId =
              item?.exercise?._id ||
              item?.exercise

            return (
              String(
                assignedExerciseId,
              ) ===
              String(
                exerciseId,
              )
            )
          },
        )

      if (!programExercise) {
        return res.status(404).json({
          success: false,
          message:
            "This exercise is not part of the assigned workout.",
        })
      }

      /*
      |--------------------------------------------------------------------------
      | Validate number of sets
      |--------------------------------------------------------------------------
      */

      const requiredSets =
        Number(
          programExercise.sets,
        ) || 1

      if (
        numericSetNumber >
        requiredSets
      ) {
        return res.status(400).json({
          success: false,
          message:
            `This exercise only has ${requiredSets} assigned sets.`,
        })
      }

      /*
      |--------------------------------------------------------------------------
      | Validate actual reps
      |--------------------------------------------------------------------------
      */

      let parsedActualReps =
        null

      if (
        actualReps !==
          undefined &&
        actualReps !== null &&
        actualReps !== ""
      ) {
        parsedActualReps =
          Number(
            actualReps,
          )

        if (
          !Number.isFinite(
            parsedActualReps,
          ) ||
          parsedActualReps < 0
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Actual reps must be a valid non-negative number.",
          })
        }
      }

      /*
      |--------------------------------------------------------------------------
      | Get or create log
      |--------------------------------------------------------------------------
      */

      const workoutLog =
        await getOrCreateWorkoutLog(
          req.user._id,
          assignment.program._id,
          workoutDate,
        )

      /*
      |--------------------------------------------------------------------------
      | Find exercise log
      |--------------------------------------------------------------------------
      */

      let exerciseLog =
        workoutLog.exercises.find(
          (item) =>
            String(
              item.exercise,
            ) ===
            String(
              exerciseId,
            ),
        )

      if (!exerciseLog) {
        workoutLog.exercises.push({
          exercise:
            exerciseId,

          sets: [],
        })

        exerciseLog =
          workoutLog.exercises[
            workoutLog.exercises
              .length - 1
          ]
      }

      /*
      |--------------------------------------------------------------------------
      | Find set log
      |--------------------------------------------------------------------------
      */

      let setLog =
        exerciseLog.sets.find(
          (item) =>
            Number(
              item.setNumber,
            ) ===
            numericSetNumber,
        )

      if (!setLog) {
        exerciseLog.sets.push({
          setNumber:
            numericSetNumber,

          completed: true,

          actualReps:
            parsedActualReps,

          actualWeight:
            actualWeight !==
              undefined &&
            actualWeight !== null
              ? String(
                  actualWeight,
                ).trim()
              : "",

          completedAt:
            new Date(),
        })

        setLog =
          exerciseLog.sets[
            exerciseLog.sets
              .length - 1
          ]
      } else {
        setLog.completed =
          true

        if (
          actualReps !==
            undefined
        ) {
          setLog.actualReps =
            parsedActualReps
        }

        if (
          actualWeight !==
            undefined
        ) {
          setLog.actualWeight =
            String(
              actualWeight,
            ).trim()
        }

        setLog.completedAt =
          new Date()
      }

      /*
      |--------------------------------------------------------------------------
      | A newly completed set means the workout
      | must be recalculated.
      |--------------------------------------------------------------------------
      */

      workoutLog.completed =
        false

      workoutLog.completedAt =
        null

      if (workoutLog.durationSeconds !== undefined) {
        await updateTimerFields(workoutLog, {
          pausedAt: null,
          durationSeconds: null,
        })
      }

      workoutLog.caloriesBurned =
        await calculateCaloriesBurned(
          workoutLog,
        )

      await workoutLog.save()

      const savedWorkoutLog =
        await WorkoutLog.findById(workoutLog._id)

      await savedWorkoutLog.populate({
        path:
          "exercises.exercise",
      })

      return res.status(200).json({
        success: true,

        message:
          `Set ${numericSetNumber} completed.`,

        caloriesBurned:
          workoutLog.caloriesBurned,

        workoutLog,
      })
    } catch (error) {
      console.error(
        "Complete set error:",
        error,
      )

      return res.status(500).json({
        success: false,
        message:
          "Unable to save completed set.",
      })
    }
  }

/*
|--------------------------------------------------------------------------
| UNCOMPLETE ONE SET
|--------------------------------------------------------------------------
*/

const uncompleteSet =
  async (req, res) => {
    try {
      const {
        date,
        workoutDate:
          bodyWorkoutDate,
        exerciseId,
        setNumber,
      } = req.body

      const requestedWorkoutDate =
        date ||
        bodyWorkoutDate

      if (!exerciseId) {
        return res.status(400).json({
          success: false,
          message:
            "Exercise ID is required.",
        })
      }

      if (
        setNumber === undefined ||
        setNumber === null
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Set number is required.",
        })
      }

      const numericSetNumber =
        Number(setNumber)

      if (
        !Number.isInteger(
          numericSetNumber,
        ) ||
        numericSetNumber < 1
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid set number.",
        })
      }

      const workoutDate =
        parseWorkoutDate(
          requestedWorkoutDate,
        )

      if (!workoutDate) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid workout date.",
        })
      }

      /*
      |--------------------------------------------------------------------------
      | Verify member has assignment
      |--------------------------------------------------------------------------
      */

      const assignment =
        await getAssignmentForDate(
          req.user._id,
          workoutDate,
        )

      if (!assignment) {
        return res.status(404).json({
          success: false,
          message:
            "No active workout assignment found for this date.",
        })
      }

      /*
      |--------------------------------------------------------------------------
      | Find workout log
      |--------------------------------------------------------------------------
      */

      let workoutLog =
        await WorkoutLog.findOne({
          member:
            req.user._id,

          program:
            assignment.program._id,

          workoutDate: {
            $gte:
              getStartOfDay(
                workoutDate,
              ),

            $lte:
              getEndOfDay(
                workoutDate,
              ),
          },
        })

      if (!workoutLog) {
        return res.status(404).json({
          success: false,
          message:
            "Workout progress not found.",
        })
      }

      /*
      |--------------------------------------------------------------------------
      | Find exercise
      |--------------------------------------------------------------------------
      */

      const exerciseLog =
        workoutLog.exercises.find(
          (item) =>
            String(
              item.exercise,
            ) ===
            String(
              exerciseId,
            ),
        )

      if (!exerciseLog) {
        return res.status(404).json({
          success: false,
          message:
            "Exercise progress not found.",
        })
      }

      /*
      |--------------------------------------------------------------------------
      | Find set
      |--------------------------------------------------------------------------
      */

      const setLog =
        exerciseLog.sets.find(
          (item) =>
            Number(
              item.setNumber,
            ) ===
            numericSetNumber,
        )

      if (!setLog) {
        return res.status(404).json({
          success: false,
          message:
            "Set progress not found.",
        })
      }

      /*
      |--------------------------------------------------------------------------
      | Mark incomplete
      |--------------------------------------------------------------------------
      */

      setLog.completed =
        false

      setLog.completedAt =
        null

      workoutLog.completed =
        false

      workoutLog.completedAt =
        null

      if (workoutLog.durationSeconds !== undefined) {
        await updateTimerFields(workoutLog, {
          pausedAt: null,
          durationSeconds: null,
        })
      }

      workoutLog.caloriesBurned =
        await calculateCaloriesBurned(
          workoutLog,
        )

      await workoutLog.save()

      await workoutLog.populate({
        path:
          "exercises.exercise",
      })

      return res.status(200).json({
        success: true,

        message:
          "Set marked as incomplete.",

        caloriesBurned:
          workoutLog.caloriesBurned,

        workoutLog,
      })
    } catch (error) {
      console.error(
        "Uncomplete set error:",
        error,
      )

      return res.status(500).json({
        success: false,
        message:
          "Unable to update set progress.",
      })
    }
  }
  /*
|--------------------------------------------------------------------------
| COMPLETE ENTIRE WORKOUT
|--------------------------------------------------------------------------
*/

const completeWorkout =
  async (req, res) => {
    try {
      const {
        date,
        workoutDate:
          bodyWorkoutDate,
        assignmentId,
        programId,
      } = req.body

      const requestedWorkoutDate =
        date ||
        bodyWorkoutDate

      /*
      |--------------------------------------------------------------------------
      | Timer actions use the existing /complete endpoint so no route changes
      | are required.
      |--------------------------------------------------------------------------
      */

      /*
       * -------------------------------------------------------------------------
       * | RESET / RESTART WORKOUT
       * -------------------------------------------------------------------------
       * Clears an unfinished workout log so a new workout can start from 00:00.
       * This is intentionally an explicit action; normal "start" still resumes
       * an existing in-progress workout.
       */
      if (req.body?.action === "reset") {
        const context = await resolveWorkoutTimerContext(req, res)
        if (!context) return

        let { workoutLog } = context

        if (workoutLog.completed) {
          return res.status(400).json({
            success: false,
            message: "This workout has already been completed and cannot be reset.",
            workoutLog,
          })
        }

        await updateTimerFields(workoutLog, {
          startedAt: null,
          pausedAt: null,
          totalPausedSeconds: 0,
          durationSeconds: null,
        })

        workoutLog.exercises = []
        workoutLog.completed = false
        workoutLog.completedAt = null
        workoutLog.caloriesBurned = 0
        workoutLog.notes = ""

        await workoutLog.save()
        await attachPersistedTimerFields(workoutLog)

        return res.status(200).json({
          success: true,
          message: "Workout reset. A new workout can now start from 00:00.",
          workoutLog,
        })
      }

      if (["start", "pause", "resume"].includes(req.body?.action)) {
        const context = await resolveWorkoutTimerContext(req, res)
        if (!context) return

        const { workoutLog } = context
        const action = req.body.action

        const timer = await readPersistedTimerState(workoutLog)

        console.log(
          `Workout timer action: ${action}`,
          {
            workoutLogId: String(workoutLog._id),
            workoutDate: context.workoutDate.toISOString().split("T")[0],
            hasStartedAt: Boolean(timer.startedAt),
            hasPausedAt: Boolean(timer.pausedAt),
            totalPausedSeconds: timer.totalPausedSeconds,
          },
        )

        if (workoutLog.completed) {
          return res.status(400).json({
            success: false,
            message: "This workout has already been completed.",
            workoutLog,
          })
        }

        if (action === "start") {
          if (timer.startedAt) {
            return res.status(200).json({
              success: true,
              message: timer.pausedAt
                ? "Workout is paused. Resume the workout instead."
                : "Workout is already in progress.",
              workoutLog,
            })
          }

          const now = new Date()
          const updatedLog = await updateTimerFields(workoutLog, {
            startedAt: now,
            pausedAt: null,
            totalPausedSeconds: 0,
            durationSeconds: null,
          })

          const persistedStart = await readPersistedTimerState(updatedLog)
          if (!persistedStart.startedAt) {
            console.error("Workout timer start was not persisted.", {
              workoutLogId: String(workoutLog._id),
            })
            return res.status(500).json({
              success: false,
              message: "Workout timer could not be saved. Please try again.",
            })
          }

          return res.status(200).json({
            success: true,
            message: "Workout started.",
            workoutLog: updatedLog,
          })
        }

        if (action === "pause") {
          if (!timer.startedAt) {
            return res.status(400).json({
              success: false,
              message: "Start the workout before pausing it.",
            })
          }

          if (timer.pausedAt) {
            return res.status(200).json({
              success: true,
              message: "Workout is already paused.",
              workoutLog,
            })
          }

          const updatedLog = await updateTimerFields(workoutLog, {
            pausedAt: new Date(),
          })

          return res.status(200).json({
            success: true,
            message: "Workout paused.",
            workoutLog: updatedLog,
          })
        }

        if (!timer.startedAt) {
          return res.status(400).json({
            success: false,
            message: "Start the workout before resuming it.",
          })
        }

        if (!timer.pausedAt) {
          return res.status(200).json({
            success: true,
            message: "Workout is already running.",
            workoutLog,
          })
        }

        const now = new Date()
        const pausedAt = new Date(timer.pausedAt)
        const addedPauseSeconds = Math.max(
          0,
          Math.round(
            (now.getTime() - pausedAt.getTime()) / 1000,
          ),
        )

        const updatedLog = await updateTimerFields(workoutLog, {
          pausedAt: null,
          totalPausedSeconds:
            timer.totalPausedSeconds + addedPauseSeconds,
        })

        return res.status(200).json({
          success: true,
          message: "Workout resumed.",
          workoutLog: updatedLog,
        })
      }

      const parsedDate =
        parseWorkoutDate(
          requestedWorkoutDate,
        )

      if (!parsedDate) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid workout date.",
        })
      }

      /*
      |--------------------------------------------------------------------------
      | Find active assignment
      |--------------------------------------------------------------------------
      */

      const assignment =
        await getAssignmentForDate(
          req.user._id,
          parsedDate,
        )

      if (!assignment) {
        return res.status(404).json({
          success: false,
          message:
            "No active workout assignment found for this date.",
        })
      }

      if (!assignment.program) {
        return res.status(404).json({
          success: false,
          message:
            "The assigned program could not be found.",
        })
      }

      /*
      |--------------------------------------------------------------------------
      | Verify assignment when supplied
      |--------------------------------------------------------------------------
      */

      if (
        assignmentId &&
        String(
          assignment._id,
        ) !==
          String(
            assignmentId,
          )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "The selected workout assignment does not match this date.",
        })
      }

      /*
      |--------------------------------------------------------------------------
      | Verify program when supplied
      |--------------------------------------------------------------------------
      */

      if (
        programId &&
        String(
          assignment.program._id,
        ) !==
          String(
            programId,
          )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "The selected program does not belong to this assignment.",
        })
      }

      /*
      |--------------------------------------------------------------------------
      | Find workout log
      |--------------------------------------------------------------------------
      */

      let workoutLog =
        await WorkoutLog.findOne({
          member:
            req.user._id,

          program:
            assignment.program._id,

          workoutDate: {
            $gte:
              getStartOfDay(
                parsedDate,
              ),

            $lte:
              getEndOfDay(
                parsedDate,
              ),
          },
        })

      if (!workoutLog) {
        return res.status(404).json({
          success: false,
          message:
            "Workout progress not found. Complete the assigned sets first.",
        })
      }

      /*
      |--------------------------------------------------------------------------
      | Validate every assigned exercise
      |--------------------------------------------------------------------------
      */

      const incompleteExercises =
        []

      const assignedExercises =
        Array.isArray(
          assignment.program
            .exercises,
        )
          ? assignment.program
              .exercises
          : []

      /*
      |--------------------------------------------------------------------------
      | No exercises
      |--------------------------------------------------------------------------
      */

      if (
        assignedExercises.length ===
        0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "This workout has no exercises assigned.",
        })
      }

      /*
      |--------------------------------------------------------------------------
      | Check every exercise
      |--------------------------------------------------------------------------
      */

      for (
        const programExercise of
          assignedExercises
      ) {
        const assignedExerciseId =
          programExercise?.exercise
            ?._id ||
          programExercise?.exercise

        const exerciseId =
          String(
            assignedExerciseId,
          )

        const requiredSets =
          Number(
            programExercise?.sets,
          ) || 1

        const exerciseLog =
          workoutLog.exercises.find(
            (item) => {
              const loggedExerciseId =
                item?.exercise?._id ||
                item?.exercise

              return (
                String(
                  loggedExerciseId,
                ) === exerciseId
              )
            },
          )

        const completedSetCount =
          exerciseLog
            ? exerciseLog.sets.filter(
                (set) =>
                  set.completed,
              ).length
            : 0

        if (
          completedSetCount <
          requiredSets
        ) {
          incompleteExercises.push({
            exerciseId,

            exerciseName:
              programExercise
                ?.exercise?.name ||
              "Exercise",

            requiredSets,

            completedSets:
              completedSetCount,

            remainingSets:
              Math.max(
                requiredSets -
                  completedSetCount,
                0,
              ),
          })
        }
      }

      /*
      |--------------------------------------------------------------------------
      | Prevent completion if sets remain
      |--------------------------------------------------------------------------
      */

      if (
        incompleteExercises.length >
        0
      ) {
        return res.status(400).json({
          success: false,

          message:
            "Complete all assigned exercises and sets before finishing the workout.",

          incompleteExercises,
        })
      }

      /*
      |--------------------------------------------------------------------------
      | Calculate calories
      |--------------------------------------------------------------------------
      */

      const caloriesBurned =
        await calculateCaloriesBurned(
          workoutLog,
        )

      /*
      |--------------------------------------------------------------------------
      | Complete workout and finalize timer
      |--------------------------------------------------------------------------
      */

      // Timer fields are stored directly in MongoDB because they may not be
      // declared in the current Mongoose schema. Read the persisted values
      // before finalizing the workout so completion sees the same timer state
      // that Start/Pause/Resume use.
      const timer = await readPersistedTimerState(workoutLog)

      if (!timer.startedAt) {
        return res.status(400).json({
          success: false,
          message: "Start the workout before finishing it.",
        })
      }

      const completedAt = new Date()
      let totalPausedSeconds = timer.totalPausedSeconds

      if (timer.pausedAt) {
        totalPausedSeconds += Math.max(
          0,
          Math.round(
            (completedAt.getTime() -
              new Date(timer.pausedAt).getTime()) /
              1000,
          ),
        )
      }

      const durationSeconds = calculateDurationSeconds(
        timer.startedAt,
        null,
        totalPausedSeconds,
        completedAt,
      )

      workoutLog.completed = true
      workoutLog.completedAt = completedAt

      workoutLog = await updateTimerFields(workoutLog, {
        pausedAt: null,
        totalPausedSeconds,
        durationSeconds,
      })

      workoutLog.completed = true
      workoutLog.completedAt = completedAt
      workoutLog.caloriesBurned =
        caloriesBurned

      await workoutLog.save()

      await attachPersistedTimerFields(workoutLog)

      await workoutLog.populate({
        path:
          "exercises.exercise",
      })

      return res.status(200).json({
        success: true,

        message:
          "Workout completed successfully.",

        caloriesBurned,

        workoutLog,
      })
    } catch (error) {
      console.error(
        "Complete workout error:",
        error,
      )

      return res.status(500).json({
        success: false,
        message:
          "Unable to complete workout.",
      })
    }
  }

/*
|--------------------------------------------------------------------------
| ADMIN — GET ALL MEMBER WORKOUT PROGRESS
|--------------------------------------------------------------------------
*/

const getAdminWorkoutProgress =
  async (req, res) => {
    try {
      const {
        date,
        memberId,
        status,
      } = req.query

      const workoutDate =
        parseWorkoutDate(date)

      if (!workoutDate) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid workout date.",
        })
      }

      const startOfDay =
        getStartOfDay(workoutDate)

      const endOfDay =
        getEndOfDay(workoutDate)

      /*
      |--------------------------------------------------------------------------
      | Find members
      |--------------------------------------------------------------------------
      */

      const memberFilter = {
        role: "member",
      }

      if (memberId) {
        memberFilter._id = memberId
      }

      const members =
        await User.find(memberFilter)
          .select(
            "firstName lastName email phone fitnessGoal weight isActive profilePhoto",
          )
          .sort({
            firstName: 1,
            lastName: 1,
          })

      const progress = []

      /*
      |--------------------------------------------------------------------------
      | Process each member
      |--------------------------------------------------------------------------
      */

      for (const member of members) {
        /*
        |--------------------------------------------------------------------------
        | Find ALL active workout assignments for this member on this date
        |--------------------------------------------------------------------------
        |
        | IMPORTANT:
        | We use find() instead of findOne().
        |
        | A member can have multiple workouts on the same date, for example:
        |   - Upper Body
        |   - Lower Body
        |
        | findOne() would return only one of them.
        |--------------------------------------------------------------------------
        */

        const assignments =
          await ProgramAssignment.find({
            member: member._id,
            status: "active",
            workoutDate: {
              $gte: startOfDay,
              $lt: new Date(
                startOfDay.getTime() +
                  24 * 60 * 60 * 1000,
              ),
            },
          })
            .sort({
              createdAt: -1,
            })
            .populate({
              path: "program",
              populate: {
                path: "exercises.exercise",
              },
            })

        /*
        |--------------------------------------------------------------------------
        | MEMBER HAS NO ASSIGNMENT
        |--------------------------------------------------------------------------
        */

        if (!assignments.length) {
          const item = {
            member,

            workout: {
              status:
                "not_assigned",

              date:
                workoutDate,

              completed:
                false,

              completedAt:
                null,

              caloriesBurned:
                0,

              totalSets:
                0,

              completedSets:
                0,

              progressPercent:
                0,

              exercises:
                [],
            },
          }

          if (
            !status ||
            status ===
              "not_assigned"
          ) {
            progress.push(item)
          }

          continue
        }

        /*
        |--------------------------------------------------------------------------
        | PROCESS EVERY WORKOUT ASSIGNMENT
        |--------------------------------------------------------------------------
        */

        for (
          const assignment of assignments
        ) {
          /*
          |--------------------------------------------------------------------------
          | Make sure the assigned program exists
          |--------------------------------------------------------------------------
          */

          if (!assignment.program) {
            continue
          }

          /*
          |--------------------------------------------------------------------------
          | Find workout log for THIS specific program
          |--------------------------------------------------------------------------
          */

          const workoutLog =
            await WorkoutLog.findOne({
              member:
                member._id,

              program:
                assignment.program._id,

              workoutDate: {
                $gte:
                  startOfDay,

                $lte:
                  endOfDay,
              },
            }).populate({
              path:
                "exercises.exercise",
            })

          /*
          |--------------------------------------------------------------------------
          | Calculate set progress
          |--------------------------------------------------------------------------
          */

          let totalSets = 0
          let completedSets = 0

          const assignedExercises =
            assignment.program
              ?.exercises || []

          /*
          |--------------------------------------------------------------------------
          | Loop through every exercise in this workout
          |--------------------------------------------------------------------------
          */

          for (
            const assignedExercise of
              assignedExercises
          ) {
            const requiredSets =
              Number(
                assignedExercise.sets,
              ) || 1

            totalSets +=
              requiredSets

            const assignedExerciseId =
              assignedExercise
                ?.exercise?._id ||
              assignedExercise?.exercise

            const exerciseId =
              String(
                assignedExerciseId,
              )

            const loggedExercise =
              workoutLog?.exercises?.find(
                (item) => {
                  const loggedExerciseId =
                    item?.exercise?._id ||
                    item?.exercise

                  return (
                    String(
                      loggedExerciseId,
                    ) === exerciseId
                  )
                },
              )

            if (loggedExercise) {
              completedSets +=
                loggedExercise.sets.filter(
                  (set) =>
                    set.completed,
                ).length
            }
          }

          /*
          |--------------------------------------------------------------------------
          | Determine workout status
          |--------------------------------------------------------------------------
          */

          let workoutStatus =
            "not_started"

          if (
            workoutLog?.completed
          ) {
            workoutStatus =
              "completed"
          } else if (
            workoutLog?.pausedAt
          ) {
            workoutStatus =
              "paused"
          } else if (
            workoutLog?.startedAt ||
            completedSets > 0
          ) {
            workoutStatus =
              "in_progress"
          }

          /*
          |--------------------------------------------------------------------------
          | Calculate progress percentage
          |--------------------------------------------------------------------------
          */

          const progressPercent =
            totalSets > 0
              ? Math.min(
                  Math.round(
                    (completedSets /
                      totalSets) *
                      100,
                  ),
                  100,
                )
              : 0

          /*
          |--------------------------------------------------------------------------
          | Build response item
          |--------------------------------------------------------------------------
          */

          const item = {
            member,

            /*
            |--------------------------------------------------------------------------
            | Assignment information
            |--------------------------------------------------------------------------
            */

            assignment: {
              id:
                assignment._id,

              workoutDate:
                assignment.workoutDate,

              dayOfWeek:
                assignment.dayOfWeek,

              status:
                assignment.status,
            },

            /*
            |--------------------------------------------------------------------------
            | Program / Workout name and exercises
            |--------------------------------------------------------------------------
            */

            program:
              assignment.program,

            /*
            |--------------------------------------------------------------------------
            | Workout progress
            |--------------------------------------------------------------------------
            */

            workout: {
              status:
                workoutStatus,

              date:
                workoutDate,

              completed:
                Boolean(
                  workoutLog?.completed,
                ),

              completedAt:
                workoutLog?.completedAt ||
                null,

              startedAt:
                workoutLog?.startedAt ||
                null,

              pausedAt:
                workoutLog?.pausedAt ||
                null,

              totalPausedSeconds:
                Number(
                  workoutLog
                    ?.totalPausedSeconds ||
                    0,
                ),

              durationSeconds:
                workoutLog
                  ?.durationSeconds ??
                null,

              caloriesBurned:
                workoutLog
                  ?.caloriesBurned ||
                0,

              totalSets,

              completedSets,

              progressPercent,

              exercises:
                workoutLog
                  ?.exercises ||
                [],
            },
          }

          /*
          |--------------------------------------------------------------------------
          | Apply optional status filter
          |--------------------------------------------------------------------------
          */

          if (
            !status ||
            status ===
              workoutStatus
          ) {
            progress.push(item)
          }
        }
      }

      /*
      |--------------------------------------------------------------------------
      | Return all workout progress
      |--------------------------------------------------------------------------
      */

      return res.status(200).json({
        success: true,

        date:
          workoutDate
            .toISOString()
            .split("T")[0],

        count:
          progress.length,

        progress,
      })
    } catch (error) {
      console.error(
        "Get admin workout progress error:",
        error,
      )

      return res.status(500).json({
        success: false,

        message:
          "Unable to retrieve member workout progress.",
      })
    }
  }

/*
|--------------------------------------------------------------------------
| ADMIN — GET ONE MEMBER'S WORKOUT PROGRESS
|--------------------------------------------------------------------------
*/

const getAdminMemberWorkoutProgress =
  async (req, res) => {
    try {
      const {
        memberId,
      } = req.params

      const {
        date,
      } = req.query

      const workoutDate =
        parseWorkoutDate(
          date,
        )

      if (!workoutDate) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid workout date.",
        })
      }

      /*
      |--------------------------------------------------------------------------
      | Find member
      |--------------------------------------------------------------------------
      */

      const member =
        await User.findOne({
          _id: memberId,
          role: "member",
        }).select(
          "-password",
        )

      if (!member) {
        return res.status(404).json({
          success: false,
          message:
            "Member not found.",
        })
      }

      /*
      |--------------------------------------------------------------------------
      | Find ALL active assignments for this member/date
      |--------------------------------------------------------------------------
      */

      const startOfDay =
        getStartOfDay(workoutDate)

      const endOfDay =
        getEndOfDay(workoutDate)

      const assignments =
        await ProgramAssignment.find({
          member: memberId,
          status: "active",
          workoutDate: {
            $gte: startOfDay,
            $lte: endOfDay,
          },
        })
          .sort({
            createdAt: -1,
          })
          .populate({
            path: "program",
            populate: {
              path: "exercises.exercise",
            },
          })

      if (!assignments.length) {
        return res.status(404).json({
          success: false,
          message:
            "No active program is assigned to this member for this date.",
        })
      }

      /*
      |--------------------------------------------------------------------------
      | Build progress for every assigned workout
      |--------------------------------------------------------------------------
      */

      const progress = []

      for (const assignment of assignments) {
        if (!assignment.program) {
          continue
        }

        const workoutLog =
          await WorkoutLog.findOne({
            member: memberId,
            program:
              assignment.program._id,
            workoutDate: {
              $gte: startOfDay,
              $lte: endOfDay,
            },
          }).populate({
            path:
              "exercises.exercise",
          })

        let totalSets = 0
        let completedSets = 0

        for (
          const assignedExercise of
            assignment.program.exercises || []
        ) {
          const requiredSets =
            Number(
              assignedExercise.sets,
            ) || 1

          totalSets +=
            requiredSets

          const assignedExerciseId =
            assignedExercise
              ?.exercise?._id ||
            assignedExercise?.exercise

          const exerciseId =
            String(
              assignedExerciseId,
            )

          const loggedExercise =
            workoutLog?.exercises?.find(
              (item) => {
                const loggedExerciseId =
                  item?.exercise?._id ||
                  item?.exercise

                return (
                  String(
                    loggedExerciseId,
                  ) === exerciseId
                )
              },
            )

          if (loggedExercise) {
            completedSets +=
              Array.isArray(
                loggedExercise.sets,
              )
                ? loggedExercise.sets.filter(
                    (set) =>
                      set?.completed === true,
                  ).length
                : 0
          }
        }

        const progressPercent =
          totalSets > 0
            ? Math.min(
                Math.round(
                  (completedSets /
                    totalSets) *
                    100,
                ),
                100,
              )
            : workoutLog?.completed
              ? 100
              : 0

        let workoutStatus =
          "not_started"

        if (
          workoutLog?.completed ||
          progressPercent >= 100
        ) {
          workoutStatus =
            "completed"
        } else if (
          workoutLog?.pausedAt
        ) {
          workoutStatus =
            "paused"
        } else if (
          workoutLog?.startedAt ||
          completedSets > 0
        ) {
          workoutStatus =
            "in_progress"
        }

        progress.push({
          member,

          program:
            assignment.program,

          assignment: {
            id:
              assignment._id,

            workoutDate:
              assignment.workoutDate,

            dayOfWeek:
              assignment.dayOfWeek,

            status:
              assignment.status,
          },

          workout: {
            status:
              workoutStatus,

            date:
              workoutDate,

            completed:
              Boolean(
                workoutLog?.completed,
              ),

            completedAt:
              workoutLog?.completedAt ||
              null,

            startedAt:
              workoutLog?.startedAt ||
              null,

            pausedAt:
              workoutLog?.pausedAt ||
              null,

            totalPausedSeconds:
              Number(
                workoutLog
                  ?.totalPausedSeconds ||
                  0,
              ),

            durationSeconds:
              workoutLog
                ?.durationSeconds ??
              null,

            caloriesBurned:
              workoutLog
                ?.caloriesBurned ||
              0,

            totalSets,

            completedSets,

            progressPercent,

            exercises:
              workoutLog
                ?.exercises ||
              [],
          },
        })
      }

      if (!progress.length) {
        return res.status(404).json({
          success: false,
          message:
            "No active program is assigned to this member for this date.",
        })
      }

      /*
      |--------------------------------------------------------------------------
      | Backward compatibility:
      | Return the first workout at the top level while also returning all
      | workouts in progress[]. This keeps the existing frontend working.
      |--------------------------------------------------------------------------
      */

      const first = progress[0]

      return res.status(200).json({
        success: true,

        member,

        program:
          first.program,

        assignment:
          first.assignment,

        workout:
          first.workout,

        progress,
      })
    } catch (error) {
      console.error(
        "Get admin member workout progress error:",
        error,
      )

      return res.status(500).json({
        success: false,
        message:
          "Unable to retrieve member workout details.",
      })
    }
  }


  /*
|--------------------------------------------------------------------------
| Get member workout history
|--------------------------------------------------------------------------
*/

const getMyWorkoutHistory = async (
  req,
  res,
) => {
  try {
    const memberId = req.user._id

    const logs =
      await WorkoutLog.find({
        member: memberId,
        completed: true,
      })
        .sort({
          workoutDate: -1,
        })
        .populate({
          path: "program",
          select: "name title estimatedDuration",
        })
        .lean()

    const history = logs.map(
      (log) => {
        const exercises =
          Array.isArray(
            log.exercises,
          )
            ? log.exercises
            : []

        let completedSets = 0
        let totalSets = 0

        const completedSetTimes = []

        exercises.forEach(
          (exercise) => {
            const sets =
              Array.isArray(
                exercise.sets,
              )
                ? exercise.sets
                : []

            totalSets += sets.length

            sets.forEach(
              (set) => {
                if (set.completed) {
                  completedSets += 1

                  if (
                    set.completedAt
                  ) {
                    completedSetTimes.push(
                      new Date(
                        set.completedAt,
                      ),
                    )
                  }
                }
              },
            )
          },
        )

        let durationSeconds =
          log.durationSeconds !== undefined &&
          log.durationSeconds !== null
            ? Number(log.durationSeconds) || 0
            : 0

        if (
          log.durationSeconds === undefined ||
          log.durationSeconds === null
        ) {
          if (
            completedSetTimes.length >=
          2
        ) {
          const timestamps =
            completedSetTimes.map(
              (date) =>
                date.getTime(),
            )

          const firstTimestamp =
            Math.min(
              ...timestamps,
            )

          const lastTimestamp =
            Math.max(
              ...timestamps,
            )

          durationSeconds =
            Math.max(
              0,
              Math.round(
                (
                  lastTimestamp -
                  firstTimestamp
                ) / 1000,
              ),
            )
          }
        }

        const workoutDate =
          new Date(
            log.workoutDate,
          )

        const date =
          workoutDate
            .toISOString()
            .split("T")[0]

        const day =
          workoutDate.toLocaleDateString(
            "en-US",
            {
              weekday: "long",
            },
          )

        const programName =
          log.program?.name ||
          log.program?.title ||
          "Workout"

        return {
          id: String(
            log._id,
          ),

          date,

          day,

          programName,

          completed: Boolean(
            log.completed,
          ),

          completedAt:
            log.completedAt ||
            null,

          caloriesBurned:
            Number(
              log.caloriesBurned,
            ) || 0,

          completedSets,

          totalSets,

          completionPercentage:
            totalSets > 0
              ? Math.min(
                  Math.round(
                    (
                      completedSets /
                      totalSets
                    ) * 100,
                  ),
                  100,
                )
              : 100,

          durationSeconds,
        }
      },
    )

    return res.status(200).json({
      success: true,
      count: history.length,
      history,
    })
  } catch (error) {
    console.error(
      "Get member workout history error:",
      error,
    )

    return res.status(500).json({
      success: false,
      message:
        "Unable to retrieve workout history.",
    })
  }
}
/*
|--------------------------------------------------------------------------
| EXPORTS
|--------------------------------------------------------------------------
*/

export {
  getMyWorkoutLog,
  getMyWorkoutHistory,
  completeSet,
  uncompleteSet,
  completeWorkout,
  getAdminWorkoutProgress,
  getAdminMemberWorkoutProgress,
  startWorkout,
  pauseWorkout,
  resumeWorkout,
}