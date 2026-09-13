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
} from "lucide-react"
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

  useEffect(() => {
    let cancelled = false

    const loadWorkoutStatistics = async () => {
      try {
        const [historyResponse, programsResponse] =
          await Promise.all([
            getMyWorkoutHistory(),
            getMyPrograms(),
          ])

        const history =
          Array.isArray(historyResponse?.history)
            ? historyResponse.history
            : []

        const assignments =
          Array.isArray(programsResponse?.assignments)
            ? programsResponse.assignments
            : []

        const currentWeekDates =
          getCurrentWeekDateKeys()

        const scheduledDates = new Set(
          assignments
            .map((assignment) =>
              toLocalDateKey(
                assignment?.workoutDate,
              ),
            )
            .filter(
              (date) =>
                date &&
                currentWeekDates.has(date),
            ),
        )

        const completedScheduledWorkouts =
          history.filter(
            (workout) =>
              workout?.completed === true &&
              scheduledDates.has(
                toLocalDateKey(workout?.date),
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
      }
    }

    loadWorkoutStatistics()

    return () => {
      cancelled = true
    }
  }, [])

  const [weightInput, setWeightInput] =
    useState(
      String(
        progress.currentWeight,
      ),
    )

  const fitnessGoal =
    normalizeFitnessGoal(
      profile.fitnessGoal,
    )

  const goalLabel =
    getFitnessGoalLabel(
      profile.fitnessGoal,
    )

  const weightDifference =
    progress.currentWeight -
    progress.startingWeight

  const remainingWeight =
    Math.abs(
      progress.currentWeight -
        progress.targetWeight,
    )

  const progressPercentage =
    calculateProgressPercentage(
      progress,
      fitnessGoal,
    )

  const handleWeightUpdate = () => {
    const updatedProgress =
      addWeightEntry(
        weightInput,
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
  }

  return (
    <div className="min-h-screen bg-black pb-28 text-white">
      <header className="border-b border-white/10">
        <div className="mx-auto flex max-w-md items-center gap-4 px-5 py-4">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10"
            aria-label="Go back"
          >
            <ArrowLeft size={19} />
          </button>

          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-gray-600">
              My Fitness
            </p>

            <h1 className="text-xl font-black">
              Progress
            </h1>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-md px-5 py-6">
        <section className="rounded-3xl bg-yellow-400 p-5 text-black">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-black/60">
                Current Goal
              </p>

              <h2 className="mt-1 text-2xl font-black">
                {goalLabel}
              </h2>

              <p className="mt-2 text-xs leading-5 text-black/60">
                Your progress is based on the goal selected in your member profile.
              </p>
            </div>

            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-black text-yellow-400">
              <Target size={22} />
            </div>
          </div>

          <div className="mt-5">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-black/50">
                  Current
                </p>

                <p className="mt-1 text-3xl font-black">
                  {progress.currentWeight}
                  <span className="ml-1 text-sm">
                    kg
                  </span>
                </p>
              </div>

              <div className="text-right">
                <p className="text-[10px] font-bold uppercase tracking-wider text-black/50">
                  {fitnessGoal === "keep_fit"
                    ? "Goal"
                    : "Target"}
                </p>

                <p className="mt-1 text-xl font-black">
                  {fitnessGoal === "keep_fit"
                    ? "Maintain"
                    : `${progress.targetWeight} kg`}
                </p>
              </div>
            </div>

            <div className="mt-4 h-2 overflow-hidden rounded-full bg-black/10">
              <div
                className="h-full rounded-full bg-black transition-all duration-500"
                style={{
                  width: `${progressPercentage}%`,
                }}
              />
            </div>

            <div className="mt-2 flex justify-between text-[10px] font-bold text-black/50">
              <span>
                {progressPercentage}% complete
              </span>

              <span>
                {fitnessGoal === "keep_fit"
                  ? "Fitness maintained"
                  : `${remainingWeight} kg remaining`}
              </span>
            </div>
          </div>
        </section>

        <section className="mt-5 grid grid-cols-2 gap-3">
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
        </section>

        <section className="mt-5 rounded-3xl border border-white/10 bg-white/5 p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-lime-400 text-black">
              <Scale size={18} />
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-gray-600">
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
                value={weightInput}
                onChange={(event) =>
                  setWeightInput(
                    event.target.value,
                  )
                }
                className="w-full rounded-2xl border border-white/10 bg-black px-4 py-4 pr-12 text-sm font-bold text-white outline-none focus:border-lime-400"
                placeholder="Enter weight"
              />

              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-600">
                kg
              </span>
            </div>

            <button
              type="button"
              onClick={
                handleWeightUpdate
              }
              className="rounded-2xl bg-lime-400 px-5 py-4 text-xs font-black text-black"
            >
              SAVE
            </button>
          </div>
        </section>

        <section className="mt-5">
          <WeightProgressChart
            data={
              progress.weightHistory
            }
            goal={
              progress.targetWeight
            }
          />
        </section>

        <section className="mt-5 rounded-3xl border border-white/10 bg-white/5 p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-yellow-400 text-black">
              <CheckCircle2 size={18} />
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-gray-600">
                Keep going
              </p>

              <h2 className="mt-1 text-lg font-black">
                {getProgressMessage(
                  fitnessGoal,
                )}
              </h2>

              <p className="mt-2 text-xs leading-5 text-gray-500">
                Your trainer can use your progress information to adjust
                your program as your fitness level changes.
              </p>
            </div>
          </div>
        </section>
      </main>

      <BottomNavigation />
    </div>
  )
}

function ProgressStat({
  icon: Icon,
  label,
  value,
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-lime-400">
        <Icon size={18} />
      </div>

      <p className="mt-4 text-xl font-black">
        {value}
      </p>

      <p className="mt-1 text-xs text-gray-600">
        {label}
      </p>
    </div>
  )
}

function BottomNavigation() {
  const navigate = useNavigate()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-white/10 bg-black/95 backdrop-blur-xl">
      <div className="mx-auto grid max-w-md grid-cols-3 px-5 py-3">
        <button
          type="button"
          onClick={() => navigate("/")}
          className="flex flex-col items-center gap-1 text-gray-600"
        >
          <Dumbbell size={19} />

          <span className="text-[10px] font-bold">
            Home
          </span>
        </button>

        <button
          type="button"
          onClick={() =>
            navigate("/progress")
          }
          className="flex flex-col items-center gap-1 text-yellow-400"
        >
          <TrendingUp size={19} />

          <span className="text-[10px] font-bold">
            Progress
          </span>
        </button>

        <button
          type="button"
          onClick={() =>
            navigate("/profile")
          }
          className="flex flex-col items-center gap-1 text-gray-600"
        >
          <Scale size={19} />

          <span className="text-[10px] font-bold">
            Profile
          </span>
        </button>
      </div>
    </nav>
  )
}

function getCurrentWeekDateKeys() {
  const today = new Date()
  const day = today.getDay()
  const mondayOffset =
    day === 0 ? -6 : 1 - day

  const monday = new Date(today)
  monday.setDate(
    today.getDate() + mondayOffset,
  )
  monday.setHours(0, 0, 0, 0)

  const dates = new Set()

  for (let index = 0; index < 7; index += 1) {
    const date = new Date(monday)
    date.setDate(
      monday.getDate() + index,
    )
    dates.add(toLocalDateKey(date))
  }

  return dates
}

function toLocalDateKey(value) {
  if (!value) return ""

  if (typeof value === "string") {
    const match = value.match(
      /^(\d{4}-\d{2}-\d{2})/,
    )

    if (match) return match[1]
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return ""
  }

  return `${date.getFullYear()}-${String(
    date.getMonth() + 1,
  ).padStart(2, "0")}-${String(
    date.getDate(),
  ).padStart(2, "0")}`
}

function calculateCurrentStreak(workouts) {
  if (!Array.isArray(workouts) || workouts.length === 0) {
    return 0
  }

  const dates = [
    ...new Set(
      workouts
        .filter((workout) => workout?.completed)
        .map((workout) => toLocalDateKey(workout?.date))
        .filter(Boolean),
    ),
  ].sort((a, b) => b.localeCompare(a))

  if (dates.length === 0) {
    return 0
  }

  let streak = 1
  let previousDate = new Date(
    `${dates[0]}T00:00:00`,
  )

  for (let index = 1; index < dates.length; index += 1) {
    const currentDate = new Date(
      `${dates[index]}T00:00:00`,
    )

    const difference = Math.round(
      (previousDate - currentDate) / 86400000,
    )

    if (difference !== 1) {
      break
    }

    streak += 1
    previousDate = currentDate
  }

  return streak
}

function startOfDay(date) {
  const result = new Date(date)
  result.setHours(0, 0, 0, 0)
  return result
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
    Number(progress.startingWeight)

  const current =
    Number(progress.currentWeight)

  const target =
    Number(progress.targetWeight)

  if (
    !Number.isFinite(starting) ||
    !Number.isFinite(current) ||
    !Number.isFinite(target)
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

  if (starting === target) {
    return 100
  }

  const totalDistance =
    Math.abs(
      starting - target,
    )

  const completedDistance =
    fitnessGoal ===
    "gain_weight"
      ? current - starting
      : starting - current

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
    messages[normalizedGoal] ||
    messages.keep_fit
  )
}

export default Progress