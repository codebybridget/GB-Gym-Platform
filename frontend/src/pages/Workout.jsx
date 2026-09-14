import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Clock3,
  Dumbbell,
  Flame,
  Play,
  Pause,
  RotateCcw,
  Target,
  Trophy,
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

import { useGym } from "../context/GymContext.jsx"

import {
  motion,
  AnimatePresence,
} from "framer-motion"


const pageVariants = {
  hidden: {
    opacity: 0,
  },

  visible: {
    opacity: 1,

    transition: {
      duration: 0.4,
      staggerChildren: 0.055,
    },
  },
}


const itemVariants = {
  hidden: {
    opacity: 0,
    y: 16,
  },

  visible: {
    opacity: 1,
    y: 0,

    transition: {
      duration: 0.35,
      ease: "easeOut",
    },
  },
}


function Workout() {
  const navigate =
    useNavigate()

  const location =
    useLocation()

  const { gym } =
    useGym() || {}

  const gymName =
    gym?.name?.trim() ||
    "Gym"

  /*
  |--------------------------------------------------------------------------
  | Read workout information from both:
  |
  | 1. React Router state
  | 2. URL query parameters
  |--------------------------------------------------------------------------
  */

  const queryParams =
    useMemo(
      () =>
        new URLSearchParams(
          location.search,
        ),
      [location.search],
    )

  const routeState =
    location.state || {}

  const stateWorkout =
    routeState.workout ||
    null

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

  const navigationDurationSeconds =
    routeState.durationSeconds ??
    stateWorkout?.durationSeconds ??
    (
      queryParams.has(
        "durationSeconds",
      )
        ? Number(
            queryParams.get(
              "durationSeconds",
            ),
          )
        : null
    )

  const [
    assignment,
    setAssignment,
  ] = useState(null)

  const [
    loading,
    setLoading,
  ] = useState(true)

  const [
    error,
    setError,
  ] = useState("")

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
    navigationDurationSeconds !==
      null &&
      navigationDurationSeconds !==
        undefined &&
      Number.isFinite(
        Number(
          navigationDurationSeconds,
        ),
      )
      ? Number(
          navigationDurationSeconds,
        )
      : null,
  )

  const [
    workoutTimerSeconds,
    setWorkoutTimerSeconds,
  ] = useState(
    navigationDurationSeconds !==
      null &&
      navigationDurationSeconds !==
        undefined &&
      Number.isFinite(
        Number(
          navigationDurationSeconds,
        ),
      )
      ? Number(
          navigationDurationSeconds,
        )
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

          const programsResponse =
            await getMyPrograms()

          const assignments =
            extractAssignments(
              programsResponse,
            )

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

          if (
            !selectedAssignment &&
            assignments.length > 0
          ) {
            selectedAssignment =
              findCurrentAssignment(
                assignments,
              )
          }

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

          selectedAssignment =
            normalizeWorkoutAssignment(
              selectedAssignment,
            )

          setAssignment(
            selectedAssignment,
          )

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
        } catch (
          loadError
        ) {
          console.error(
            "Unable to load workout:",
            loadError,
          )

          if (mounted) {
            setError(
              loadError?.response?.data
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
    assignment?.program ||
    null

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
              first?.order ||
                0,
            ) -
            Number(
              second?.order ||
                0,
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


  /*
  |--------------------------------------------------------------------------
  | Estimated activity metrics
  |--------------------------------------------------------------------------
  */

  const estimatedSteps =
    Math.max(
      0,
      Math.round(
        (Number(
          workoutTimerSeconds,
        ) /
          60) *
          100,
      ),
    )

  const estimatedLiveCalories =
    Math.max(
      0,
      Math.round(
        (Number(
          workoutTimerSeconds,
        ) /
          60) *
          7 *
          Math.max(
            0.75,
            Math.min(
              1.25,
              exercises.length /
                8,
            ),
          ),
      ),
    )

  const displayedCalories =
    workoutCompleted
      ? Math.round(
          Number(
            caloriesBurned || 0,
          ),
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
      } catch (
        saveError
      ) {
        console.error(
          "Unable to update set:",
          saveError,
        )

        setError(
          saveError?.response?.data
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
    const calculateElapsed =
      () => {
        if (!workoutStartedAt) {
          return 0
        }

        if (
          workoutDurationSeconds !==
            null &&
          workoutCompleted
        ) {
          return Math.max(
            0,
            Number(
              workoutDurationSeconds,
            ) || 0,
          )
        }

        const started =
          new Date(
            workoutStartedAt,
          ).getTime()

        if (
          !Number.isFinite(
            started,
          )
        ) {
          return 0
        }

        const reference =
          workoutPausedAt
            ? new Date(
                workoutPausedAt,
              ).getTime()
            : Date.now()

        if (
          !Number.isFinite(
            reference,
          )
        ) {
          return 0
        }

        const pausedSeconds =
          Number(
            totalPausedSeconds ||
              0,
          )

        return Math.max(
          0,
          Math.round(
            (reference -
              started) /
              1000 -
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
      window.setInterval(
        () => {
          setWorkoutTimerSeconds(
            calculateElapsed(),
          )
        },
        1000,
      )

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


  /*
  |--------------------------------------------------------------------------
  | Timer action
  |--------------------------------------------------------------------------
  */

  const handleTimerAction =
    async (
      action,
    ) => {
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
      } catch (
        timerError
      ) {
        console.error(
          `Unable to ${action} workout:`,
          timerError,
        )

        setError(
          timerError?.response?.data
            ?.message ||
            `Unable to ${action} workout.`,
        )
      } finally {
        setTimerAction("")
      }
    }


  /*
  |--------------------------------------------------------------------------
  | Reset
  |--------------------------------------------------------------------------
  */

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
      } catch (
        resetError
      ) {
        console.error(
          "Unable to reset workout:",
          resetError,
        )

        setError(
          resetError?.response?.data
            ?.message ||
            "Unable to reset this workout.",
        )
      } finally {
        setResettingWorkout(
          false,
        )
      }
    }


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
      } catch (
        completeError
      ) {
        console.error(
          "Unable to complete workout:",
          completeError,
        )

        setError(
          completeError?.response?.data
            ?.message ||
            "Unable to complete your workout.",
        )
      } finally {
        setCompletingWorkout(
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
  | Loading
  |--------------------------------------------------------------------------
  */

  if (loading) {
    return (
      <div className="min-h-screen bg-[#020617] text-white">
        <WorkoutHeader
          title="Workout"
          gymName={gymName}
          onBack={() =>
            navigate(
              "/dashboard",
            )
          }
        />

        <main className="mx-auto max-w-md px-5 py-10">
          <motion.div
            initial={{
              opacity: 0,
              y: 12,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            className="rounded-3xl border border-white/10 bg-[#07111f] p-8 text-center"
          >
            <motion.div
              animate={{
                rotate: 360,
              }}
              transition={{
                duration: 1.3,
                repeat: Infinity,
                ease: "linear",
              }}
              className="mx-auto h-9 w-9 rounded-full border-2 border-white/10 border-t-lime-400"
            />

            <p className="mt-4 text-sm font-bold text-gray-500">
              Loading your workout...
            </p>
          </motion.div>
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
      <div className="min-h-screen bg-[#020617] text-white">
        <WorkoutHeader
          title="Workout"
          gymName={gymName}
          onBack={() =>
            navigate(
              "/dashboard",
            )
          }
        />

        <main className="mx-auto max-w-md px-5 py-10">
          <motion.div
            initial={{
              opacity: 0,
              y: 15,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            className="rounded-3xl border border-white/10 bg-[#07111f] p-7 text-center"
          >
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
              className="mt-6 w-full rounded-2xl bg-yellow-400 px-5 py-4 text-sm font-black text-black transition hover:bg-yellow-300"
            >
              VIEW WEEKLY SCHEDULE
            </button>
          </motion.div>
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
      <div className="min-h-screen bg-[#020617] text-white">
        <WorkoutHeader
          title={
            program?.name ||
            "Workout"
          }
          gymName={gymName}
          onBack={() =>
            navigate(
              "/dashboard",
            )
          }
        />

        <main className="mx-auto max-w-md px-5 py-10">
          <motion.div
            initial={{
              opacity: 0,
              y: 15,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            className="rounded-3xl border border-yellow-400/20 bg-yellow-400/5 p-7 text-center"
          >
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
          </motion.div>
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
    <motion.div
      variants={pageVariants}
      initial="hidden"
      animate="visible"
      className="min-h-screen bg-[#020617] pb-32 text-white"
    >
      <WorkoutHeader
        title={
          program?.name ||
          "Workout"
        }
        gymName={gymName}
        onBack={() =>
          navigate(
            "/dashboard",
          )
        }
      />

      <main className="mx-auto w-full max-w-md px-5 py-6">

        {/* Workout overview */}

        <motion.section
          variants={itemVariants}
          className="relative overflow-hidden rounded-3xl bg-yellow-400 p-5 text-black shadow-xl shadow-yellow-950/10"
        >
          <motion.div
            animate={{
              x: [0, 12, 0],
              y: [0, -8, 0],
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute -right-16 -top-16 h-36 w-36 rounded-full bg-white/30 blur-3xl"
          />

          <div className="relative">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <span className="inline-flex items-center gap-1 rounded-full bg-black px-3 py-1 text-[9px] font-black text-yellow-400">
                  <CheckCircle2
                    size={11}
                  />
                  ASSIGNED
                </span>

                <h2 className="mt-3 text-2xl font-black">
                  {program?.name}
                </h2>

                {program?.description && (
                  <p className="mt-2 text-xs leading-5 text-black/60">
                    {
                      program.description
                    }
                  </p>
                )}
              </div>

              <motion.div
                animate={{
                  rotate: [0, 5, -5, 0],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-black text-yellow-400"
              >
                <Dumbbell
                  size={23}
                />
              </motion.div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-2">
              <InfoBox
                label="Difficulty"
                value={
                  program?.difficulty ||
                  "Beginner"
                }
                light
              />

              <InfoBox
                label="Duration"
                value={
                  program?.estimatedDuration
                    ? `${program.estimatedDuration} min`
                    : "Not specified"
                }
                light
              />

              <InfoBox
                label="Exercises"
                value={
                  exercises.length
                }
                light
              />

              <InfoBox
                label="Sets"
                value={totalSets}
                light
              />

              <InfoBox
                label="Scheduled Time"
                value={formatScheduledTime(
                  assignment,
                )}
                highlight
                light
              />
            </div>

            <div className="mt-5">
              <div className="flex items-center justify-between text-xs font-black">
                <span className="text-black/50">
                  Workout progress
                </span>

                <span>
                  {completedSetCount} /{" "}
                  {totalSets}
                </span>
              </div>

              <div className="mt-2 h-2 overflow-hidden rounded-full bg-black/10">
                <motion.div
                  initial={{
                    width: 0,
                  }}
                  animate={{
                    width: `${completionPercentage}%`,
                  }}
                  transition={{
                    duration: 0.8,
                    ease: "easeOut",
                  }}
                  className="h-full rounded-full bg-black"
                />
              </div>

              <p className="mt-2 text-right text-[10px] font-black text-black/50">
                {completionPercentage}%
                complete
              </p>
            </div>
          </div>
        </motion.section>


        {/* Error */}

        <AnimatePresence>
          {error && (
            <motion.section
              initial={{
                opacity: 0,
                height: 0,
                y: -8,
              }}
              animate={{
                opacity: 1,
                height: "auto",
                y: 0,
              }}
              exit={{
                opacity: 0,
                height: 0,
              }}
              className="mt-4 overflow-hidden rounded-2xl border border-red-400/20 bg-red-400/5 p-4"
            >
              <p className="text-xs font-bold leading-5 text-red-300">
                {error}
              </p>
            </motion.section>
          )}
        </AnimatePresence>


        {/* Timer */}

        <motion.section
          variants={itemVariants}
          className="mt-5 overflow-hidden rounded-3xl border border-white/10 bg-[#07111f] p-5"
        >
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-gray-600">
                Workout Timer
              </p>

              <p className="mt-1 text-xs text-gray-500">
                {workoutCompleted
                  ? "Workout completed"
                  : workoutPausedAt
                    ? "Workout paused"
                    : workoutStartedAt
                      ? "Workout in progress"
                      : "Ready to start"}
              </p>
            </div>

            <div className="text-right">
              <motion.p
                key={
                  formattedWorkoutDuration
                }
                initial={{
                  opacity: 0.6,
                }}
                animate={{
                  opacity: 1,
                }}
                className="font-mono text-3xl font-black tracking-tight"
              >
                {
                  formattedWorkoutDuration
                }
              </motion.p>

              {totalPausedSeconds >
                0 && (
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
            Steps and calories are estimated from
            active workout time.
          </p>

          {!workoutCompleted && (
            <div className="mt-4">
              {!workoutStartedAt ? (
                <motion.button
                  type="button"
                  disabled={
                    Boolean(
                      timerAction,
                    )
                  }
                  onClick={() =>
                    handleTimerAction(
                      "start",
                    )
                  }
                  whileTap={{
                    scale: 0.98,
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-lime-400 px-4 py-4 text-sm font-black text-black transition hover:bg-lime-300 disabled:opacity-50"
                >
                  <Play
                    size={17}
                    fill="currentColor"
                  />

                  {timerAction ===
                  "start"
                    ? "STARTING..."
                    : "START WORKOUT"}
                </motion.button>
              ) : workoutPausedAt ? (
                <motion.button
                  type="button"
                  disabled={
                    Boolean(
                      timerAction,
                    )
                  }
                  onClick={() =>
                    handleTimerAction(
                      "resume",
                    )
                  }
                  whileTap={{
                    scale: 0.98,
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-lime-400 px-4 py-4 text-sm font-black text-black transition hover:bg-lime-300 disabled:opacity-50"
                >
                  <Play
                    size={17}
                    fill="currentColor"
                  />

                  {timerAction ===
                  "resume"
                    ? "RESUMING..."
                    : "RESUME WORKOUT"}
                </motion.button>
              ) : (
                <motion.button
                  type="button"
                  disabled={
                    Boolean(
                      timerAction,
                    )
                  }
                  onClick={() =>
                    handleTimerAction(
                      "pause",
                    )
                  }
                  whileTap={{
                    scale: 0.98,
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-4 py-4 text-sm font-black text-black transition hover:bg-gray-200 disabled:opacity-50"
                >
                  <Pause
                    size={17}
                    fill="currentColor"
                  />

                  {timerAction ===
                  "pause"
                    ? "PAUSING..."
                    : "PAUSE WORKOUT"}
                </motion.button>
              )}
            </div>
          )}

          {!workoutCompleted &&
            workoutStartedAt && (
              <button
                type="button"
                disabled={
                  Boolean(
                    timerAction,
                  ) ||
                  resettingWorkout
                }
                onClick={() =>
                  setShowResetConfirm(
                    true,
                  )
                }
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-red-400/20 bg-red-400/5 px-4 py-3 text-xs font-black text-red-300 transition hover:bg-red-400/10 disabled:opacity-50"
              >
                <RotateCcw
                  size={14}
                />

                {resettingWorkout
                  ? "RESETTING..."
                  : "RESET WORKOUT"}
              </button>
            )}
        </motion.section>


        {/* Reset modal */}

        <AnimatePresence>
          {showResetConfirm && (
            <motion.div
              initial={{
                opacity: 0,
              }}
              animate={{
                opacity: 1,
              }}
              exit={{
                opacity: 0,
              }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-5 backdrop-blur-sm"
            >
              <motion.div
                initial={{
                  opacity: 0,
                  y: 20,
                  scale: 0.95,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                  scale: 1,
                }}
                exit={{
                  opacity: 0,
                  y: 20,
                  scale: 0.95,
                }}
                className="w-full max-w-sm rounded-3xl border border-white/10 bg-[#07111f] p-6 shadow-2xl"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-400/10 text-red-300">
                  <RotateCcw
                    size={21}
                  />
                </div>

                <h3 className="mt-5 text-lg font-black">
                  Reset this workout?
                </h3>

                <p className="mt-2 text-sm leading-6 text-gray-500">
                  This will clear the current
                  timer and completed sets.
                  You can start the workout again
                  from 00:00.
                </p>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      setShowResetConfirm(
                        false,
                      )
                    }
                    className="rounded-2xl bg-white/10 px-4 py-3 text-sm font-black text-white transition hover:bg-white/15"
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
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>


        {/* Exercises */}

        <motion.section
          variants={itemVariants}
          className="mt-6"
        >
          <div className="mb-4 flex items-end justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-gray-600">
                Today's Training
              </p>

              <h2 className="mt-1 text-xl font-black">
                Complete Your Exercises
              </h2>
            </div>

            <div className="rounded-full bg-white/5 px-3 py-1.5 text-[10px] font-black text-gray-500">
              {completedSetCount}/
              {totalSets}
            </div>
          </div>

          <div className="space-y-5">
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

                const exerciseSetCount =
                  Array.from({
                    length: sets,
                  }).filter(
                    (
                      _,
                      setIndex,
                    ) =>
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
                  <motion.article
                    key={
                      programExercise?._id ||
                      exerciseId ||
                      index
                    }
                    variants={itemVariants}
                    whileHover={{
                      y: -2,
                    }}
                    className={`overflow-hidden rounded-3xl border bg-[#07111f] transition ${
                      exerciseCompleted
                        ? "border-lime-400/25"
                        : "border-white/10"
                    }`}
                  >
                    {/* Exercise image */}

                    <div className="relative w-full overflow-hidden bg-black">
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
                            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-yellow-400 text-black">
                              <Play
                                size={21}
                                fill="currentColor"
                              />
                            </div>

                            <p className="mt-3 text-xs font-semibold text-gray-500">
                              Exercise demonstration
                            </p>
                          </div>
                        </div>
                      )}

                      <div className="absolute left-4 top-4 rounded-full bg-black/80 px-3 py-1.5 text-[9px] font-black text-yellow-400 backdrop-blur-md">
                        EXERCISE{" "}
                        {index + 1}
                      </div>

                      {exerciseCompleted && (
                        <div className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-lime-400 text-black shadow-lg">
                          <Check
                            size={17}
                          />
                        </div>
                      )}
                    </div>


                    <div className="p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <h3 className="text-xl font-black">
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

                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/5 text-gray-500">
                          <Dumbbell
                            size={18}
                          />
                        </div>
                      </div>


                      {/* Target */}

                      <div className="mt-4 grid grid-cols-2 gap-2">
                        <InfoBox
                          label="Sets"
                          value={sets}
                        />

                        <InfoBox
                          label="Reps"
                          value={
                            reps ||
                            (
                              duration
                                ? `${duration} sec`
                                : "As assigned"
                            )
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
                              size={13}
                            />
                          }
                        />
                      </div>


                      {/* Exercise progress */}

                      <div
                        className={`mt-4 rounded-2xl p-4 ${
                          exerciseCompleted
                            ? "bg-lime-400/10"
                            : "bg-black"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-[9px] font-black uppercase tracking-wider text-gray-600">
                              Exercise Progress
                            </p>

                            <p className="mt-1 text-xs font-bold text-gray-400">
                              {
                                exerciseSetCount
                              }{" "}
                              / {sets} sets
                              completed
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

                        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/5">
                          <motion.div
                            initial={{
                              width: 0,
                            }}
                            animate={{
                              width: `${
                                sets > 0
                                  ? Math.round(
                                      (exerciseSetCount /
                                        sets) *
                                        100,
                                    )
                                  : 0
                              }%`,
                            }}
                            transition={{
                              duration: 0.5,
                            }}
                            className="h-full rounded-full bg-lime-400"
                          />
                        </div>
                      </div>


                      {/* Trainer notes */}

                      {programExercise?.notes && (
                        <div className="mt-4 rounded-2xl border border-white/5 bg-black p-4">
                          <div className="flex items-center gap-2">
                            <Target
                              size={14}
                              className="text-yellow-400"
                            />

                            <p className="text-[9px] font-black uppercase tracking-wider text-gray-600">
                              Trainer Instructions
                            </p>
                          </div>

                          <p className="mt-2 text-xs leading-5 text-gray-400">
                            {
                              programExercise.notes
                            }
                          </p>
                        </div>
                      )}


                      {/* Sets */}

                      <div className="mt-6">
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
                                <motion.div
                                  key={
                                    key
                                  }
                                  layout
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

                                    <motion.div
                                      animate={{
                                        scale:
                                          isCompleted
                                            ? [
                                                0.8,
                                                1.1,
                                                1,
                                              ]
                                            : 1,
                                      }}
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
                                    </motion.div>
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
                                        className="w-full rounded-xl border border-white/10 bg-black px-3 py-3 text-sm font-bold text-white outline-none transition focus:border-lime-400"
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
                                        className="w-full rounded-xl border border-white/10 bg-black px-3 py-3 text-sm font-bold text-white outline-none transition focus:border-lime-400"
                                        placeholder={
                                          targetWeight ||
                                          "e.g. 20 kg"
                                        }
                                      />
                                    </label>
                                  </div>


                                  {/* Complete set */}

                                  <motion.button
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
                                    whileTap={{
                                      scale: 0.98,
                                    }}
                                    className={`mt-3 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-xs font-black transition ${
                                      isCompleted
                                        ? "bg-white/10 text-white"
                                        : "bg-lime-400 text-black hover:bg-lime-300"
                                    } disabled:cursor-not-allowed disabled:opacity-50`}
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
                                  </motion.button>
                                </motion.div>
                              )
                            },
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.article>
                )
              },
            )}
          </div>
        </motion.section>


        {/* Calories */}

        {workoutCompleted && (
          <motion.section
            variants={itemVariants}
            initial={{
              opacity: 0,
              y: 15,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            className="mt-6 overflow-hidden rounded-3xl bg-yellow-400 p-5 text-black"
          >
            <div className="flex items-center gap-4">
              <motion.div
                animate={{
                  scale: [
                    1,
                    1.08,
                    1,
                  ],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                }}
                className="flex h-12 w-12 items-center justify-center rounded-full bg-black text-yellow-400"
              >
                <Flame
                  size={24}
                  fill="currentColor"
                />
              </motion.div>

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
          </motion.section>
        )}


        {/* Complete workout */}

        {!workoutCompleted && (
          <motion.section
            variants={itemVariants}
            className="mt-6"
          >
            <motion.button
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
              whileTap={{
                scale: 0.98,
              }}
              className={`flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-4 text-sm font-black transition ${
                completedSetCount >=
                totalSets
                  ? "bg-lime-400 text-black hover:bg-lime-300"
                  : "cursor-not-allowed bg-white/10 text-gray-600"
              } disabled:opacity-60`}
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
            </motion.button>

            {completedSetCount <
              totalSets && (
              <p className="mt-3 text-center text-[10px] font-bold text-gray-600">
                Complete all{" "}
                {totalSets} sets to
                finish this workout.
              </p>
            )}
          </motion.section>
        )}


        {/* Completed */}

        {workoutCompleted && (
          <motion.section
            variants={itemVariants}
            className="mt-6 overflow-hidden rounded-3xl border border-lime-400/20 bg-lime-400/5 p-6 text-center"
          >
            <motion.div
              initial={{
                scale: 0.7,
                opacity: 0,
              }}
              animate={{
                scale: 1,
                opacity: 1,
              }}
              transition={{
                type: "spring",
                stiffness: 220,
                damping: 14,
              }}
              className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-lime-400 text-black"
            >
              <Trophy
                size={29}
              />
            </motion.div>

            <p className="mt-4 text-xs font-black uppercase tracking-wider text-lime-400">
              Workout Completed
            </p>

            <h2 className="mt-1 text-2xl font-black">
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
              className="mt-5 w-full rounded-2xl bg-white px-5 py-4 text-sm font-black text-black transition hover:bg-gray-200"
            >
              BACK TO DASHBOARD
            </button>
          </motion.section>
        )}
      </main>
    </motion.div>
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
    <header className="sticky top-0 z-30 border-b border-white/10 bg-[#020617]/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-md items-center gap-4 px-5 py-4">
        <motion.button
          type="button"
          onClick={onBack}
          whileTap={{
            scale: 0.9,
          }}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 transition hover:bg-white/15"
          aria-label="Go back"
        >
          <ArrowLeft
            size={20}
          />
        </motion.button>

        <div className="min-w-0">
          <p className="truncate text-[10px] font-black uppercase tracking-[0.16em] text-lime-400">
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
| Tracking box
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

        <p className="truncate text-[8px] font-bold uppercase tracking-wider text-gray-600">
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
| Info box
|--------------------------------------------------------------------------
*/

function InfoBox({
  label,
  value,
  highlight = false,
  icon,
  light = false,
}) {
  return (
    <div
      className={
        light
          ? "rounded-2xl bg-black/10 p-3"
          : "rounded-2xl bg-black p-3"
      }
    >
      <p
        className={
          light
            ? "text-[9px] font-bold uppercase tracking-wider text-black/45"
            : "text-[10px] font-bold uppercase tracking-wider text-gray-600"
        }
      >
        {label}
      </p>

      <p
        className={`mt-1 flex items-center gap-1 text-sm font-black ${
          highlight
            ? light
              ? "text-black"
              : "text-yellow-400"
            : light
              ? "text-black"
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

  if (
    response.assignment
  ) {
    return response.assignment
  }

  if (
    response.programAssignment
  ) {
    return response.programAssignment
  }

  if (
    response.workout
  ) {
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
          response.workout
            .reminderEnabled ??
          true,

        reminderMinutesBefore:
          response.workout
            .reminderMinutesBefore ??
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
        value.workout
          .reminderEnabled ??
        true,

      reminderMinutesBefore:
        value.workout
          .reminderMinutesBefore ??
        5,

      durationSeconds:
        value.durationSeconds ??
        value.workout
          .durationSeconds ??
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
| Restore existing log
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
      log?.durationSeconds !==
        null &&
      log?.durationSeconds !==
        undefined
        ? Number(
            log.durationSeconds,
          )
        : null

    const assignmentDuration =
      assignment?.durationSeconds !==
        null &&
      assignment?.durationSeconds !==
        undefined
        ? Number(
            assignment.durationSeconds,
          )
        : null

    const fallbackDuration =
      fallbackDurationSeconds !==
        null &&
      fallbackDurationSeconds !==
        undefined &&
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
      persistedDuration ===
        null &&
      (
        assignmentDuration !==
          null ||
        fallbackDuration !==
          null
      )
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
  } catch (
    restoreError
  ) {
    if (
      restoreError?.response
        ?.status !== 404
    ) {
      console.warn(
        "Unable to restore workout log:",
        restoreError,
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
    normalizeDateKey(
      rawDate,
    ) ||
    normalizeDateKey(
      new Date(),
    )
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
      (
        assignment,
      ) => {
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
        second.createdAt ||
          0,
      ).getTime() -
      new Date(
        first.createdAt ||
          0,
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
    (
      exerciseLog,
    ) => {
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
| Workout timer state
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
    log?.startedAt ||
    null

  const pausedAt =
    log?.pausedAt ||
    null

  const pausedSeconds =
    Number(
      log?.totalPausedSeconds ||
        0,
    )

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


/*
|--------------------------------------------------------------------------
| Duration
|--------------------------------------------------------------------------
*/

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
    return `${String(
      hours,
    ).padStart(
      2,
      "0",
    )}:${String(
      minutes,
    ).padStart(
      2,
      "0",
    )}:${String(
      remainingSeconds,
    ).padStart(
      2,
      "0",
    )}`
  }

  return `${String(
    minutes,
  ).padStart(
    2,
    "0",
  )}:${String(
    remainingSeconds,
  ).padStart(
    2,
    "0",
  )}`
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
      Number(
        match[1],
      )

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
    ).padStart(
      2,
      "0",
    ),
    String(
      date.getDate(),
    ).padStart(
      2,
      "0",
    ),
  ].join("-")
}


export default Workout