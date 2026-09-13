import {
  getMyTodayWorkout,
  getMyPrograms,
  getMyWorkoutLog,
} from "../api/api.js"

/*
|--------------------------------------------------------------------------
| Get today's workout
|--------------------------------------------------------------------------
|
| The Dashboard uses the member's real MongoDB assignment.
|
| The backend /my-today endpoint returns:
|
| {
|   assigned: true/false,
|   assignment: {...},
|   workout: {...}
| }
|
| The frontend normalizes that response into:
|
| {
|   hasWorkout: true/false,
|   workout: {...},
|   program: {...}
| }
|
*/

function getTodayDateString() {
  const now = new Date()

  const year = now.getFullYear()

  const month = String(
    now.getMonth() + 1,
  ).padStart(2, "0")

  const day = String(
    now.getDate(),
  ).padStart(2, "0")

  return `${year}-${month}-${day}`
}

/*
|--------------------------------------------------------------------------
| Convert a date value to YYYY-MM-DD
|--------------------------------------------------------------------------
*/

function parseDateOnly(value) {
  if (!value) {
    return null
  }

  const stringValue = String(value)

  const match = stringValue.match(
    /^(\d{4})-(\d{2})-(\d{2})/,
  )

  if (match) {
    return `${match[1]}-${match[2]}-${match[3]}`
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return null
  }

  const year = date.getFullYear()

  const month = String(
    date.getMonth() + 1,
  ).padStart(2, "0")

  const day = String(
    date.getDate(),
  ).padStart(2, "0")

  return `${year}-${month}-${day}`
}

/*
|--------------------------------------------------------------------------
| Check whether assignment covers today
|--------------------------------------------------------------------------
*/

function assignmentCoversToday(
  assignment,
  today,
) {
  if (!assignment) {
    return false
  }

  /*
  |--------------------------------------------------------------------------
  | Only active assignments can appear as today's workout.
  |--------------------------------------------------------------------------
  */

  if (
    assignment.status &&
    assignment.status !== "active"
  ) {
    return false
  }

  /*
  |--------------------------------------------------------------------------
  | Each assignment belongs to one exact calendar date.
  |--------------------------------------------------------------------------
  */

  const workoutDate = parseDateOnly(
    assignment.workoutDate,
  )

  if (!workoutDate) {
    return false
  }

  return workoutDate === today
}

/*
|--------------------------------------------------------------------------
| Find today's assignment
|--------------------------------------------------------------------------
*/

function findTodayAssignment(
  assignments,
  today,
) {
  if (!Array.isArray(assignments)) {
    return null
  }

  const matching = assignments.filter(
    (assignment) =>
      assignmentCoversToday(
        assignment,
        today,
      ),
  )

  if (matching.length === 0) {
    return null
  }

  /*
  | If multiple assignments exist,
  | use the newest one.
  */

  matching.sort(
    (first, second) => {
      const firstDate =
        parseDateOnly(
          first.workoutDate,
        ) || ""

      const secondDate =
        parseDateOnly(
          second.workoutDate,
        ) || ""

      return secondDate.localeCompare(
        firstDate,
      )
    },
  )

  return matching[0]
}

/*
|--------------------------------------------------------------------------
| Build normalized workout
|--------------------------------------------------------------------------
*/

function buildWorkoutResult(
  assignment,
  today,
  workoutLog = null,
) {
  if (!assignment) {
    return {
      hasWorkout: false,

      day: new Date().toLocaleDateString(
        "en-US",
        {
          weekday: "long",
        },
      ),

      date: today,

      workout: null,

      workoutType: "rest",

      title: "Rest Day",

      description:
        "No workout has been assigned for today.",

      startTime: "",

      endTime: "",

      location: "GB Gym",

      duration: "",

      trainerAssigned: false,
    }
  }

  const program =
    assignment.program ||
    assignment.workout?.program ||
    {}

  const exercises =
    Array.isArray(program.exercises)
      ? program.exercises
      : []

  const totalSets =
    exercises.reduce(
      (total, exercise) =>
        total +
        (Number(
          exercise?.sets,
        ) || 0),
      0,
    )

  const assignmentId =
    assignment._id ||
    assignment.id ||
    assignment.assignmentId ||
    assignment.workout?.assignmentId

  const workout = {
    assignmentId,

    workoutDate:
      assignment.workoutDate ||
      assignment.workout?.workoutDate,

    dayOfWeek:
      assignment.dayOfWeek ||
      assignment.workout?.dayOfWeek,

    notes:
      assignment.notes ||
      assignment.workout?.notes ||
      "",

    program,
  }

  const completed = Boolean(
    workoutLog?.completed,
  )

  const durationSeconds =
    workoutLog?.durationSeconds === null ||
    workoutLog?.durationSeconds === undefined
      ? null
      : Number(workoutLog.durationSeconds) || 0

  return {
    hasWorkout: true,

    completed,
    completedAt:
      workoutLog?.completedAt || null,
    durationSeconds,
    workoutLog,

    date: today,

    day: new Date().toLocaleDateString(
      "en-US",
      {
        weekday: "long",
      },
    ),

    workout,

    assignmentId,

    program,

    workoutType:
      program.workoutType ||
      "Workout",

    title:
      program.name ||
      program.workoutType ||
      "Today's Workout",

    description:
      program.description ||
      assignment.notes ||
      "Complete your assigned training session.",

    duration:
      program.estimatedDuration
        ? `${program.estimatedDuration} min`
        : "60 min",

    totalExercises:
      exercises.length,

    totalSets,

    difficulty:
      program.difficulty ||
      "Beginner",

    startTime: "",

    endTime: "",

    location: "GB Gym",

    trainerAssigned: true,

    notes:
      assignment.notes ||
      program.trainerNotes ||
      "",
  }
}

/*
|--------------------------------------------------------------------------
| Get today's workout log
|--------------------------------------------------------------------------
*/

async function getTodayWorkoutLog(today) {
  try {
    const response =
      await getMyWorkoutLog({
        date: today,
      })

    return (
      response?.workoutLog ||
      response?.log ||
      null
    )
  } catch (error) {
    if (error?.response?.status !== 404) {
      console.warn(
        "Unable to load today's workout log:",
        error,
      )
    }

    return null
  }
}

/*
|--------------------------------------------------------------------------
| Get today's workout
|--------------------------------------------------------------------------
*/

async function getTodayWorkout() {
  const today =
    getTodayDateString()

  /*
  |--------------------------------------------------------------------------
  | FIRST: Use dedicated /my-today endpoint
  |--------------------------------------------------------------------------
  */

  try {
    const response =
      await getMyTodayWorkout()

    console.log(
      "TODAY WORKOUT API RESPONSE:",
      response,
    )

    /*
    |--------------------------------------------------------------------------
    | IMPORTANT
    |--------------------------------------------------------------------------
    |
    | Backend uses `assigned`, not `hasWorkout`.
    |
    */

    if (
      response?.assigned &&
      response?.workout
    ) {
      const backendWorkout =
        response.workout

      const workoutLog =
        await getTodayWorkoutLog(today)

      const backendAssignment =
        response.assignment || {}

      const assignment = {
        ...backendAssignment,

        _id:
          backendAssignment._id ||
          backendAssignment.id ||
          backendWorkout.assignmentId,

        id:
          backendAssignment.id ||
          backendAssignment._id ||
          backendWorkout.assignmentId,

        assignmentId:
          backendWorkout.assignmentId,

        workoutDate:
          backendAssignment.workoutDate ||
          backendWorkout.workoutDate,

        dayOfWeek:
          backendAssignment.dayOfWeek ||
          backendWorkout.dayOfWeek,

        notes:
          backendAssignment.notes ||
          backendWorkout.notes ||
          "",

        program:
          backendAssignment.program ||
          backendWorkout.program ||
          {},
      }

      return buildWorkoutResult(
        assignment,
        response.date ||
          today,
        workoutLog,
      )
    }

    console.warn(
      "Today's backend endpoint returned no assigned workout. Checking member programs.",
    )
  } catch (error) {
    console.warn(
      "Today's workout endpoint failed. Falling back to member programs.",
      error,
    )
  }

  /*
  |--------------------------------------------------------------------------
  | SECOND: Use member program assignments
  |--------------------------------------------------------------------------
  */

  try {
    const response =
      await getMyPrograms()

    console.log(
      "MEMBER PROGRAM ASSIGNMENTS:",
      response,
    )

    const assignments =
      Array.isArray(
        response?.assignments,
      )
        ? response.assignments
        : []

    const assignment =
      findTodayAssignment(
        assignments,
        today,
      )

    if (assignment) {
      console.log(
        "TODAY'S ASSIGNMENT FOUND:",
        assignment,
      )

      const workoutLog =
        await getTodayWorkoutLog(today)

      return buildWorkoutResult(
        assignment,
        today,
        workoutLog,
      )
    }

    console.log(
      "No assignment covers today's date:",
      today,
    )

    return {
      hasWorkout: false,

      day: new Date().toLocaleDateString(
        "en-US",
        {
          weekday: "long",
        },
      ),

      date: today,

      workout: null,

      workoutType: "rest",

      title: "Rest Day",

      description:
        "No workout has been assigned for today.",

      startTime: "",

      endTime: "",

      location: "GB Gym",

      duration: "",

      trainerAssigned: false,
    }
  } catch (error) {
    console.error(
      "Unable to retrieve today's workout:",
      error,
    )

    return {
      hasWorkout: false,

      day: new Date().toLocaleDateString(
        "en-US",
        {
          weekday: "long",
        },
      ),

      date: today,

      workout: null,

      workoutType: "rest",

      title: "Workout Unavailable",

      description:
        "We could not retrieve today's workout. Please try again.",

      startTime: "",

      endTime: "",

      location: "GB Gym",

      duration: "",

      trainerAssigned: false,

      error: true,
    }
  }
}

export default getTodayWorkout