import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Clock3,
  Dumbbell,
  Flame,
  Play,
  Pause,
} from "lucide-react"

import {
  useEffect,
  useMemo,
  useState,
} from "react"

import {
  useLocation,
  useNavigate,
} from "react-router-dom"

import {
  getMyPrograms,
  getMyTodayWorkout,
} from "../api/api.js"

import api from "../api/api.js"

import { useGym } from "../context/GymContext"

function Workout() {
  const navigate =
    useNavigate()

  const location =
    useLocation()

  const { gym } =
    useGym()

  /*
  |--------------------------------------------------------------------------
  | Read workout information from both:
  |
  | 1. React Router state
  | 2. URL query parameters
  |
  | This allows the workout page to work whether the user came from:
  |
  | Home
  | Weekly Schedule
  | Direct URL
  |--------------------------------------------------------------------------
  */

  const queryParams = useMemo(
    () =>
      new URLSearchParams(
        location.search,
      ),
    [location.search],
  )

  const routeState =
    location.state || {}

  const stateWorkout =
    routeState.workout || null

  const assignmentId =
    queryParams.get(
      "assignmentId",
    ) ||
    routeState.assignmentId ||
    stateWorkout?.assignmentId ||
    null

  const requestedDate =
    queryParams.get(
      "date",
    ) ||
    routeState.date ||
    null

  // Preserve the saved duration when opening a completed workout from Home.
  // This is a display fallback if the /workout-logs/me response omits the
  // custom timer fields from the Mongoose document.
  const navigationDurationSeconds =
    routeState.durationSeconds ??
    stateWorkout?.durationSeconds ??
    (queryParams.has("durationSeconds")
      ? Number(queryParams.get("durationSeconds"))
      : null)

  const [assignment, setAssignment] =
    useState(null)

  const [loading, setLoading] =
    useState(true)

  const [error, setError] =
    useState("")

  const [
    completedSets,
    setCompletedSets,
  ] = useState({})

  const [
    actualValues,
    setActualValues,
  ] = useState({})

  const [
    workoutCompleted,
    setWorkoutCompleted,
  ] = useState(false)

  const [
    caloriesBurned,
    setCaloriesBurned,
  ] = useState(0)

  const [
    workoutStartedAt,
    setWorkoutStartedAt,
  ] = useState(null)

  const [
    workoutPausedAt,
    setWorkoutPausedAt,
  ] = useState(null)

  const [
    totalPausedSeconds,
    setTotalPausedSeconds,
  ] = useState(0)

  const [
    workoutDurationSeconds,
    setWorkoutDurationSeconds,
  ] = useState(
    navigationDurationSeconds !== null &&
      navigationDurationSeconds !== undefined &&
      Number.isFinite(Number(navigationDurationSeconds))
      ? Number(navigationDurationSeconds)
      : null,
  )

  const [
    workoutTimerSeconds,
    setWorkoutTimerSeconds,
  ] = useState(
    navigationDurationSeconds !== null &&
      navigationDurationSeconds !== undefined &&
      Number.isFinite(Number(navigationDurationSeconds))
      ? Number(navigationDurationSeconds)
      : 0,
  )

  const [
    timerAction,
    setTimerAction,
  ] = useState("")

  const [
    savingSet,
    setSavingSet,
  ] = useState("")

  const [
    completingWorkout,
    setCompletingWorkout,
  ] = useState(false)

  const [
    resettingWorkout,
    setResettingWorkout,
  ] = useState(false)

  const [
    showResetConfirm,
    setShowResetConfirm,
  ] = useState(false)

  /*
  |--------------------------------------------------------------------------
  | Load assigned workout
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    let mounted = true

    const loadWorkout =
      async () => {
        try {
          setLoading(true)
          setError("")

          /*
          |--------------------------------------------------------------------------
          | If Home already supplied the complete workout,
          | use it immediately.
          |--------------------------------------------------------------------------
          */

          if (
            stateWorkout?.program
          ) {
            const localAssignment =
              normalizeWorkoutAssignment(
                stateWorkout,
              )

            if (mounted) {
              setAssignment(
                localAssignment,
              )
            }

            /*
            |--------------------------------------------------------------------------
            | Try to retrieve the existing workout log.
            |--------------------------------------------------------------------------
            */

            await restoreExistingLog(
              localAssignment,
              mounted,
              setCompletedSets,
              setActualValues,
              setWorkoutCompleted,
              setCaloriesBurned,
              setWorkoutStartedAt,
              setWorkoutPausedAt,
              setTotalPausedSeconds,
              setWorkoutDurationSeconds,
              navigationDurationSeconds,
            )

            return
          }

          /*
          |--------------------------------------------------------------------------
          | Today's workout endpoint
          |--------------------------------------------------------------------------
          */

          let selectedAssignment =
            null

          try {
            const todayResponse =
              await getMyTodayWorkout()

            selectedAssignment =
              extractAssignment(
                todayResponse,
              )
          } catch (
            todayError
          ) {
            console.warn(
              "Today's workout endpoint could not be loaded:",
              todayError,
            )
          }

          /*
          |--------------------------------------------------------------------------
          | Get all member assignments.
          |
          | This is important for:
          |
          | - Tomorrow
          | - Future dates
          | - Weekly schedule
          |--------------------------------------------------------------------------
          */

          const programsResponse =
            await getMyPrograms()

          const assignments =
            extractAssignments(
              programsResponse,
            )

          /*
          |--------------------------------------------------------------------------
          | Exact assignment ID
          |--------------------------------------------------------------------------
          */

          if (
            assignmentId &&
            assignments.length > 0
          ) {
            const exactAssignment =
              assignments.find(
                (item) =>
                  String(
                    item?._id,
                  ) ===
                    String(
                      assignmentId,
                    ) ||
                  String(
                    item?.id,
                  ) ===
                    String(
                      assignmentId,
                    ),
              )

            if (
              exactAssignment
            ) {
              selectedAssignment =
                exactAssignment
            }
          }

          /*
          |--------------------------------------------------------------------------
          | Requested date
          |--------------------------------------------------------------------------
          */

          if (
            !selectedAssignment &&
            requestedDate &&
            assignments.length > 0
          ) {
            const dateAssignment =
              findAssignmentForDate(
                assignments,
                requestedDate,
              )

            if (
              dateAssignment
            ) {
              selectedAssignment =
                dateAssignment
            }
          }

          /*
          |--------------------------------------------------------------------------
          | Final current assignment fallback
          |--------------------------------------------------------------------------
          */

          if (
            !selectedAssignment &&
            assignments.length > 0
          ) {
            selectedAssignment =
              findCurrentAssignment(
                assignments,
              )
          }

          /*
          |--------------------------------------------------------------------------
          | No assignment
          |--------------------------------------------------------------------------
          */

          if (!mounted) {
            return
          }

          if (
            !selectedAssignment
          ) {
            setAssignment(null)

            setError(
              "No workout has been assigned to you for this date.",
            )

            return
          }

          /*
          |--------------------------------------------------------------------------
          | Normalize assignment
          |--------------------------------------------------------------------------
          */

          selectedAssignment =
            normalizeWorkoutAssignment(
              selectedAssignment,
            )

          setAssignment(
            selectedAssignment,
          )

          /*
          |--------------------------------------------------------------------------
          | Restore existing log
          |--------------------------------------------------------------------------
          */

          await restoreExistingLog(
            selectedAssignment,
            mounted,
            setCompletedSets,
            setActualValues,
            setWorkoutCompleted,
            setCaloriesBurned,
            setWorkoutStartedAt,
            setWorkoutPausedAt,
            setTotalPausedSeconds,
            setWorkoutDurationSeconds,
            navigationDurationSeconds,
          )
        } catch (error) {
          console.error(
            "Unable to load workout:",
            error,
          )

          if (mounted) {
            setError(
              error?.response?.data
                ?.message ||
                "Unable to load your workout.",
            )
          }
        } finally {
          if (mounted) {
            setLoading(false)
          }
        }
      }

    loadWorkout()

    return () => {
      mounted = false
    }
  }, [
    assignmentId,
    requestedDate,
    stateWorkout,
    navigationDurationSeconds,
  ])

  /*
  |--------------------------------------------------------------------------
  | Program
  |--------------------------------------------------------------------------
  */

  const program =
    assignment?.program || null

  const exercises =
    Array.isArray(
      program?.exercises,
    )
      ? [
          ...program.exercises,
        ].sort(
          (
            first,
            second,
          ) =>
            Number(
              first?.order || 0,
            ) -
            Number(
              second?.order || 0,
            ),
        )
      : []

  /*
  |--------------------------------------------------------------------------
  | Total sets
  |--------------------------------------------------------------------------
  */

  const totalSets =
    exercises.reduce(
      (
        total,
        exercise,
      ) =>
        total +
        (Number(
          exercise?.sets,
        ) || 0),
      0,
    )

  /*
  |--------------------------------------------------------------------------
  | Completed sets
  |--------------------------------------------------------------------------
  */

  const completedSetCount =
    Object.values(
      completedSets,
    ).filter(Boolean).length

  /*
  |--------------------------------------------------------------------------
  | Completion percentage
  |--------------------------------------------------------------------------
  */

  const completionPercentage =
    totalSets > 0
      ? Math.min(
          Math.round(
            (completedSetCount /
              totalSets) *
              100,
          ),
          100,
        )
      : 0

  // Estimated activity metrics. The web app does not have access to a
  // reliable pedometer on desktop browsers, so steps are estimated from
  // active workout time rather than pretending they are device-measured.
  const estimatedSteps = Math.max(
    0,
    Math.round(
      (Number(workoutTimerSeconds) / 60) * 100,
    ),
  )

  const estimatedLiveCalories = Math.max(
    0,
    Math.round(
      (Number(workoutTimerSeconds) / 60) *
        7 *
        Math.max(
          0.75,
          Math.min(
            1.25,
            exercises.length / 8,
          ),
        ),
    ),
  )

  const displayedCalories =
    workoutCompleted
      ? Math.round(
          Number(caloriesBurned || 0),
        )
      : estimatedLiveCalories

  /*
  |--------------------------------------------------------------------------
  | Toggle set
  |--------------------------------------------------------------------------
  */

  const toggleSet =
    async (
      exercise,
      setNumber,
    ) => {
      const exerciseId =
        getExerciseId(
          exercise,
        )

      if (!exerciseId) {
        setError(
          "This exercise does not have a valid ID.",
        )

        return
      }

      const key =
        `${exerciseId}-${setNumber}`

      const currentlyCompleted =
        Boolean(
          completedSets[key],
        )

      const repsValue =
        actualValues[
          `${key}-reps`
        ]

      const weightValue =
        actualValues[
          `${key}-weight`
        ]

      setSavingSet(key)
      setError("")

      try {
        /*
        |--------------------------------------------------------------------------
        | Uncomplete
        |--------------------------------------------------------------------------
        */

        if (
          currentlyCompleted
        ) {
          const response =
            await api.post(
              "/workout-logs/set/uncomplete",
              {
                exerciseId,
                setNumber,

                workoutDate:
                  getWorkoutDate(
                    assignment,
                  ),
              },
            )

          const updatedLog =
            response?.data
              ?.workoutLog ||
            response?.data?.log

          if (updatedLog) {
            restoreWorkoutLog(
              updatedLog,
              setCompletedSets,
              setActualValues,
            )

            setWorkoutCompleted(
              Boolean(
                updatedLog.completed,
              ),
            )

            setCaloriesBurned(
              Number(
                updatedLog.caloriesBurned ||
                  0,
              ),
            )
          } else {
            setCompletedSets(
              (current) => ({
                ...current,
                [key]: false,
              }),
            )
          }

          return
        }

        /*
        |--------------------------------------------------------------------------
        | Complete
        |--------------------------------------------------------------------------
        */

        const response =
          await api.post(
            "/workout-logs/set/complete",
            {
              exerciseId,

              setNumber,

              actualReps:
                repsValue === "" ||
                repsValue ===
                  undefined ||
                repsValue === null
                  ? null
                  : Number(
                      repsValue,
                    ),

              actualWeight:
                weightValue ||
                getTargetWeight(
                  exercise,
                ),

              workoutDate:
                getWorkoutDate(
                  assignment,
                ),
            },
          )

        const updatedLog =
          response?.data
            ?.workoutLog ||
          response?.data?.log

        if (updatedLog) {
          restoreWorkoutLog(
            updatedLog,
            setCompletedSets,
            setActualValues,
          )

          setWorkoutCompleted(
            Boolean(
              updatedLog.completed,
            ),
          )

          setCaloriesBurned(
            Number(
              updatedLog.caloriesBurned ||
                0,
            ),
          )
        } else {
          setCompletedSets(
            (current) => ({
              ...current,
              [key]: true,
            }),
          )
        }

      } catch (error) {
        console.error(
          "Unable to update set:",
          error,
        )

        setError(
          error?.response?.data
            ?.message ||
            "Unable to save this set.",
        )
      } finally {
        setSavingSet("")
      }
    }

  /*
  |--------------------------------------------------------------------------
  | Workout timer
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    const calculateElapsed = () => {
      if (!workoutStartedAt) {
        return 0
      }

      if (workoutDurationSeconds !== null && workoutCompleted) {
        return Math.max(0, Number(workoutDurationSeconds) || 0)
      }

      const started = new Date(workoutStartedAt).getTime()

      if (!Number.isFinite(started)) {
        return 0
      }

      const reference = workoutPausedAt
        ? new Date(workoutPausedAt).getTime()
        : Date.now()

      if (!Number.isFinite(reference)) {
        return 0
      }

      const pausedSeconds =
        Number(totalPausedSeconds || 0)

      const currentPauseSeconds =
        workoutPausedAt
          ? Math.max(
              0,
              Math.round(
                (Date.now() -
                  new Date(
                    workoutPausedAt,
                  ).getTime()) /
                  1000,
              ),
            )
          : 0

      return Math.max(
        0,
        Math.round(
          (reference - started) / 1000 -
            pausedSeconds,
        ),
      )
    }

    setWorkoutTimerSeconds(
      calculateElapsed(),
    )

    if (
      !workoutStartedAt ||
      workoutPausedAt ||
      workoutCompleted
    ) {
      return undefined
    }

    const interval =
      window.setInterval(() => {
        setWorkoutTimerSeconds(
          calculateElapsed(),
        )
      }, 1000)

    return () =>
      window.clearInterval(
        interval,
      )
  }, [
    workoutStartedAt,
    workoutPausedAt,
    totalPausedSeconds,
    workoutDurationSeconds,
    workoutCompleted,
  ])

  const handleTimerAction =
    async (action) => {
      if (
        !assignment ||
        timerAction
      ) {
        return
      }

      setTimerAction(action)
      setError("")

      try {
        const response =
          await api.post(
            "/workout-logs/complete",
            {
              action,

              assignmentId:
                assignment._id ||
                assignment.id,

              programId:
                program?._id ||
                program?.id,

              workoutDate:
                getWorkoutDate(
                  assignment,
                ),
            },
          )

        const log =
          response?.data
            ?.workoutLog ||
          response?.data?.log

        if (log) {
          applyWorkoutTimerState(
            log,
            setWorkoutStartedAt,
            setWorkoutPausedAt,
            setTotalPausedSeconds,
            setWorkoutDurationSeconds,
            setWorkoutTimerSeconds,
          )
        }
      } catch (error) {
        console.error(
          `Unable to ${action} workout:`,
          error,
        )

        setError(
          error?.response?.data
            ?.message ||
            `Unable to ${action} workout.`,
        )
      } finally {
        setTimerAction("")
      }
    }

  const handleResetWorkout =
    async () => {
      if (
        !assignment ||
        resettingWorkout
      ) {
        return
      }

      try {
        setResettingWorkout(
          true,
        )

        setShowResetConfirm(
          false,
        )

        setError("")

        const response =
          await api.post(
            "/workout-logs/complete",
            {
              action: "reset",

              assignmentId:
                assignment._id ||
                assignment.id,

              programId:
                program?._id ||
                program?.id,

              workoutDate:
                getWorkoutDate(
                  assignment,
                ),
            },
          )

        const log =
          response?.data
            ?.workoutLog ||
          response?.data?.log

        setCompletedSets({})
        setActualValues({})
        setWorkoutCompleted(false)
        setCaloriesBurned(0)
        setWorkoutStartedAt(null)
        setWorkoutPausedAt(null)
        setTotalPausedSeconds(0)
        setWorkoutDurationSeconds(null)
        setWorkoutTimerSeconds(0)

        if (log) {
          applyWorkoutTimerState(
            log,
            setWorkoutStartedAt,
            setWorkoutPausedAt,
            setTotalPausedSeconds,
            setWorkoutDurationSeconds,
            setWorkoutTimerSeconds,
          )
        }
      } catch (error) {
        console.error(
          "Unable to reset workout:",
          error,
        )

        setError(
          error?.response?.data
            ?.message ||
            "Unable to reset this workout.",
        )
      } finally {
        setResettingWorkout(
          false,
        )
      }
    }

  const formattedWorkoutDuration =
    formatDuration(
      workoutTimerSeconds,
    )

  /*
  |--------------------------------------------------------------------------
  | Actual performance values
  |--------------------------------------------------------------------------
  */

  const updateActualValue =
    (
      exercise,
      setNumber,
      field,
      value,
    ) => {
      const exerciseId =
        getExerciseId(
          exercise,
        )

      const key =
        `${exerciseId}-${setNumber}-${field}`

      setActualValues(
        (current) => ({
          ...current,
          [key]: value,
        }),
      )
    }

  /*
  |--------------------------------------------------------------------------
  | Complete workout
  |--------------------------------------------------------------------------
  */

  const handleCompleteWorkout =
    async () => {
      if (!assignment) {
        return
      }

      if (!workoutStartedAt) {
        setError(
          "Start the workout before finishing it.",
        )

        return
      }

      if (
        totalSets > 0 &&
        completedSetCount <
          totalSets
      ) {
        setError(
          `Please complete all ${totalSets} workout sets before finishing the workout.`,
        )

        return
      }

      try {
        setCompletingWorkout(
          true,
        )

        setError("")

        const response =
          await api.post(
            "/workout-logs/complete",
            {
              assignmentId:
                assignment._id ||
                assignment.id,

              programId:
                program?._id ||
                program?.id,

              workoutDate:
                getWorkoutDate(
                  assignment,
                ),

              steps:
                estimatedSteps,

              caloriesBurned:
                displayedCalories,
            },
          )

        const completedLog =
          response?.data
            ?.workoutLog ||
          response?.data?.log

        const completedDurationSeconds =
          response?.data
            ?.durationSeconds ??
          completedLog?.durationSeconds ??
          null

        const completedTimerLog = {
          ...(completedLog || {}),

          startedAt:
            completedLog?.startedAt ??
            response?.data?.startedAt ??
            workoutStartedAt ??
            null,

          pausedAt: null,

          totalPausedSeconds:
            completedLog?.totalPausedSeconds ??
            response?.data
              ?.totalPausedSeconds ??
            totalPausedSeconds,

          durationSeconds:
            completedDurationSeconds,
        }

        applyWorkoutTimerState(
          completedTimerLog,
          setWorkoutStartedAt,
          setWorkoutPausedAt,
          setTotalPausedSeconds,
          setWorkoutDurationSeconds,
          setWorkoutTimerSeconds,
        )

        const calculatedCalories =
          Number(
            response?.data
              ?.caloriesBurned ||
              completedLog?.caloriesBurned ||
              calculateCalories(
                program,
                exercises,
              ),
          )

        setCaloriesBurned(
          calculatedCalories,
        )

        setWorkoutCompleted(
          true,
        )
      } catch (error) {
        console.error(
          "Unable to complete workout:",
          error,
        )

        setError(
          error?.response?.data
            ?.message ||
            "Unable to complete your workout.",
        )
      } finally {
        setCompletingWorkout(
          false,
        )
      }
    }

  /*
  |--------------------------------------------------------------------------
  | Loading
  |--------------------------------------------------------------------------
  */

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white">
        <WorkoutHeader
          title="Workout"
          gymName={gym?.name}
          onBack={() =>
            navigate(
              "/dashboard",
            )
          }
        />

        <main className="mx-auto max-w-md px-5 py-10">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <div className="flex items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/10 border-t-lime-400" />
            </div>

            <p className="mt-4 text-center text-sm font-bold text-gray-500">
              Loading your workout...
            </p>
          </div>
        </main>
      </div>
    )
  }

  /*
  |--------------------------------------------------------------------------
  | No assignment
  |--------------------------------------------------------------------------
  */

  if (!assignment) {
    return (
      <div className="min-h-screen bg-black text-white">
        <WorkoutHeader
          title="Workout"
          gymName={gym?.name}
          onBack={() =>
            navigate(
              "/dashboard",
            )
          }
        />

        <main className="mx-auto max-w-md px-5 py-10">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-yellow-400 text-black">
              <Dumbbell
                size={28}
              />
            </div>

            <h2 className="mt-5 text-2xl font-black">
              No Workout Assigned
            </h2>

            <p className="mt-2 text-sm leading-6 text-gray-500">
              {error ||
                "Your trainer has not assigned a workout for this date yet."}
            </p>

            <button
              type="button"
              onClick={() =>
                navigate(
                  "/weekly-schedule",
                )
              }
              className="mt-6 w-full rounded-2xl bg-yellow-400 px-5 py-4 text-sm font-black text-black"
            >
              VIEW WEEKLY SCHEDULE
            </button>
          </div>
        </main>
      </div>
    )
  }

  /*
  |--------------------------------------------------------------------------
  | No exercises
  |--------------------------------------------------------------------------
  */

  if (
    exercises.length === 0
  ) {
    return (
      <div className="min-h-screen bg-black text-white">
        <WorkoutHeader
          title={
            program?.name ||
            "Workout"
          }
          gymName={gym?.name}
          onBack={() =>
            navigate(
              "/dashboard",
            )
          }
        />

        <main className="mx-auto max-w-md px-5 py-10">
          <div className="rounded-3xl border border-yellow-400/20 bg-yellow-400/5 p-6 text-center">
            <Dumbbell
              size={32}
              className="mx-auto text-yellow-400"
            />

            <h2 className="mt-4 text-xl font-black">
              Exercises Not Added
            </h2>

            <p className="mt-2 text-sm leading-6 text-gray-500">
              This program has been assigned,
              but no exercises have been added
              to it yet.
            </p>

            <button
              type="button"
              onClick={() =>
                navigate(
                  "/dashboard",
                )
              }
              className="mt-6 w-full rounded-2xl bg-yellow-400 px-5 py-4 text-sm font-black text-black"
            >
              BACK TO DASHBOARD
            </button>
          </div>
        </main>
      </div>
    )
  }

  /*
  |--------------------------------------------------------------------------
  | Main workout
  |--------------------------------------------------------------------------
  */

  return (
    <div className="min-h-screen bg-black pb-32 text-white">
      <WorkoutHeader
        title={
          program?.name ||
          "Workout"
        }
        gymName={gym?.name}
        onBack={() =>
          navigate(
            "/dashboard",
          )
        }
      />

      <main className="mx-auto w-full max-w-md px-5 py-6">
        {/* ---------------------------------------------------------------- */}
        {/* Workout header */}
        {/* ---------------------------------------------------------------- */}

        <section className="rounded-3xl bg-white p-5 text-black">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <span className="inline-flex items-center gap-1 rounded-full bg-lime-400 px-3 py-1 text-[9px] font-black text-black">
                <CheckCircle2
                  size={11}
                />
                ASSIGNED
              </span>

              <h2 className="mt-3 text-2xl font-black">
                {program?.name}
              </h2>

              {program?.description && (
                <p className="mt-2 text-xs leading-5 text-gray-500">
                  {program.description}
                </p>
              )}
            </div>

            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-black text-yellow-400">
              <Dumbbell
                size={23}
              />
            </div>
          </div>

          {/* Workout information */}

          <div className="mt-5 grid grid-cols-2 gap-2">
            <InfoBox
              label="Difficulty"
              value={
                program?.difficulty ||
                "Beginner"
              }
            />

            <InfoBox
              label="Duration"
              value={
                program?.estimatedDuration
                  ? `${program.estimatedDuration} min`
                  : "Not specified"
              }
            />

            <InfoBox
              label="Exercises"
              value={
                exercises.length
              }
            />

            <InfoBox
              label="Sets"
              value={totalSets}
            />

            <InfoBox
              label="Scheduled Time"
              value={formatScheduledTime(assignment)}
              highlight
            />
          </div>

          {/* Progress */}

          <div className="mt-5">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-gray-500">
                Workout progress
              </span>

              <span className="text-lime-600">
                {completedSetCount} /{" "}
                {totalSets} sets
              </span>
            </div>

            <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-200">
              <div
                className="h-full rounded-full bg-lime-400 transition-all duration-500"
                style={{
                  width: `${completionPercentage}%`,
                }}
              />
            </div>

            <p className="mt-2 text-right text-[10px] font-bold text-gray-500">
              {completionPercentage}%
              complete
            </p>
          </div>
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* Error */}
        {/* ---------------------------------------------------------------- */}

        {error && (
          <section className="mt-4 rounded-2xl border border-red-400/20 bg-red-400/5 p-4">
            <p className="text-xs font-bold leading-5 text-red-300">
              {error}
            </p>
          </section>
        )}

        {/* ---------------------------------------------------------------- */}
        {/* Workout tracking */}
        {/* ---------------------------------------------------------------- */}

        <section className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-gray-600">
                Workout Timer
              </p>

              <p className="mt-1 text-xs text-gray-500">
                {workoutCompleted
                  ? "Completed"
                  : workoutPausedAt
                    ? "Paused"
                    : workoutStartedAt
                      ? "In progress"
                      : "Ready to start"}
              </p>
            </div>

            <div className="text-right">
              <p className="font-mono text-3xl font-black tracking-tight">
                {formattedWorkoutDuration}
              </p>

              {totalPausedSeconds > 0 && (
                <p className="mt-1 text-[10px] text-gray-600">
                  Paused:{" "}
                  {formatDuration(
                    totalPausedSeconds,
                  )}
                </p>
              )}
            </div>
          </div>

          <div className="mt-5 grid grid-cols-3 gap-2">
            <TrackingBox
              label="Time"
              value={
                formattedWorkoutDuration
              }
              icon={
                <Clock3
                  size={15}
                />
              }
            />

            <TrackingBox
              label="Steps"
              value={estimatedSteps.toLocaleString()}
              icon={
                <span className="text-sm">
                  👣
                </span>
              }
            />

            <TrackingBox
              label="Calories"
              value={`${displayedCalories} kcal`}
              icon={
                <Flame
                  size={15}
                  fill="currentColor"
                />
              }
            />
          </div>

          <p className="mt-3 text-center text-[9px] leading-4 text-gray-600">
            Steps and calories are estimated from your active workout time.
          </p>

          {!workoutCompleted && (
            <div className="mt-4 grid grid-cols-2 gap-3">
              {!workoutStartedAt ? (
                <button
                  type="button"
                  disabled={
                    Boolean(timerAction)
                  }
                  onClick={() =>
                    handleTimerAction(
                      "start",
                    )
                  }
                  className="col-span-2 flex items-center justify-center gap-2 rounded-2xl bg-lime-400 px-4 py-3 text-sm font-black text-black transition hover:bg-lime-300 disabled:opacity-50"
                >
                  <Play
                    size={17}
                    fill="currentColor"
                  />

                  {timerAction ===
                  "start"
                    ? "STARTING..."
                    : "START WORKOUT"}
                </button>
              ) : workoutPausedAt ? (
                <button
                  type="button"
                  disabled={
                    Boolean(timerAction)
                  }
                  onClick={() =>
                    handleTimerAction(
                      "resume",
                    )
                  }
                  className="col-span-2 flex items-center justify-center gap-2 rounded-2xl bg-lime-400 px-4 py-3 text-sm font-black text-black transition hover:bg-lime-300 disabled:opacity-50"
                >
                  <Play
                    size={17}
                    fill="currentColor"
                  />

                  {timerAction ===
                  "resume"
                    ? "RESUMING..."
                    : "RESUME WORKOUT"}
                </button>
              ) : (
                <button
                  type="button"
                  disabled={
                    Boolean(timerAction)
                  }
                  onClick={() =>
                    handleTimerAction(
                      "pause",
                    )
                  }
                  className="col-span-2 flex items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-black text-black transition hover:bg-gray-200 disabled:opacity-50"
                >
                  <Pause
                    size={17}
                    fill="currentColor"
                  />

                  {timerAction ===
                  "pause"
                    ? "PAUSING..."
                    : "PAUSE WORKOUT"}
                </button>
              )}
            </div>
          )}

          {!workoutCompleted &&
            workoutStartedAt && (
              <button
                type="button"
                disabled={
                  Boolean(timerAction) ||
                  resettingWorkout
                }
                onClick={() =>
                  setShowResetConfirm(
                    true,
                  )
                }
                className="mt-3 w-full rounded-2xl border border-red-400/20 bg-red-400/5 px-4 py-3 text-xs font-black text-red-300 transition hover:bg-red-400/10 disabled:opacity-50"
              >
                {resettingWorkout
                  ? "RESETTING..."
                  : "RESET WORKOUT"}
              </button>
            )}
        </section>

        {showResetConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-5">
            <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-zinc-950 p-6 shadow-2xl">
              <h3 className="text-lg font-black text-white">
                Reset this workout?
              </h3>

              <p className="mt-2 text-sm leading-6 text-gray-500">
                This will clear the current timer and completed sets. You can start the workout again from 00:00.
              </p>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setShowResetConfirm(
                      false,
                    )
                  }
                  className="rounded-2xl bg-white/10 px-4 py-3 text-sm font-black text-white"
                >
                  CANCEL
                </button>

                <button
                  type="button"
                  onClick={
                    handleResetWorkout
                  }
                  disabled={
                    resettingWorkout
                  }
                  className="rounded-2xl bg-red-400 px-4 py-3 text-sm font-black text-black disabled:opacity-50"
                >
                  {resettingWorkout
                    ? "RESETTING..."
                    : "YES, RESET"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ---------------------------------------------------------------- */}
        {/* Exercises */}
        {/* ---------------------------------------------------------------- */}

        <section className="mt-6">
          <div className="mb-4">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-600">
              Today's Training
            </p>

            <h2 className="mt-1 text-lg font-black">
              Complete Your Exercises
            </h2>
          </div>

          <div className="space-y-4">
            {exercises.map(
              (
                programExercise,
                index,
              ) => {
                const exercise =
                  programExercise?.exercise ||
                  {}

                const exerciseId =
                  getExerciseId(
                    programExercise,
                  )

                const sets =
                  Number(
                    programExercise?.sets ||
                      0,
                  )

                const reps =
                  programExercise?.reps

                const duration =
                  programExercise?.duration

                const rest =
                  programExercise?.rest

                const targetWeight =
                  getTargetWeight(
                    programExercise,
                  )

                return (
                  <article
                    key={
                      programExercise?._id ||
                      exerciseId ||
                      index
                    }
                    className="overflow-hidden rounded-3xl border border-white/10 bg-white/5"
                  >
                    {/* Exercise visual */}

                    <div className="w-full overflow-hidden bg-black">
                      {exercise?.image ||
                      exercise?.imageUrl ? (
                        <img
                          src={
                            exercise.image ||
                            exercise.imageUrl
                          }
                          alt={
                            exercise?.name ||
                            `Exercise ${
                              index + 1
                            }`
                          }
                          className="block h-auto max-h-[500px] w-full object-contain object-center"
                        />
                      ) : (
                        <div className="flex min-h-[220px] items-center justify-center">
                          <div className="text-center">
                            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-yellow-400 text-black">
                              <Play
                                size={20}
                                fill="currentColor"
                              />
                            </div>

                            <p className="mt-2 text-xs font-semibold text-gray-500">
                              Exercise demonstration
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-yellow-400">
                            EXERCISE{" "}
                            {index + 1}
                          </p>

                          <h3 className="mt-1 text-lg font-black">
                            {exercise?.name ||
                              "Exercise"}
                          </h3>

                          {exercise?.description && (
                            <p className="mt-2 text-xs leading-5 text-gray-500">
                              {
                                exercise.description
                              }
                            </p>
                          )}
                        </div>

                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/5 text-gray-500">
                          <Dumbbell
                            size={19}
                          />
                        </div>
                      </div>

                      {/* Target information */}

                      <div className="mt-4 grid grid-cols-2 gap-2">
                        <InfoBox
                          label="Sets"
                          value={sets}
                        />

                        <InfoBox
                          label="Reps"
                          value={
                            reps ||
                            (duration
                              ? `${duration} sec`
                              : "As assigned")
                          }
                        />

                        <InfoBox
                          label="Target Weight"
                          value={
                            targetWeight ||
                            "Bodyweight"
                          }
                          highlight
                        />

                        <InfoBox
                          label="Rest"
                          value={
                            rest !==
                            undefined
                              ? `${rest} sec`
                              : "60 sec"
                          }
                          icon={
                            <Clock3
                              size={14}
                            />
                          }
                        />
                      </div>

                      {/* Exercise progress */}

                      {(() => {
                        const exerciseSetCount =
                          Array.from({
                            length: sets,
                          }).filter(
                            (_, setIndex) =>
                              Boolean(
                                completedSets[
                                  `${exerciseId}-${setIndex + 1}`
                                ],
                              ),
                          ).length

                        const exerciseCompleted =
                          sets > 0 &&
                          exerciseSetCount >=
                            sets

                        return (
                          <div
                            className={`mt-4 flex items-center justify-between rounded-2xl px-4 py-3 ${
                              exerciseCompleted
                                ? "bg-lime-400/10"
                                : "bg-black"
                            }`}
                          >
                            <div>
                              <p className="text-[10px] font-black uppercase tracking-wider text-gray-600">
                                Exercise Progress
                              </p>

                              <p className="mt-1 text-xs font-bold text-gray-400">
                                {exerciseSetCount}{" "}
                                / {sets} sets completed
                              </p>
                            </div>

                            <span
                              className={`rounded-full px-3 py-1 text-[9px] font-black ${
                                exerciseCompleted
                                  ? "bg-lime-400 text-black"
                                  : "bg-white/10 text-gray-500"
                              }`}
                            >
                              {exerciseCompleted
                                ? "COMPLETED"
                                : "IN PROGRESS"}
                            </span>
                          </div>
                        )
                      })()}

                      {/* Trainer notes */}

                      {programExercise?.notes && (
                        <div className="mt-4 rounded-2xl bg-black p-4">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-600">
                            Trainer Instructions
                          </p>

                          <p className="mt-2 text-xs leading-5 text-gray-400">
                            {
                              programExercise.notes
                            }
                          </p>
                        </div>
                      )}

                      {/* Sets */}

                      <div className="mt-5">
                        <p className="mb-3 text-sm font-bold">
                          Complete your sets
                        </p>

                        <div className="space-y-3">
                          {Array.from(
                            {
                              length:
                                sets,
                            },
                            (
                              _,
                              setIndex,
                            ) => {
                              const setNumber =
                                setIndex +
                                1

                              const key =
                                `${exerciseId}-${setNumber}`

                              const isCompleted =
                                Boolean(
                                  completedSets[
                                    key
                                  ],
                                )

                              const repsKey =
                                `${key}-reps`

                              const weightKey =
                                `${key}-weight`

                              const isSaving =
                                savingSet ===
                                key

                              return (
                                <div
                                  key={
                                    key
                                  }
                                  className={`rounded-2xl border p-4 transition ${
                                    isCompleted
                                      ? "border-lime-400/30 bg-lime-400/10"
                                      : "border-white/10 bg-white/5"
                                  }`}
                                >
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <p className="text-sm font-black">
                                        Set{" "}
                                        {
                                          setNumber
                                        }
                                      </p>

                                      <p className="mt-0.5 text-[10px] text-gray-500">
                                        Target:{" "}
                                        {reps ||
                                          duration ||
                                          "—"}{" "}
                                        {duration
                                          ? "seconds"
                                          : "reps"}{" "}
                                        ×{" "}
                                        {targetWeight ||
                                          "Bodyweight"}
                                      </p>
                                    </div>

                                    <div
                                      className={`flex h-9 w-9 items-center justify-center rounded-full ${
                                        isCompleted
                                          ? "bg-lime-400 text-black"
                                          : "border border-white/10 text-gray-600"
                                      }`}
                                    >
                                      {isCompleted && (
                                        <Check
                                          size={
                                            18
                                          }
                                        />
                                      )}
                                    </div>
                                  </div>

                                  {/* Actual performance */}

                                  <div className="mt-3 grid grid-cols-2 gap-2">
                                    <label className="block">
                                      <span className="mb-1 block text-[9px] font-bold uppercase tracking-wider text-gray-600">
                                        Actual Reps
                                      </span>

                                      <input
                                        type="number"
                                        min="0"
                                        value={
                                          actualValues[
                                            repsKey
                                          ] ??
                                          ""
                                        }
                                        onChange={(
                                          event,
                                        ) =>
                                          updateActualValue(
                                            programExercise,
                                            setNumber,
                                            "reps",
                                            event
                                              .target
                                              .value,
                                          )
                                        }
                                        className="w-full rounded-xl border border-white/10 bg-black px-3 py-3 text-sm font-bold text-white outline-none focus:border-lime-400"
                                        placeholder={
                                          reps ||
                                          "Reps"
                                        }
                                      />
                                    </label>

                                    <label className="block">
                                      <span className="mb-1 block text-[9px] font-bold uppercase tracking-wider text-gray-600">
                                        Actual Weight
                                      </span>

                                      <input
                                        type="text"
                                        value={
                                          actualValues[
                                            weightKey
                                          ] ??
                                          ""
                                        }
                                        onChange={(
                                          event,
                                        ) =>
                                          updateActualValue(
                                            programExercise,
                                            setNumber,
                                            "weight",
                                            event
                                              .target
                                              .value,
                                          )
                                        }
                                        className="w-full rounded-xl border border-white/10 bg-black px-3 py-3 text-sm font-bold text-white outline-none focus:border-lime-400"
                                        placeholder={
                                          targetWeight ||
                                          "e.g. 20 kg"
                                        }
                                      />
                                    </label>
                                  </div>

                                  {/* Complete set */}

                                  <button
                                    type="button"
                                    disabled={
                                      isSaving ||
                                      !exerciseId
                                    }
                                    onClick={() =>
                                      toggleSet(
                                        programExercise,
                                        setNumber,
                                      )
                                    }
                                    className={`mt-3 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-xs font-black transition ${
                                      isCompleted
                                        ? "bg-white/10 text-white"
                                        : "bg-lime-400 text-black hover:bg-lime-300"
                                    }`}
                                  >
                                    {isSaving ? (
                                      <>
                                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />

                                        SAVING...
                                      </>
                                    ) : isCompleted ? (
                                      <>
                                        <Check
                                          size={
                                            15
                                          }
                                        />

                                        SET COMPLETED
                                      </>
                                    ) : (
                                      <>
                                        <CheckCircle2
                                          size={
                                            15
                                          }
                                        />

                                        COMPLETE SET
                                      </>
                                    )}
                                  </button>
                                </div>
                              )
                            },
                          )}
                        </div>
                      </div>
                    </div>
                  </article>
                )
              },
            )}
          </div>
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* Calories */}
        {/* ---------------------------------------------------------------- */}

        {workoutCompleted && (
          <section className="mt-6 rounded-3xl bg-yellow-400 p-5 text-black">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-black text-yellow-400">
                <Flame
                  size={24}
                  fill="currentColor"
                />
              </div>

              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-black/50">
                  Estimated Calories Burned
                </p>

                <p className="mt-1 text-2xl font-black">
                  {Math.round(
                    caloriesBurned,
                  )}{" "}
                  kcal
                </p>
              </div>
            </div>

            <p className="mt-3 text-xs leading-5 text-black/60">
              Calories are estimated from your
              completed workout and available
              workout information.
            </p>
          </section>
        )}

        {/* ---------------------------------------------------------------- */}
        {/* Complete workout */}
        {/* ---------------------------------------------------------------- */}

        {!workoutCompleted && (
          <section className="mt-6">
            <button
              type="button"
              disabled={
                completingWorkout ||
                !workoutStartedAt ||
                completedSetCount <
                  totalSets
              }
              onClick={
                handleCompleteWorkout
              }
              className={`flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-4 text-sm font-black transition ${
                completedSetCount >=
                totalSets
                  ? "bg-lime-400 text-black hover:bg-lime-300"
                  : "cursor-not-allowed bg-white/10 text-gray-600"
              }`}
            >
              {completingWorkout ? (
                <>
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />

                  SAVING WORKOUT...
                </>
              ) : (
                <>
                  <CheckCircle2
                    size={18}
                  />

                  COMPLETE WORKOUT
                </>
              )}
            </button>

            {completedSetCount <
              totalSets && (
              <p className="mt-3 text-center text-[10px] font-bold text-gray-600">
                Complete all{" "}
                {totalSets} sets to
                finish this workout.
              </p>
            )}
          </section>
        )}

        {/* ---------------------------------------------------------------- */}
        {/* Completed message */}
        {/* ---------------------------------------------------------------- */}

        {workoutCompleted && (
          <section className="mt-6 rounded-3xl border border-lime-400/20 bg-lime-400/5 p-5 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-lime-400 text-black">
              <CheckCircle2
                size={28}
              />
            </div>

            <p className="mt-4 text-xs font-black uppercase tracking-wider text-lime-400">
              Workout Completed
            </p>

            <h2 className="mt-1 text-xl font-black">
              Excellent Work!
            </h2>

            <p className="mt-2 text-xs leading-5 text-gray-500">
              Your completed workout has
              been recorded. Your training
              team can now see your progress.
            </p>

            <button
              type="button"
              onClick={() =>
                navigate(
                  "/dashboard",
                )
              }
              className="mt-5 w-full rounded-2xl bg-white px-5 py-4 text-sm font-black text-black"
            >
              BACK TO DASHBOARD
            </button>
          </section>
        )}
      </main>
    </div>
  )
}

/*
|--------------------------------------------------------------------------
| Header
|--------------------------------------------------------------------------
*/

function WorkoutHeader({
  title,
  gymName,
  onBack,
}) {
  const displayGymName =
    gymName
      ? `${gymName} Training`
      : "Training"

  return (
    <header className="border-b border-white/10">
      <div className="mx-auto flex max-w-md items-center gap-4 px-5 py-4">
        <button
          type="button"
          onClick={onBack}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10"
          aria-label="Go back"
        >
          <ArrowLeft
            size={20}
          />
        </button>

        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-600">
            {displayGymName}
          </p>

          <h1 className="truncate text-xl font-black">
            {title}
          </h1>
        </div>
      </div>
    </header>
  )
}

/*
|--------------------------------------------------------------------------
| Tracking Box
|--------------------------------------------------------------------------
*/

function TrackingBox({
  label,
  value,
  icon,
}) {
  return (
    <div className="rounded-2xl bg-black p-3">
      <div className="flex items-center gap-1 text-yellow-400">
        {icon}

        <p className="text-[9px] font-bold uppercase tracking-wider text-gray-600">
          {label}
        </p>
      </div>

      <p className="mt-2 truncate text-sm font-black text-white">
        {value}
      </p>
    </div>
  )
}

/*
|--------------------------------------------------------------------------
| Info Box
|--------------------------------------------------------------------------
*/

function InfoBox({
  label,
  value,
  highlight = false,
  icon,
}) {
  return (
    <div className="rounded-2xl bg-black p-3">
      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-600">
        {label}
      </p>

      <p
        className={`mt-1 flex items-center gap-1 text-sm font-black ${
          highlight
            ? "text-yellow-400"
            : "text-white"
        }`}
      >
        {icon}

        {value ?? "—"}
      </p>
    </div>
  )
}

/*
|--------------------------------------------------------------------------
| Extract assignment
|--------------------------------------------------------------------------
*/

function extractAssignment(
  response,
) {
  if (!response) {
    return null
  }

  /*
  |--------------------------------------------------------------------------
  | Standard assignment response
  |--------------------------------------------------------------------------
  */

  if (response.assignment) {
    return response.assignment
  }

  if (
    response.programAssignment
  ) {
    return response.programAssignment
  }

  /*
  |--------------------------------------------------------------------------
  | IMPORTANT:
  |
  | Your backend's /my-today response puts the assignment
  | information inside response.workout.
  |--------------------------------------------------------------------------
  */

  if (response.workout) {
    if (
      response.workout.assignment
    ) {
      return response.workout.assignment
    }

    if (
      response.workout.program
    ) {
      return {
        _id:
          response.workout
            .assignmentId,

        id:
          response.workout
            .assignmentId,

        program:
          response.workout
            .program,

        workoutDate:
          response.workout
            .workoutDate ||
          response.workout.date,

        startTime:
          response.workout.startTime ||
          "",

        endTime:
          response.workout.endTime ||
          "",

        reminderEnabled:
          response.workout.reminderEnabled ??
          true,

        reminderMinutesBefore:
          response.workout.reminderMinutesBefore ??
          5,

        notes:
          response.workout
            .notes,

        status:
          "active",
      }
    }
  }

  if (
    response.data?.assignment
  ) {
    return response.data.assignment
  }

  if (
    response.data
      ?.programAssignment
  ) {
    return response.data
      .programAssignment
  }

  if (
    response.data?.workout
      ?.assignment
  ) {
    return response.data.workout
      .assignment
  }

  if (
    response.data?.workout
      ?.program
  ) {
    const workout =
      response.data.workout

    return {
      _id:
        workout.assignmentId,

      id:
        workout.assignmentId,

      program:
        workout.program,

      workoutDate:
        workout.workoutDate ||
        workout.date,

      startTime:
        workout.startTime ||
        "",

      endTime:
        workout.endTime ||
        "",

      reminderEnabled:
        workout.reminderEnabled ??
        true,

      reminderMinutesBefore:
        workout.reminderMinutesBefore ??
        5,

      notes:
        workout.notes,

      status:
        "active",
    }
  }

  return null
}

/*
|--------------------------------------------------------------------------
| Extract assignments
|--------------------------------------------------------------------------
*/

function extractAssignments(
  response,
) {
  if (!response) {
    return []
  }

  if (
    Array.isArray(
      response.assignments,
    )
  ) {
    return response.assignments
  }

  if (
    Array.isArray(
      response.programAssignments,
    )
  ) {
    return response.programAssignments
  }

  if (
    Array.isArray(
      response.data
        ?.assignments,
    )
  ) {
    return response.data
      .assignments
  }

  if (
    Array.isArray(
      response.data
        ?.programAssignments,
    )
  ) {
    return response.data
      .programAssignments
  }

  return []
}

/*
|--------------------------------------------------------------------------
| Normalize assignment
|--------------------------------------------------------------------------
*/

function normalizeWorkoutAssignment(
  value,
) {
  if (!value) {
    return null
  }

  if (
    value.program
  ) {
    return value
  }

  if (
    value.workout?.program
  ) {
    return {
      _id:
        value.workout
          .assignmentId,

      id:
        value.workout
          .assignmentId,

      program:
        value.workout
          .program,

      workoutDate:
        value.workout
          .workoutDate ||
        value.workout.date,

      startTime:
        value.workout.startTime ||
        "",

      endTime:
        value.workout.endTime ||
        "",

      reminderEnabled:
        value.workout.reminderEnabled ??
        true,

      reminderMinutesBefore:
        value.workout.reminderMinutesBefore ??
        5,

      durationSeconds:
        value.durationSeconds ??
        value.workout.durationSeconds ??
        null,

      notes:
        value.workout
          .notes,

      status:
        "active",
    }
  }

  return value
}

/*
|--------------------------------------------------------------------------
| Restore existing workout log
|--------------------------------------------------------------------------
*/

async function restoreExistingLog(
  assignment,
  mounted,
  setCompletedSets,
  setActualValues,
  setWorkoutCompleted,
  setCaloriesBurned,
  setWorkoutStartedAt,
  setWorkoutPausedAt,
  setTotalPausedSeconds,
  setWorkoutDurationSeconds,
  fallbackDurationSeconds = null,
) {
  if (!assignment) {
    return
  }

  try {
    const workoutDate =
      getWorkoutDate(
        assignment,
      )

    const response =
      await api.get(
        "/workout-logs/me",
        {
          params: {
            date: workoutDate,
          },
        },
      )

    if (!mounted) {
      return
    }

    const log =
      response?.data
        ?.workoutLog ||
      response?.data?.log ||
      response?.data

    if (!log) {
      return
    }

    restoreWorkoutLog(
      log,
      setCompletedSets,
      setActualValues,
    )

    setWorkoutCompleted(
      Boolean(
        log.completed,
      ),
    )

    setCaloriesBurned(
      Number(
        log.caloriesBurned ||
          0,
      ),
    )

    const persistedDuration =
      log?.durationSeconds !== null &&
      log?.durationSeconds !== undefined
        ? Number(
            log.durationSeconds,
          )
        : null

    const assignmentDuration =
      assignment?.durationSeconds !== null &&
      assignment?.durationSeconds !== undefined
        ? Number(
            assignment.durationSeconds,
          )
        : null

    const fallbackDuration =
      fallbackDurationSeconds !== null &&
      fallbackDurationSeconds !== undefined &&
      Number.isFinite(
        Number(
          fallbackDurationSeconds,
        ),
      )
        ? Number(
            fallbackDurationSeconds,
          )
        : null

    const timerLog =
      log?.completed &&
      persistedDuration === null &&
      (assignmentDuration !== null ||
        fallbackDuration !== null)
        ? {
            ...log,

            durationSeconds:
              assignmentDuration !==
              null
                ? assignmentDuration
                : fallbackDuration,
          }
        : log

    applyWorkoutTimerState(
      timerLog,
      setWorkoutStartedAt,
      setWorkoutPausedAt,
      setTotalPausedSeconds,
      setWorkoutDurationSeconds,
      setWorkoutTimerSeconds,
    )
  } catch (error) {
    /*
    |--------------------------------------------------------------------------
    | A missing log is normal before the member starts the workout.
    |--------------------------------------------------------------------------
    */

    if (
      error?.response?.status !==
      404
    ) {
      console.warn(
        "Unable to restore workout log:",
        error,
      )
    }
  }
}

/*
|--------------------------------------------------------------------------
| Exercise ID
|--------------------------------------------------------------------------
*/

function getExerciseId(
  programExercise,
) {
  const exercise =
    programExercise?.exercise

  return (
    exercise?._id ||
    exercise?.id ||
    programExercise?.exerciseId ||
    ""
  )
}

/*
|--------------------------------------------------------------------------
| Target weight
|--------------------------------------------------------------------------
*/

function getTargetWeight(
  exercise,
) {
  return (
    exercise?.weight ||
    exercise?.targetWeight ||
    exercise?.actualWeight ||
    ""
  )
}

/*
|--------------------------------------------------------------------------
| Workout date
|--------------------------------------------------------------------------
*/

function getWorkoutDate(
  assignment,
) {
  const rawDate =
    assignment?.workoutDate ||
    assignment?.date

  return (
    normalizeDateKey(rawDate) ||
    normalizeDateKey(new Date())
  )
}

/*
|--------------------------------------------------------------------------
| Find assignment for date
|--------------------------------------------------------------------------
*/

function findAssignmentForDate(
  assignments,
  requestedDate,
) {
  const target =
    normalizeDateKey(
      requestedDate,
    )

  if (!target) {
    return null
  }

  const matching =
    assignments.filter(
      (assignment) => {
        if (!assignment) {
          return false
        }

        if (
          assignment.status &&
          assignment.status !==
            "active"
        ) {
          return false
        }

        return (
          normalizeDateKey(
            assignment.workoutDate ||
              assignment.date,
          ) === target
        )
      },
    )

  matching.sort(
    (
      first,
      second,
    ) =>
      new Date(
        second.createdAt || 0,
      ).getTime() -
      new Date(
        first.createdAt || 0,
      ).getTime(),
  )

  return (
    matching[0] || null
  )
}

/*
|--------------------------------------------------------------------------
| Find current assignment
|--------------------------------------------------------------------------
*/

function findCurrentAssignment(
  assignments,
) {
  return findAssignmentForDate(
    assignments,
    normalizeDateKey(
      new Date(),
    ),
  )
}

/*
|--------------------------------------------------------------------------
| Restore workout log
|--------------------------------------------------------------------------
*/

function restoreWorkoutLog(
  log,
  setCompletedSets,
  setActualValues,
) {
  const completed = {}
  const actual = {}

  const exercises =
    Array.isArray(
      log?.exercises,
    )
      ? log.exercises
      : []

  exercises.forEach(
    (exerciseLog) => {
      const exerciseId =
        exerciseLog?.exercise?._id ||
        exerciseLog?.exercise ||
        exerciseLog?.exerciseId

      if (!exerciseId) {
        return
      }

      const sets =
        Array.isArray(
          exerciseLog?.sets,
        )
          ? exerciseLog.sets
          : []

      sets.forEach(
        (set) => {
          const key =
            `${exerciseId}-${set.setNumber}`

          completed[key] =
            Boolean(
              set.completed,
            )

          if (
            set.actualReps !==
              null &&
            set.actualReps !==
              undefined
          ) {
            actual[
              `${key}-reps`
            ] =
              set.actualReps
          }

          if (
            set.actualWeight
          ) {
            actual[
              `${key}-weight`
            ] =
              set.actualWeight
          }
        },
      )
    },
  )

  setCompletedSets(
    completed,
  )

  setActualValues(
    actual,
  )
}

/*
|--------------------------------------------------------------------------
| Workout timer helpers
|--------------------------------------------------------------------------
*/

function applyWorkoutTimerState(
  log,
  setStartedAt,
  setPausedAt,
  setPausedSeconds,
  setDurationSeconds,
  setTimerSeconds,
) {
  const startedAt =
    log?.startedAt || null

  const pausedAt =
    log?.pausedAt || null

  const pausedSeconds =
    Number(
      log?.totalPausedSeconds ||
        0,
    )

  // A duration is final only after the workout has been completed.
  // Some existing WorkoutLog documents may contain durationSeconds: 0
  // as a schema/default value while the workout is still in progress.
  // That must NOT stop the live timer.
  const duration =
    log?.completed &&
    log?.durationSeconds !==
      null &&
    log?.durationSeconds !==
      undefined
      ? Number(
          log.durationSeconds,
        ) || 0
      : null

  setStartedAt(
    startedAt,
  )

  setPausedAt(
    pausedAt,
  )

  setPausedSeconds(
    pausedSeconds,
  )

  setDurationSeconds(
    duration,
  )

  if (duration !== null) {
    setTimerSeconds(
      duration,
    )

    return
  }

  if (!startedAt) {
    setTimerSeconds(0)

    return
  }

  const started =
    new Date(
      startedAt,
    ).getTime()

  const reference =
    pausedAt
      ? new Date(
          pausedAt,
        ).getTime()
      : Date.now()

  if (
    !Number.isFinite(
      started,
    ) ||
    !Number.isFinite(
      reference,
    )
  ) {
    setTimerSeconds(0)

    return
  }

  setTimerSeconds(
    Math.max(
      0,
      Math.round(
        (reference -
          started) /
          1000 -
          pausedSeconds,
      ),
    ),
  )
}

function formatDuration(
  totalSeconds,
) {
  const seconds =
    Math.max(
      0,
      Number(
        totalSeconds,
      ) || 0,
    )

  const hours =
    Math.floor(
      seconds / 3600,
    )

  const minutes =
    Math.floor(
      (seconds % 3600) /
        60,
    )

  const remainingSeconds =
    seconds % 60

  if (hours > 0) {
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`
  }

  return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`
}

/*
|--------------------------------------------------------------------------
| Calories
|--------------------------------------------------------------------------
*/

function calculateCalories(
  program,
  exercises,
) {
  const duration =
    Number(
      program?.estimatedDuration ||
        0,
    )

  if (duration <= 0) {
    return 0
  }

  const caloriesPerMinute =
    7

  const exerciseFactor =
    Math.max(
      0.75,
      Math.min(
        1.25,
        exercises.length /
          8,
      ),
    )

  return Math.round(
    duration *
      caloriesPerMinute *
      exerciseFactor,
  )
}

/*
|--------------------------------------------------------------------------
| Scheduled time
|--------------------------------------------------------------------------
*/

function formatScheduledTime(
  assignment,
) {
  const start =
    assignment?.startTime ||
    ""

  const end =
    assignment?.endTime ||
    ""

  if (!start && !end) {
    return "Not scheduled"
  }

  const formatTime = (
    value,
  ) => {
    if (!value) {
      return ""
    }

    const match =
      String(value).match(
        /^(\d{1,2}):(\d{2})$/,
      )

    if (!match) {
      return String(value)
    }

    let hour =
      Number(match[1])

    const minute =
      match[2]

    const period =
      hour >= 12
        ? "PM"
        : "AM"

    hour =
      hour % 12 || 12

    return `${hour}:${minute} ${period}`
  }

  const formattedStart =
    formatTime(start)

  const formattedEnd =
    formatTime(end)

  if (
    formattedStart &&
    formattedEnd
  ) {
    return `${formattedStart} - ${formattedEnd}`
  }

  return (
    formattedStart ||
    formattedEnd
  )
}

/*
|--------------------------------------------------------------------------
| Date helper
|--------------------------------------------------------------------------
*/

function normalizeDateKey(
  value,
) {
  if (!value) {
    return ""
  }

  /*
  |--------------------------------------------------------------------------
  | Preserve exact calendar dates.
  |
  | MongoDB Date values are commonly serialized as:
  | "YYYY-MM-DDT00:00:00.000Z".
  |
  | For workout assignments we need the calendar date itself, not an
  | ISO timestamp, so extract the date portion when possible.
  |--------------------------------------------------------------------------
  */

  if (
    typeof value ===
    "string"
  ) {
    const trimmed =
      value.trim()

    if (
      /^\d{4}-\d{2}-\d{2}$/.test(
        trimmed,
      )
    ) {
      return trimmed
    }

    const isoDateMatch =
      trimmed.match(
        /^(\d{4}-\d{2}-\d{2})T/,
      )

    if (isoDateMatch) {
      return isoDateMatch[1]
    }
  }

  const date =
    new Date(value)

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return ""
  }

  return [
    date.getFullYear(),
    String(
      date.getMonth() + 1,
    ).padStart(2, "0"),
    String(
      date.getDate(),
    ).padStart(2, "0"),
  ].join("-")
}

function startOfDay(
  date,
) {
  const result =
    new Date(date)

  result.setHours(
    0,
    0,
    0,
    0,
  )

  return result
}

export default Workout