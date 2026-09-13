import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react"

import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Dumbbell,
  Flame,
  RefreshCw,
} from "lucide-react"

import {
  useNavigate,
} from "react-router-dom"

import {
  getMyWorkoutHistory,
} from "../api/api"

function WorkoutHistory() {
  const navigate = useNavigate()

  const [history, setHistory] =
    useState([])

  const [loading, setLoading] =
    useState(true)

  const [error, setError] =
    useState("")

  const loadHistory =
    useCallback(
      async () => {
        try {
          setLoading(true)
          setError("")

          const response =
            await getMyWorkoutHistory()

          if (
            response?.success &&
            Array.isArray(
              response.history,
            )
          ) {
            setHistory(
              response.history,
            )
          } else {
            setHistory([])
          }
        } catch (err) {
          console.error(
            "Load workout history error:",
            err,
          )

          setError(
            err?.response?.data
              ?.message ||
              "Unable to load workout history.",
          )

          setHistory([])
        } finally {
          setLoading(false)
        }
      },
      [],
    )

  useEffect(() => {
    loadHistory()
  }, [loadHistory])

  const statistics =
    useMemo(
      () =>
        calculateStatistics(
          history,
        ),
      [history],
    )

  return (
    <div className="min-h-screen bg-black pb-28 text-white">
      <header className="border-b border-white/10">
        <div className="mx-auto flex max-w-md items-center gap-4 px-5 py-4">
          <button
            type="button"
            onClick={() =>
              navigate("/")
            }
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10"
            aria-label="Go back"
          >
            <ArrowLeft
              size={19}
            />
          </button>

          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-600">
              My Activity
            </p>

            <h1 className="text-xl font-black">
              Workout History
            </h1>
          </div>

          <button
            type="button"
            onClick={loadHistory}
            disabled={loading}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-gray-300 transition hover:bg-white/15 disabled:opacity-50"
            aria-label="Refresh workout history"
          >
            <RefreshCw
              size={17}
              className={
                loading
                  ? "animate-spin"
                  : ""
              }
            />
          </button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-md px-5 py-6">
        <section className="grid grid-cols-2 gap-3">
          <StatCard
            icon={Dumbbell}
            label="Workouts"
            value={
              statistics.totalWorkouts
            }
          />

          <StatCard
            icon={Flame}
            label="Current Streak"
            value={`${statistics.currentStreak} days`}
          />

          <StatCard
            icon={CheckCircle2}
            label="Sets Completed"
            value={
              statistics.totalSets
            }
          />

          <StatCard
            icon={Clock3}
            label="Training Time"
            value={formatTotalDuration(
              statistics.totalDurationSeconds,
            )}
          />
        </section>

        {error && (
          <div className="mt-5 rounded-2xl border border-red-500/20 bg-red-500/10 p-4">
            <p className="text-xs leading-5 text-red-300">
              {error}
            </p>

            <button
              type="button"
              onClick={loadHistory}
              className="mt-3 rounded-xl bg-white/10 px-4 py-2 text-xs font-bold text-white"
            >
              TRY AGAIN
            </button>
          </div>
        )}

        <section className="mt-7">
          <div className="mb-4">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-600">
              Training activity
            </p>

            <h2 className="mt-1 text-lg font-black">
              Completed Workouts
            </h2>
          </div>

          {loading ? (
            <LoadingHistory />
          ) : history.length === 0 ? (
            <EmptyHistory
              onStart={() =>
                navigate("/workout")
              }
            />
          ) : (
            <div className="space-y-3">
              {history.map(
                (session) => (
                  <WorkoutHistoryCard
                    key={session.id}
                    session={session}
                  />
                ),
              )}
            </div>
          )}
        </section>
      </main>

      <BottomNavigation />
    </div>
  )
}

function calculateStatistics(
  history,
) {
  const completedWorkouts =
    Array.isArray(history)
      ? history.filter(
          (item) =>
            item?.completed,
        )
      : []

  const totalWorkouts =
    completedWorkouts.length

  const totalSets =
    completedWorkouts.reduce(
      (total, workout) =>
        total +
        (
          Number(
            workout?.completedSets,
          ) || 0
        ),
      0,
    )

  const totalDurationSeconds =
    completedWorkouts.reduce(
      (total, workout) =>
        total +
        (
          Number(
            workout?.durationSeconds,
          ) || 0
        ),
      0,
    )

  const currentStreak =
    calculateCurrentStreak(
      completedWorkouts,
    )

  return {
    totalWorkouts,
    totalSets,
    totalDurationSeconds,
    currentStreak,
  }
}

function calculateCurrentStreak(
  history,
) {
  if (!history.length) {
    return 0
  }

  const uniqueDates =
    [
      ...new Set(
        history
          .map(
            (item) =>
              item?.date,
          )
          .filter(Boolean),
      ),
    ].sort(
      (a, b) =>
        new Date(
          `${b}T00:00:00`,
        ) -
        new Date(
          `${a}T00:00:00`,
        ),
    )

  if (!uniqueDates.length) {
    return 0
  }

  const today =
    startOfLocalDay(
      new Date(),
    )

  const latestDate =
    parseDateOnly(
      uniqueDates[0],
    )

  /*
  |--------------------------------------------------------------------------
  | Streak can only be current if the latest completed workout was
  | today or yesterday.
  |--------------------------------------------------------------------------
  */

  const daysFromToday =
    differenceInCalendarDays(
      today,
      latestDate,
    )

  if (
    daysFromToday > 1
  ) {
    return 0
  }

  let streak = 1

  for (
    let index = 1;
    index <
    uniqueDates.length;
    index += 1
  ) {
    const previous =
      parseDateOnly(
        uniqueDates[
          index - 1
        ],
      )

    const current =
      parseDateOnly(
        uniqueDates[index],
      )

    const difference =
      differenceInCalendarDays(
        previous,
        current,
      )

    if (difference !== 1) {
      break
    }

    streak += 1
  }

  return streak
}

function parseDateOnly(
  dateString,
) {
  const [
    year,
    month,
    day,
  ] = String(
    dateString,
  )
    .split("-")
    .map(Number)

  return new Date(
    year,
    month - 1,
    day,
  )
}

function startOfLocalDay(
  date,
) {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  )
}

function differenceInCalendarDays(
  first,
  second,
) {
  const firstUtc =
    Date.UTC(
      first.getFullYear(),
      first.getMonth(),
      first.getDate(),
    )

  const secondUtc =
    Date.UTC(
      second.getFullYear(),
      second.getMonth(),
      second.getDate(),
    )

  return Math.round(
    (
      firstUtc -
      secondUtc
    ) /
      86400000,
  )
}

function StatCard({
  icon: Icon,
  label,
  value,
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-400 text-black">
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

function WorkoutHistoryCard({
  session,
}) {
  return (
    <article className="rounded-3xl border border-white/10 bg-white/5 p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-lime-400 text-black">
            <CheckCircle2
              size={20}
            />
          </div>

          <div className="min-w-0">
            <h3 className="truncate text-base font-black">
              {session.programName ||
                "Workout"}
            </h3>

            <p className="mt-1 text-xs text-gray-600">
              {formatDate(
                session.date,
              )}
            </p>
          </div>
        </div>

        <span className="shrink-0 rounded-full bg-lime-400/10 px-3 py-1 text-[9px] font-black text-lime-400">
          COMPLETED
        </span>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-2">
        <HistoryValue
          label="Duration"
          value={formatDuration(
            session.durationSeconds,
          )}
        />

        <HistoryValue
          label="Sets"
          value={`${Number(
            session.completedSets,
          ) || 0}/${Number(
            session.totalSets,
          ) || 0}`}
        />

        <HistoryValue
          label="Progress"
          value={`${Number(
            session.completionPercentage,
          ) || 0}%`}
        />
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 text-xs text-gray-600">
        <div className="flex items-center gap-2">
          <CalendarDays
            size={14}
          />

          {session.day ||
            "Workout day"}
        </div>

        {Number(
          session.caloriesBurned,
        ) > 0 && (
          <div className="flex items-center gap-1">
            <Flame
              size={14}
            />

            {Number(
              session.caloriesBurned,
            )}{" "}
            kcal
          </div>
        )}
      </div>
    </article>
  )
}

function HistoryValue({
  label,
  value,
}) {
  return (
    <div className="rounded-2xl bg-black p-3">
      <p className="text-[9px] font-bold uppercase tracking-wider text-gray-600">
        {label}
      </p>

      <p className="mt-2 text-sm font-black text-white">
        {value}
      </p>
    </div>
  )
}

function LoadingHistory() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map(
        (item) => (
          <div
            key={item}
            className="animate-pulse rounded-3xl border border-white/10 bg-white/5 p-5"
          >
            <div className="flex gap-3">
              <div className="h-11 w-11 rounded-2xl bg-white/10" />

              <div className="flex-1">
                <div className="h-4 w-40 rounded bg-white/10" />

                <div className="mt-2 h-3 w-24 rounded bg-white/10" />
              </div>
            </div>

            <div className="mt-5 grid grid-cols-3 gap-2">
              <div className="h-16 rounded-2xl bg-white/10" />
              <div className="h-16 rounded-2xl bg-white/10" />
              <div className="h-16 rounded-2xl bg-white/10" />
            </div>
          </div>
        ),
      )}
    </div>
  )
}

function EmptyHistory({
  onStart,
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white/5 text-gray-600">
        <Dumbbell
          size={24}
        />
      </div>

      <h3 className="mt-5 text-lg font-black">
        No workouts yet
      </h3>

      <p className="mt-2 text-xs leading-5 text-gray-600">
        Complete your first GB
        workout and your training
        history will appear here.
      </p>

      <button
        type="button"
        onClick={onStart}
        className="mt-5 w-full rounded-2xl bg-yellow-400 px-5 py-4 text-sm font-black text-black transition hover:bg-yellow-300"
      >
        START TODAY'S WORKOUT
      </button>
    </div>
  )
}

function BottomNavigation() {
  const navigate =
    useNavigate()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-white/10 bg-black/95 backdrop-blur-xl">
      <div className="mx-auto grid max-w-md grid-cols-3 px-5 py-3">
        <button
          type="button"
          onClick={() =>
            navigate("/")
          }
          className="flex flex-col items-center gap-1 text-gray-600"
        >
          <CalendarDays
            size={19}
          />

          <span className="text-[10px] font-bold">
            Home
          </span>
        </button>

        <button
          type="button"
          onClick={() =>
            navigate(
              "/workout-history",
            )
          }
          className="flex flex-col items-center gap-1 text-yellow-400"
        >
          <Flame
            size={19}
          />

          <span className="text-[10px] font-bold">
            Progress
          </span>
        </button>

        <button
          type="button"
          onClick={() =>
            navigate(
              "/profile",
            )
          }
          className="flex flex-col items-center gap-1 text-gray-600"
        >
          <Dumbbell
            size={19}
          />

          <span className="text-[10px] font-bold">
            Profile
          </span>
        </button>
      </div>
    </nav>
  )
}

function formatDate(
  dateString,
) {
  if (!dateString) {
    return "Unknown date"
  }

  const date =
    parseDateOnly(
      dateString,
    )

  return date.toLocaleDateString(
    "en-US",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    },
  )
}

function formatDuration(
  totalSeconds,
) {
  const seconds =
    Number(totalSeconds) || 0

  const hours =
    Math.floor(
      seconds / 3600,
    )

  const minutes =
    Math.floor(
      (seconds % 3600) / 60,
    )

  const remainingSeconds =
    seconds % 60

  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }

  if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s`
  }

  return `${remainingSeconds}s`
}

function formatTotalDuration(
  totalSeconds,
) {
  const seconds =
    Number(totalSeconds) || 0

  const hours =
    Math.floor(
      seconds / 3600,
    )

  const minutes =
    Math.floor(
      (seconds % 3600) / 60,
    )

  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }

  return `${minutes}m`
}

export default WorkoutHistory