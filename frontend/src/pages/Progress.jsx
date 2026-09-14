import { useEffect, useState } from "react"
import {
  ArrowLeft,
  CheckCircle2,
  Dumbbell,
  Flame,
  Scale,
  Target,
  TrendingDown,
  TrendingUp,
  Activity,
  Sparkles,
} from "lucide-react"
import {
  motion,
  AnimatePresence,
} from "framer-motion"
import { useNavigate } from "react-router-dom"

import WeightProgressChart from "../components/WeightProgressChart"
import {
  getMyPrograms,
  getMyWorkoutHistory,
} from "../api/api"
import {
  addWeightEntry,
  getProgressData,
} from "../utils/progressStorage"
import {
  getFitnessGoalLabel,
  getProfile,
} from "../utils/profileStorage"


function normalizeFitnessGoal(value) {
  const normalized = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[-\s]+/g, "_")

  if (
    normalized === "keep_fit" ||
    normalized === "keepfit" ||
    normalized === "maintain_fitness"
  ) {
    return "keep_fit"
  }

  if (
    normalized === "lose_weight" ||
    normalized === "weight_loss" ||
    normalized === "weightloss"
  ) {
    return "lose_weight"
  }

  if (
    normalized === "gain_weight" ||
    normalized === "weight_gain" ||
    normalized === "weightgain"
  ) {
    return "gain_weight"
  }

  if (
    normalized === "become_trainer" ||
    normalized === "training_to_become_a_trainer" ||
    normalized === "training_to_become_trainer" ||
    normalized === "trainer_training"
  ) {
    return "become_trainer"
  }

  return normalized
}


const pageVariants = {
  hidden: {
    opacity: 0,
  },

  visible: {
    opacity: 1,

    transition: {
      duration: 0.45,
      staggerChildren: 0.07,
    },
  },
}


const itemVariants = {
  hidden: {
    opacity: 0,
    y: 18,
  },

  visible: {
    opacity: 1,
    y: 0,

    transition: {
      duration: 0.4,
      ease: "easeOut",
    },
  },
}


function Progress() {
  const navigate = useNavigate()

  const [profile, setProfile] =
    useState(() =>
      getProfile(),
    )

  const [progress, setProgress] =
    useState(() =>
      getProgressData(),
    )

  const [statistics, setStatistics] =
    useState({
      currentStreak: 0,
      totalWorkouts: 0,
    })

  const [loading, setLoading] =
    useState(true)

  const [weightInput, setWeightInput] =
    useState(() =>
      String(
        getProgressData()
          ?.currentWeight ?? "",
      ),
    )

  const [saved, setSaved] =
    useState(false)

  const fitnessGoal =
    normalizeFitnessGoal(
      profile?.fitnessGoal ||
        profile?.goal,
    )

  const goalLabel =
    getFitnessGoalLabel(
      profile?.fitnessGoal ||
        profile?.goal,
    )

  const weightDifference =
    Number(
      progress?.currentWeight || 0,
    ) -
    Number(
      progress?.startingWeight || 0,
    )

  const remainingWeight =
    Math.abs(
      Number(
        progress?.currentWeight || 0,
      ) -
        Number(
          progress?.targetWeight || 0,
        ),
    )

  const progressPercentage =
    calculateProgressPercentage(
      progress,
      fitnessGoal,
    )


  useEffect(() => {
    let cancelled = false

    const loadWorkoutStatistics =
      async () => {
        try {
          setLoading(true)

          const [
            historyResponse,
            programsResponse,
          ] = await Promise.all([
            getMyWorkoutHistory(),
            getMyPrograms(),
          ])

          const history =
            Array.isArray(
              historyResponse?.history,
            )
              ? historyResponse.history
              : []

          const assignments =
            Array.isArray(
              programsResponse?.assignments,
            )
              ? programsResponse.assignments
              : []

          const currentWeekDates =
            getCurrentWeekDateKeys()

          const scheduledDates =
            new Set(
              assignments
                .map(
                  (
                    assignment,
                  ) =>
                    toLocalDateKey(
                      assignment?.workoutDate,
                    ),
                )
                .filter(
                  (date) =>
                    date &&
                    currentWeekDates.has(
                      date,
                    ),
                ),
            )

          const completedScheduledWorkouts =
            history.filter(
              (workout) =>
                workout?.completed ===
                  true &&
                scheduledDates.has(
                  toLocalDateKey(
                    workout?.date,
                  ),
                ),
            )

          if (!cancelled) {
            setStatistics({
              currentStreak:
                calculateCurrentStreak(
                  completedScheduledWorkouts,
                ),

              totalWorkouts:
                completedScheduledWorkouts.length,
            })
          }
        } catch (error) {
          console.error(
            "Unable to load workout statistics:",
            error,
          )

          if (!cancelled) {
            setStatistics({
              currentStreak: 0,
              totalWorkouts: 0,
            })
          }
        } finally {
          if (!cancelled) {
            setLoading(false)
          }
        }
      }

    loadWorkoutStatistics()

    return () => {
      cancelled = true
    }
  }, [])


  const handleWeightUpdate =
    () => {
      const numericWeight =
        Number(weightInput)

      if (
        !Number.isFinite(
          numericWeight,
        ) ||
        numericWeight <= 0
      ) {
        return
      }

      const updatedProgress =
        addWeightEntry(
          numericWeight,
        )

      setProgress(
        updatedProgress,
      )

      const updatedProfile = {
        ...profile,

        weight:
          updatedProgress.currentWeight,
      }

      localStorage.setItem(
        "cgf_member_profile",
        JSON.stringify(
          updatedProfile,
        ),
      )

      setProfile(
        updatedProfile,
      )

      setWeightInput(
        String(
          updatedProgress.currentWeight,
        ),
      )

      setSaved(true)

      window.setTimeout(() => {
        setSaved(false)
      }, 2500)
    }


  return (
    <motion.div
      variants={pageVariants}
      initial="hidden"
      animate="visible"
      className="min-h-screen bg-[#020617] pb-28 text-white"
    >
      {/* Header */}

      <motion.header
        variants={itemVariants}
        className="border-b border-white/10 bg-[#07111f]/95 backdrop-blur-xl"
      >
        <div className="mx-auto flex max-w-md items-center gap-4 px-5 py-4">
          <motion.button
            type="button"
            onClick={() =>
              navigate("/dashboard")
            }
            whileHover={{
              scale: 1.05,
            }}
            whileTap={{
              scale: 0.9,
            }}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 transition hover:bg-white/15"
            aria-label="Go to dashboard"
          >
            <ArrowLeft
              size={19}
            />
          </motion.button>

          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-lime-400">
              My Fitness
            </p>

            <h1 className="text-xl font-black">
              Progress
            </h1>
          </div>
        </div>
      </motion.header>


      <main className="mx-auto w-full max-w-md px-5 py-6">

        {/* Goal */}

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
            className="absolute -right-16 -top-16 h-36 w-36 rounded-full bg-white/20 blur-3xl"
          />

          <div className="relative">
            <div className="flex items-start justify-between">
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-black/50">
                  Current Goal
                </p>

                <h2 className="mt-1 text-2xl font-black">
                  {goalLabel}
                </h2>

                <p className="mt-2 text-xs leading-5 text-black/60">
                  Your progress is based on the goal selected in your member profile.
                </p>
              </div>

              <motion.div
                animate={{
                  rotate: [0, 4, -4, 0],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-black text-yellow-400"
              >
                <Target
                  size={22}
                />
              </motion.div>
            </div>


            <div className="mt-5">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-wider text-black/50">
                    Current
                  </p>

                  <motion.p
                    key={
                      progress.currentWeight
                    }
                    initial={{
                      opacity: 0,
                      scale: 0.8,
                    }}
                    animate={{
                      opacity: 1,
                      scale: 1,
                    }}
                    className="mt-1 text-3xl font-black"
                  >
                    {progress.currentWeight}

                    <span className="ml-1 text-sm">
                      kg
                    </span>
                  </motion.p>
                </div>

                <div className="text-right">
                  <p className="text-[10px] font-black uppercase tracking-wider text-black/50">
                    {fitnessGoal ===
                    "keep_fit"
                      ? "Goal"
                      : "Target"}
                  </p>

                  <p className="mt-1 text-xl font-black">
                    {fitnessGoal ===
                    "keep_fit"
                      ? "Maintain"
                      : `${progress.targetWeight} kg`}
                  </p>
                </div>
              </div>


              <div className="mt-4 h-2 overflow-hidden rounded-full bg-black/10">
                <motion.div
                  initial={{
                    width: 0,
                  }}
                  animate={{
                    width: `${progressPercentage}%`,
                  }}
                  transition={{
                    duration: 0.9,
                    ease: "easeOut",
                  }}
                  className="h-full rounded-full bg-black"
                />
              </div>


              <div className="mt-2 flex justify-between gap-3 text-[10px] font-black text-black/50">
                <span>
                  {progressPercentage}%
                  {" "}
                  complete
                </span>

                <span className="text-right">
                  {fitnessGoal ===
                  "keep_fit"
                    ? "Fitness maintained"
                    : `${remainingWeight} kg remaining`}
                </span>
              </div>
            </div>
          </div>
        </motion.section>


        {/* Stats */}

        <motion.section
          variants={itemVariants}
          className="mt-5 grid grid-cols-2 gap-3"
        >
          <ProgressStat
            icon={Scale}
            label="Current Weight"
            value={`${progress.currentWeight} kg`}
          />

          <ProgressStat
            icon={
              weightDifference <= 0
                ? TrendingDown
                : TrendingUp
            }
            label="Weight Change"
            value={`${weightDifference > 0 ? "+" : ""}${weightDifference.toFixed(1)} kg`}
          />

          <ProgressStat
            icon={Flame}
            label="Workout Streak"
            value={`${statistics.currentStreak} days`}
          />

          <ProgressStat
            icon={Dumbbell}
            label="Workouts"
            value={statistics.totalWorkouts}
          />
        </motion.section>


        {/* Update Weight */}

        <motion.section
          variants={itemVariants}
          className="mt-5 rounded-3xl border border-white/10 bg-[#07111f] p-5"
        >
          <div className="flex items-center gap-3">
            <motion.div
              whileHover={{
                rotate: 8,
                scale: 1.05,
              }}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-lime-400 text-black"
            >
              <Scale
                size={18}
              />
            </motion.div>

            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-gray-600">
                Update Weight
              </p>

              <h2 className="mt-1 text-lg font-black">
                Record today's weight
              </h2>
            </div>
          </div>


          <div className="mt-5 flex gap-2">
            <div className="relative flex-1">
              <input
                type="number"
                min="1"
                step="0.1"
                value={
                  weightInput
                }
                onChange={(
                  event,
                ) =>
                  setWeightInput(
                    event.target.value,
                  )
                }
                className="w-full rounded-2xl border border-white/10 bg-black px-4 py-4 pr-12 text-sm font-bold text-white outline-none transition focus:border-lime-400"
                placeholder="Enter weight"
              />

              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-600">
                kg
              </span>
            </div>

            <motion.button
              type="button"
              onClick={
                handleWeightUpdate
              }
              whileHover={{
                y: -2,
              }}
              whileTap={{
                scale: 0.96,
              }}
              className="rounded-2xl bg-lime-400 px-5 py-4 text-xs font-black text-black transition hover:bg-lime-300"
            >
              SAVE
            </motion.button>
          </div>


          <AnimatePresence>
            {saved && (
              <motion.div
                initial={{
                  opacity: 0,
                  height: 0,
                  y: -5,
                }}
                animate={{
                  opacity: 1,
                  height: "auto",
                  y: 0,
                }}
                exit={{
                  opacity: 0,
                  height: 0,
                  y: -5,
                }}
                className="flex items-center gap-2 overflow-hidden pt-3 text-xs font-bold text-lime-400"
              >
                <CheckCircle2
                  size={15}
                />
                Weight updated successfully.
              </motion.div>
            )}
          </AnimatePresence>
        </motion.section>


        {/* Chart */}

        <motion.section
          variants={itemVariants}
          className="mt-5"
        >
          <WeightProgressChart
            data={
              progress.weightHistory
            }
            goal={
              progress.targetWeight
            }
          />
        </motion.section>


        {/* Encouragement */}

        <motion.section
          variants={itemVariants}
          className="mt-5 rounded-3xl border border-white/10 bg-[#07111f] p-5"
        >
          <div className="flex items-start gap-3">
            <motion.div
              animate={{
                y: [0, -3, 0],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-yellow-400 text-black"
            >
              <CheckCircle2
                size={18}
              />
            </motion.div>

            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-gray-600">
                Keep Going
              </p>

              <h2 className="mt-1 text-lg font-black">
                {getProgressMessage(
                  fitnessGoal,
                )}
              </h2>

              <p className="mt-2 text-xs leading-5 text-gray-500">
                Your trainer can use your progress information to adjust your program as your fitness level changes.
              </p>
            </div>
          </div>
        </motion.section>


        {/* Loading indicator */}

        <AnimatePresence>
          {loading && (
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
              className="mt-4 flex items-center justify-center gap-2 text-[10px] font-bold text-gray-700"
            >
              <Activity
                size={13}
                className="animate-pulse"
              />
              Updating workout statistics...
            </motion.div>
          )}
        </AnimatePresence>

      </main>


      <BottomNavigation />
    </motion.div>
  )
}


function ProgressStat({
  icon: Icon,
  label,
  value,
}) {
  return (
    <motion.div
      whileHover={{
        y: -4,
      }}
      whileTap={{
        scale: 0.98,
      }}
      className="rounded-3xl border border-white/10 bg-[#07111f] p-5 transition"
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-lime-400">
        <Icon
          size={18}
        />
      </div>

      <motion.p
        key={String(value)}
        initial={{
          opacity: 0,
          scale: 0.8,
        }}
        animate={{
          opacity: 1,
          scale: 1,
        }}
        className="mt-4 text-xl font-black"
      >
        {value}
      </motion.p>

      <p className="mt-1 text-xs text-gray-600">
        {label}
      </p>
    </motion.div>
  )
}


function BottomNavigation() {
  const navigate =
    useNavigate()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-white/10 bg-black/95 backdrop-blur-xl">
      <div className="mx-auto grid max-w-md grid-cols-3 px-5 py-3">

        <motion.button
          type="button"
          onClick={() =>
            navigate(
              "/dashboard",
            )
          }
          whileTap={{
            scale: 0.9,
          }}
          className="flex flex-col items-center gap-1 text-gray-600 transition hover:text-lime-400"
        >
          <Dumbbell
            size={19}
          />

          <span className="text-[10px] font-bold">
            Home
          </span>
        </motion.button>


        <motion.button
          type="button"
          onClick={() =>
            navigate(
              "/progress",
            )
          }
          whileTap={{
            scale: 0.9,
          }}
          className="flex flex-col items-center gap-1 text-yellow-400"
        >
          <TrendingUp
            size={19}
          />

          <span className="text-[10px] font-bold">
            Progress
          </span>
        </motion.button>


        <motion.button
          type="button"
          onClick={() =>
            navigate(
              "/profile",
            )
          }
          whileTap={{
            scale: 0.9,
          }}
          className="flex flex-col items-center gap-1 text-gray-600 transition hover:text-lime-400"
        >
          <Scale
            size={19}
          />

          <span className="text-[10px] font-bold">
            Profile
          </span>
        </motion.button>

      </div>
    </nav>
  )
}


function getCurrentWeekDateKeys() {
  const today =
    new Date()

  const day =
    today.getDay()

  const mondayOffset =
    day === 0
      ? -6
      : 1 - day

  const monday =
    new Date(today)

  monday.setDate(
    today.getDate() +
      mondayOffset,
  )

  monday.setHours(
    0,
    0,
    0,
    0,
  )

  const dates =
    new Set()

  for (
    let index = 0;
    index < 7;
    index += 1
  ) {
    const date =
      new Date(monday)

    date.setDate(
      monday.getDate() +
        index,
    )

    dates.add(
      toLocalDateKey(
        date,
      ),
    )
  }

  return dates
}


function toLocalDateKey(
  value,
) {
  if (!value) {
    return ""
  }

  if (
    typeof value ===
    "string"
  ) {
    const match =
      value.match(
        /^(\d{4}-\d{2}-\d{2})/,
      )

    if (match) {
      return match[1]
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

  return `${date.getFullYear()}-${String(
    date.getMonth() + 1,
  ).padStart(2, "0")}-${String(
    date.getDate(),
  ).padStart(2, "0")}`
}


function calculateCurrentStreak(
  workouts,
) {
  if (
    !Array.isArray(
      workouts,
    ) ||
    workouts.length === 0
  ) {
    return 0
  }

  const dates = [
    ...new Set(
      workouts
        .filter(
          (workout) =>
            workout?.completed,
        )
        .map(
          (workout) =>
            toLocalDateKey(
              workout?.date,
            ),
        )
        .filter(Boolean),
    ),
  ].sort((a, b) =>
    b.localeCompare(a),
  )

  if (
    dates.length === 0
  ) {
    return 0
  }

  let streak = 1

  let previousDate =
    new Date(
      `${dates[0]}T00:00:00`,
    )

  for (
    let index = 1;
    index < dates.length;
    index += 1
  ) {
    const currentDate =
      new Date(
        `${dates[index]}T00:00:00`,
      )

    const difference =
      Math.round(
        (previousDate -
          currentDate) /
          86400000,
      )

    if (
      difference !== 1
    ) {
      break
    }

    streak += 1
    previousDate =
      currentDate
  }

  return streak
}


function calculateProgressPercentage(
  progress,
  fitnessGoal,
) {
  const normalizedGoal =
    normalizeFitnessGoal(
      fitnessGoal,
    )

  const starting =
    Number(
      progress?.startingWeight,
    )

  const current =
    Number(
      progress?.currentWeight,
    )

  const target =
    Number(
      progress?.targetWeight,
    )

  if (
    !Number.isFinite(
      starting,
    ) ||
    !Number.isFinite(
      current,
    ) ||
    !Number.isFinite(
      target,
    )
  ) {
    return 0
  }

  if (
    normalizedGoal ===
    "keep_fit"
  ) {
    return 100
  }

  if (
    normalizedGoal ===
    "become_trainer"
  ) {
    if (
      starting <= 0
    ) {
      return 0
    }

    return Math.min(
      100,
      Math.max(
        0,
        Math.round(
          (current /
            starting) *
            100,
        ),
      ),
    )
  }

  if (
    starting === target
  ) {
    return 100
  }

  const totalDistance =
    Math.abs(
      starting -
        target,
    )

  if (
    totalDistance ===
    0
  ) {
    return 100
  }

  const completedDistance =
    normalizedGoal ===
    "gain_weight"
      ? current -
        starting
      : starting -
        current

  const percentage =
    (completedDistance /
      totalDistance) *
    100

  return Math.min(
    100,
    Math.max(
      0,
      Math.round(
        percentage,
      ),
    ),
  )
}


function getProgressMessage(
  fitnessGoal,
) {
  const normalizedGoal =
    normalizeFitnessGoal(
      fitnessGoal,
    )

  const messages = {
    lose_weight:
      "Stay focused on your goal.",

    keep_fit:
      "Keep maintaining your fitness.",

    gain_weight:
      "Keep building strength and healthy weight.",

    become_trainer:
      "Keep developing your training skills.",
  }

  return (
    messages[
      normalizedGoal
    ] ||
    messages.keep_fit
  )
}


export default Progress