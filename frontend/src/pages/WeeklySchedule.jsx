import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Dumbbell,
  MapPin,
  Play,
  UserRound,
} from "lucide-react"

import {
  useEffect,
  useMemo,
  useState,
} from "react"

import {
  useNavigate,
} from "react-router-dom"

import {
  getMyPrograms,
} from "../api/api"

import api from "../api/api"

import {
  getWeeklySchedule,
} from "../utils/weeklySchedule"

function WeeklySchedule() {
  const navigate = useNavigate()

  const staticSchedule = useMemo(
    () => getWeeklySchedule(),
    [],
  )

  const [selectedDay, setSelectedDay] =
    useState(getCurrentDay())

  const [assignments, setAssignments] =
    useState([])

  const [workoutLogs, setWorkoutLogs] =
    useState({})

  const [loading, setLoading] =
    useState(true)

  const [error, setError] =
    useState("")

  const [notificationPermission, setNotificationPermission] =
    useState(
      typeof window !== "undefined" &&
        "Notification" in window
        ? Notification.permission
        : "unsupported",
    )

  /*
  |--------------------------------------------------------------------------
  | Load member assignments
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    let mounted = true

    const loadAssignments = async () => {
      try {
        setLoading(true)
        setError("")

        const response =
          await getMyPrograms()

        if (!mounted) {
          return
        }

        const assignmentList =
          Array.isArray(
            response?.assignments,
          )
            ? response.assignments
            : []

        setAssignments(
          assignmentList,
        )

        /*
        |--------------------------------------------------------------------------
        | Load workout logs for each calendar date.
        | This makes the weekly schedule reflect actual completion state.
        |--------------------------------------------------------------------------
        */

        const logEntries =
          await Promise.all(
            staticSchedule.map(
              async (item) => {
                const targetDate =
                  getDateObjectForDay(
                    item.day,
                  )

                const dateKey =
                  formatDateForQuery(
                    targetDate,
                  )

                if (!dateKey) {
                  return [item.day, null]
                }

                // Only request a workout log when a workout is actually
                // assigned to this exact calendar date. The backend returns
                // 404 when no assignment exists, so avoiding the request keeps
                // the weekly schedule clean and removes expected 404s.
                const assignmentForDate =
                  findAssignmentForDate(
                    assignmentList,
                    targetDate,
                  )

                if (!assignmentForDate) {
                  return [item.day, null]
                }

                try {
                  const logResponse =
                    await api.get(
                      "/workout-logs/me",
                      {
                        params: {
                          date: dateKey,
                        },
                      },
                    )

                  const log =
                    logResponse?.data
                      ?.workoutLog ||
                    logResponse?.data?.log ||
                    logResponse?.data ||
                    null

                  return [
                    item.day,
                    log,
                  ]
                } catch (logError) {
                  // A 404 can still occur if the assignment changes between
                  // the assignment request and the workout-log request.
                  if (
                    logError?.response?.status !==
                    404
                  ) {
                    console.warn(
                      `Unable to load workout log for ${item.day}:`,
                      logError,
                    )
                  }

                  return [item.day, null]
                }
              },
            ),
          )

        if (mounted) {
          setWorkoutLogs(
            Object.fromEntries(
              logEntries,
            ),
          )
        }
      } catch (error) {
        console.error(
          "Unable to load member assignments:",
          error,
        )

        if (mounted) {
          setError(
            error?.response?.data?.message ||
              "Unable to load your assigned workouts.",
          )
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    loadAssignments()

    return () => {
      mounted = false
    }
  }, [staticSchedule])

  /*
  |--------------------------------------------------------------------------
  | Workout reminders
  |--------------------------------------------------------------------------
  | Uses the startTime/reminder settings saved on the assignment.
  | Reminders are browser notifications while the member has the app open.
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (
      !assignments.length ||
      typeof window === "undefined" ||
      !("Notification" in window) ||
      Notification.permission !== "granted"
    ) {
      return undefined
    }

    const timers = []

    assignments.forEach((assignment) => {
      if (
        assignment?.status !== "active" ||
        assignment?.reminderEnabled === false ||
        !assignment?.startTime ||
        !assignment?.workoutDate
      ) {
        return
      }

      const dateKey =
        formatDateForQuery(
          assignment.workoutDate,
        )

      if (!dateKey) {
        return
      }

      const [hours, minutes] =
        String(assignment.startTime)
          .split(":")
          .map(Number)

      if (
        !Number.isInteger(hours) ||
        !Number.isInteger(minutes)
      ) {
        return
      }

      const workoutStart =
        new Date(
          `${dateKey}T${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:00`,
        )

      if (
        Number.isNaN(
          workoutStart.getTime(),
        )
      ) {
        return
      }

      const reminderMinutes =
        Number(
          assignment.reminderMinutesBefore,
        ) || 0

      const reminderAt =
        workoutStart.getTime() -
        reminderMinutes * 60 * 1000

      const delay =
        reminderAt -
        Date.now()

      if (delay <= 0) {
        return
      }

      const notificationKey =
        `gb-workout-reminder-${assignment._id || assignment.id}-${dateKey}-${reminderMinutes}`

      // Prevent duplicate reminders after component re-renders or navigation.
      if (
        window.localStorage.getItem(
          notificationKey,
        ) === "shown"
      ) {
        return
      }

      const timer = window.setTimeout(
        async () => {
          try {
            // Re-check the latest workout log immediately before notifying.
            // This prevents a reminder from appearing after the member has
            // already completed the scheduled workout.
            const logResponse =
              await api.get(
                "/workout-logs/me",
                {
                  params: {
                    date: dateKey,
                  },
                },
              )

            const latestLog =
              logResponse?.data
                ?.workoutLog ||
              logResponse?.data?.log ||
              logResponse?.data ||
              null

            if (latestLog?.completed === true) {
              window.localStorage.setItem(
                notificationKey,
                "shown",
              )
              return
            }
          } catch (logError) {
            // If there is no log yet, the workout can still be reminded.
            // A 404 is expected when the member has not started the workout.
            if (
              logError?.response?.status !== 404
            ) {
              console.warn(
                "Unable to verify workout completion before reminder:",
                logError,
              )
            }
          }

          const programName =
            assignment.program?.name ||
            "Your GB workout"

          const message =
            reminderMinutes > 0
              ? `${programName} starts at ${assignment.startTime}.`
              : `${programName} starts now.`

          try {
            new Notification(
              reminderMinutes > 0
                ? "GB Workout Reminder"
                : "It's time for your workout!",
              {
                body: message,
                tag: `gb-workout-${assignment._id || assignment.id}-${dateKey}`,
                icon: "/favicon.ico",
              },
            )

            window.localStorage.setItem(
              notificationKey,
              "shown",
            )
          } catch (notificationError) {
            console.warn(
              "Unable to show workout notification:",
              notificationError,
            )
          }
        },
        Math.min(
          delay,
          2147483647,
        ),
      )

      timers.push(timer)
    })

    return () => {
      timers.forEach((timer) =>
        window.clearTimeout(timer),
      )
    }
  }, [assignments, notificationPermission])

  /*
  |--------------------------------------------------------------------------
  | Build weekly schedule
  |--------------------------------------------------------------------------
  */

  const schedule = useMemo(() => {
    return staticSchedule.map(
      (item) => {
        const targetDate =
          getDateObjectForDay(
            item.day,
          )

        const assignment =
          findAssignmentForDate(
            assignments,
            targetDate,
          )

        const workoutLog =
          workoutLogs[item.day] ||
          null

        return {
          ...item,
          assignment,
          targetDate,
          workoutLog,
          workoutStatus: getScheduleWorkoutStatus(
            item,
            assignment,
            workoutLog,
            targetDate,
          ),
        }
      },
    )
  }, [
    staticSchedule,
    assignments,
    workoutLogs,
  ])

  /*
  |--------------------------------------------------------------------------
  | Selected workout
  |--------------------------------------------------------------------------
  */

  const selectedWorkout =
    schedule.find(
      (item) =>
        item.day === selectedDay,
    )

  /*
  |--------------------------------------------------------------------------
  | Render
  |--------------------------------------------------------------------------
  */

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
            <ArrowLeft size={19} />
          </button>

          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-gray-600">
              GB Training
            </p>

            <h1 className="text-xl font-black">
              Weekly Schedule
            </h1>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-md px-5 py-6">
        {/* -------------------------------------------------------------- */}
        {/* Header Card */}
        {/* -------------------------------------------------------------- */}

        <section className="rounded-3xl bg-white p-5 text-black">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-gray-500">
                This Week
              </p>

              <h2 className="mt-1 text-2xl font-black">
                Training Schedule
              </h2>

              <p className="mt-2 text-xs leading-5 text-gray-500">
                Your weekly training plan is set by the GB training team.
              </p>
            </div>

            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-black text-yellow-400">
              <CalendarDays size={22} />
            </div>
          </div>
        </section>

        {notificationPermission !== "granted" &&
          notificationPermission !== "unsupported" && (
            <section className="mt-5 rounded-3xl border border-yellow-400/20 bg-yellow-400/5 p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-black text-yellow-400">
                    Workout reminders
                  </p>
                  <p className="mt-1 text-[10px] leading-4 text-gray-500">
                    Allow notifications to receive your scheduled workout reminder.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (
                      "Notification" in window
                    ) {
                      Notification.requestPermission().then(
                        (permission) => {
                          setNotificationPermission(
                            permission,
                          )
                        },
                      )
                    }
                  }}
                  className="shrink-0 rounded-xl bg-yellow-400 px-3 py-2 text-[9px] font-black text-black"
                >
                  ENABLE
                </button>
              </div>
            </section>
          )}

        {/* -------------------------------------------------------------- */}
        {/* Loading */}
        {/* -------------------------------------------------------------- */}

        {loading && (
          <section className="mt-5 rounded-3xl border border-white/10 bg-white/5 p-5">
            <div className="flex items-center gap-3">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/10 border-t-lime-400" />

              <p className="text-sm font-bold text-gray-400">
                Loading your assigned workouts...
              </p>
            </div>
          </section>
        )}

        {/* -------------------------------------------------------------- */}
        {/* Error */}
        {/* -------------------------------------------------------------- */}

        {!loading && error && (
          <section className="mt-5 rounded-3xl border border-red-400/20 bg-red-400/5 p-5">
            <p className="text-sm font-bold text-red-300">
              {error}
            </p>
          </section>
        )}

        {!loading && (
          <>
            {/* -------------------------------------------------------------- */}
            {/* Days */}
            {/* -------------------------------------------------------------- */}

            <section className="mt-5">
          <div className="grid grid-cols-4 gap-2">
            {schedule
              .slice(0, 4)
              .map((item) => (
                <DayButton
                  key={item.day}
                  item={item}
                  selected={
                    selectedDay ===
                    item.day
                  }
                  onClick={() =>
                    setSelectedDay(
                      item.day,
                    )
                  }
                />
              ))}
          </div>

          <div className="mt-2 grid grid-cols-3 gap-2">
            {schedule
              .slice(4)
              .map((item) => (
                <DayButton
                  key={item.day}
                  item={item}
                  selected={
                    selectedDay ===
                    item.day
                  }
                  onClick={() =>
                    setSelectedDay(
                      item.day,
                    )
                  }
                />
              ))}
          </div>
        </section>

        {/* -------------------------------------------------------------- */}
        {/* Selected Day */}
        {/* -------------------------------------------------------------- */}

        {selectedWorkout && (
          <section className="mt-5">
            <WorkoutDetails
              workout={
                selectedWorkout
              }
              onOpenWorkout={() =>
                handleStartWorkout(
                  navigate,
                  selectedWorkout,
                )
              }
            />
          </section>
        )}

        {/* -------------------------------------------------------------- */}
        {/* Full Week */}
        {/* -------------------------------------------------------------- */}

        <section className="mt-6">
          <div className="mb-4">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-600">
              Full Week
            </p>

            <h2 className="mt-1 text-lg font-black">
              GB Training Plan
            </h2>
          </div>

          <div className="space-y-2">
            {schedule.map(
              (item) => (
                <WeeklyRow
                  key={item.day}
                  item={item}
                  selected={
                    selectedDay ===
                    item.day
                  }
                  onClick={() =>
                    setSelectedDay(
                      item.day,
                    )
                  }
                />
              ),
            )}
          </div>
        </section>
          </>
        )}
      </main>

      <BottomNavigation />
    </div>
  )
}

/*
|--------------------------------------------------------------------------
| Day Button
|--------------------------------------------------------------------------
*/

function DayButton({
  item,
  selected,
  onClick,
}) {
  const isRest =
    item.workoutType === "rest"

  const hasAssignment =
    Boolean(item.assignment)

  const status =
    item.workoutStatus ||
    (isRest
      ? "rest"
      : hasAssignment
        ? "scheduled"
        : "not_assigned")

  const statusLabel =
    getStatusLabel(status)

  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl border p-3 text-center transition ${
        selected
          ? "border-yellow-400 bg-yellow-400 text-black"
          : "border-white/10 bg-white/5 text-white"
      }`}
    >
      <p
        className={`text-[10px] font-black ${
          selected
            ? "text-black/60"
            : "text-gray-600"
        }`}
      >
        {item.shortDay}
      </p>

      <div
        className={`mx-auto mt-2 h-2 w-2 rounded-full ${
          isRest
            ? selected
              ? "bg-black/30"
              : "bg-gray-700"
            : hasAssignment
              ? selected
                ? "bg-black"
                : "bg-lime-400"
              : selected
                ? "bg-black/50"
                : "bg-yellow-400"
        }`}
      />

      {!isRest && (
        <p
          className={`mt-1 text-[8px] font-black ${
            selected
              ? "text-black/60"
              : status === "completed"
                ? "text-lime-400"
                : status === "pending"
                  ? "text-yellow-400"
                  : status === "in_progress"
                    ? "text-blue-400"
                    : "text-gray-500"
          }`}
        >
          {statusLabel}
        </p>
      )}
    </button>
  )
}

/*
|--------------------------------------------------------------------------
| Workout Details
|--------------------------------------------------------------------------
*/

function WorkoutDetails({
  workout,
  onOpenWorkout,
}) {
  const isRestDay =
    workout.workoutType === "rest"

  const assignment =
    workout.assignment

  const program =
    assignment?.program

  const programExercises =
    Array.isArray(
      program?.exercises,
    )
      ? program.exercises
      : []

  const hasAssignment =
    Boolean(
      assignment,
    )

  const hasProgram =
    Boolean(
      assignment?.program,
    )

  const exerciseCount =
    programExercises.length

  const programDuration =
    program?.duration ||
    workout.duration

  const programDescription =
    program?.description ||
    workout.description

  const assignedBy =
    assignment?.assignedBy

  const trainerName =
    assignedBy
      ? `${assignedBy.firstName || ""} ${
          assignedBy.lastName || ""
        }`.trim()
      : ""

  const workoutDate =
    assignment?.workoutDate
      ? formatDate(
          assignment.workoutDate,
        )
      : workout.targetDate
        ? formatDate(
            workout.targetDate,
          )
        : getDateForDay(
            workout.day,
          )

  /*
  |--------------------------------------------------------------------------
  | Rest Day
  |--------------------------------------------------------------------------
  */

  if (isRestDay) {
    return (
      <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/5">
        <div className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-gray-600">
                {workout.day}
              </p>

              <p className="mt-1 text-[11px] font-bold text-gray-500">
                {workoutDate}
              </p>

              <h2 className="mt-1 text-2xl font-black">
                {workout.title}
              </h2>

              <p className="mt-2 text-xs leading-5 text-gray-500">
                {workout.description}
              </p>
            </div>

            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-black text-yellow-400">
              <CheckCircle2 size={22} />
            </div>
          </div>

          <div className="mt-5 rounded-2xl bg-black p-4">
            <p className="text-sm font-black">
              Recovery Day
            </p>

            <p className="mt-1 text-xs leading-5 text-gray-600">
              Use today to recover, stretch and prepare for your next training session.
            </p>
          </div>
        </div>
      </div>
    )
  }

  /*
  |--------------------------------------------------------------------------
  | Training Day
  |--------------------------------------------------------------------------
  */

  return (
    <div
      className={`overflow-hidden rounded-3xl border ${
        hasAssignment
          ? "border-lime-400/30"
          : "border-white/10"
      } bg-white/5`}
    >
      <div
        className={`p-5 ${
          hasAssignment
            ? "bg-lime-400/10"
            : ""
        }`}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            {hasAssignment && (
              <span
                className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[9px] font-black ${
                  workout.workoutStatus === "completed"
                    ? "bg-lime-400 text-black"
                    : workout.workoutStatus === "pending"
                      ? "bg-yellow-400/10 text-yellow-400"
                      : workout.workoutStatus === "in_progress"
                        ? "bg-blue-400/10 text-blue-300"
                        : "bg-lime-400 text-black"
                }`}
              >
                {workout.workoutStatus === "completed" ? (
                  <CheckCircle2 size={11} />
                ) : null}
                {getStatusLabel(
                  workout.workoutStatus || "scheduled",
                )}
              </span>
            )}

            {!hasAssignment && (
              <span className="inline-flex items-center gap-1 rounded-full bg-white/5 px-3 py-1 text-[9px] font-black text-gray-500">
                WORKOUT NOT ASSIGNED
              </span>
            )}

            <p className="mt-2 text-xs font-bold uppercase tracking-wider text-gray-600">
              {workout.day}
            </p>

            <p className="mt-1 text-[11px] font-bold text-gray-500">
              {workoutDate}
            </p>

            <h2 className="mt-1 text-2xl font-black">
              {hasProgram
                ? program?.name ||
                  workout.title
                : workout.title}
            </h2>

            <p className="mt-2 text-xs leading-5 text-gray-500">
              {hasProgram
                ? programDescription
                : workout.description}
            </p>
          </div>

          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-black text-yellow-400">
            <Dumbbell size={22} />
          </div>
        </div>

        {/* -------------------------------------------------------------- */}
        {/* Workout Information */}
        {/* -------------------------------------------------------------- */}

        <div className="mt-5 grid grid-cols-2 gap-2">
          <InfoItem
            icon={Clock3}
            label="Time"
            value={
              assignment?.startTime
                ? `${formatTimeLabel(assignment.startTime)}${
                    assignment.endTime
                      ? ` – ${formatTimeLabel(assignment.endTime)}`
                      : ""
                  }`
                : "Not specified"
            }
          />

          <InfoItem
            icon={MapPin}
            label="Location"
            value={workout.location}
          />
        </div>

        <div className="mt-2 grid grid-cols-2 gap-2">
          <InfoItem
            icon={Dumbbell}
            label="Duration"
            value={programDuration}
          />

          <InfoItem
            icon={CalendarDays}
            label="Exercises"
            value={
              hasProgram
                ? `${exerciseCount} ${
                    exerciseCount === 1
                      ? "Exercise"
                      : "Exercises"
                  }`
                : "Not assigned"
            }
          />
        </div>

        {/* -------------------------------------------------------------- */}
        {/* Trainer */}
        {/* -------------------------------------------------------------- */}

        {trainerName && (
          <div className="mt-2 rounded-2xl bg-black p-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-600">
              Assigned By
            </p>

            <p className="mt-1 text-sm font-black">
              {trainerName}
            </p>

            <p className="mt-1 text-[10px] text-gray-600">
              Your GB training team
            </p>
          </div>
        )}

        {/* -------------------------------------------------------------- */}
        {/* Assigned Workout */}
        {/* -------------------------------------------------------------- */}

        {hasAssignment ? (
          <>
            <div className="mt-4 rounded-2xl border border-lime-400/20 bg-lime-400/5 p-4">
              <div className="flex items-center gap-2">
                <CheckCircle2
                  size={16}
                  className="text-lime-400"
                />

                <p className="text-xs font-black text-lime-400">
                  Your workout is ready
                </p>
              </div>

              <p className="mt-2 text-xs leading-5 text-gray-500">
                Your trainer has assigned this workout. Open it to see your exercises, sets, reps and target weights.
              </p>

              {assignment?.startTime && (
                <p className="mt-3 text-[10px] font-bold text-gray-600">
                  {assignment.reminderEnabled === false
                    ? "Workout reminder is off."
                    : Number(
                        assignment.reminderMinutesBefore,
                      ) > 0
                      ? `Reminder set for ${assignment.reminderMinutesBefore} minutes before.`
                      : "Reminder set for workout start time."}
                </p>
              )}
            </div>

            {/* ---------------------------------------------------------- */}
            {/* START WORKOUT */}
            {/* ---------------------------------------------------------- */}

            <button
              type="button"
              onClick={onOpenWorkout}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-lime-400 px-5 py-4 text-sm font-black text-black transition hover:bg-lime-300 active:scale-[0.98]"
            >
              <Play
                size={17}
                fill="currentColor"
              />

              START WORKOUT
            </button>
          </>
        ) : (
          <div className="mt-4 rounded-2xl bg-black p-4">
            <p className="text-sm font-black">
              Workout not assigned yet
            </p>

            <p className="mt-1 text-xs leading-5 text-gray-600">
              Your trainer has not assigned a workout for this day yet. Once it is assigned, it will appear here.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

/*
|--------------------------------------------------------------------------
| Info Item
|--------------------------------------------------------------------------
*/

function InfoItem({
  icon: Icon,
  label,
  value,
}) {
  return (
    <div className="rounded-2xl bg-black p-4">
      <div className="flex items-center gap-2">
        <Icon
          size={14}
          className="text-yellow-400"
        />

        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-600">
          {label}
        </p>
      </div>

      <p className="mt-2 text-xs font-black">
        {value || "Not specified"}
      </p>
    </div>
  )
}

/*
|--------------------------------------------------------------------------
| Weekly Row
|--------------------------------------------------------------------------
*/

function WeeklyRow({
  item,
  selected,
  onClick,
}) {
  const isRest =
    item.workoutType === "rest"

  const hasAssignment =
    Boolean(item.assignment)

  const status =
    item.workoutStatus ||
    (isRest
      ? "rest"
      : hasAssignment
        ? "scheduled"
        : "not_assigned")

  const statusLabel =
    getStatusLabel(status)

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-2xl border p-4 text-left transition ${
        selected
          ? "border-yellow-400/40 bg-yellow-400/10"
          : "border-white/10 bg-white/5"
      }`}
    >
      <div
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xs font-black ${
          isRest
            ? "bg-white/5 text-gray-600"
            : hasAssignment
              ? "bg-lime-400 text-black"
              : "bg-white/10 text-yellow-400"
        }`}
      >
        {item.shortDay}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-black">
          {hasAssignment
            ? item.assignment
                ?.program?.name ||
              item.title
            : item.title}
        </p>

        <p className="mt-1 text-[10px] text-gray-600">
          {isRest
            ? "Recovery"
            : hasAssignment
              ? statusLabel
              : "Workout not assigned"}
        </p>
      </div>

      {!isRest && (
        <span
          className={`shrink-0 rounded-full px-3 py-1 text-[9px] font-bold ${
            status === "completed"
              ? "bg-lime-400/10 text-lime-400"
              : status === "pending"
                ? "bg-yellow-400/10 text-yellow-400"
                : status === "in_progress"
                  ? "bg-blue-400/10 text-blue-300"
                  : status === "scheduled"
                    ? "bg-white/5 text-gray-400"
                    : "bg-white/5 text-gray-500"
          }`}
        >
          {statusLabel}
        </span>
      )}
    </button>
  )
}

/*
|--------------------------------------------------------------------------
| Bottom Navigation
|--------------------------------------------------------------------------
*/

function BottomNavigation() {
  const navigate = useNavigate()

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
          <Dumbbell size={19} />

          <span className="text-[10px] font-bold">
            Home
          </span>
        </button>

        <button
          type="button"
          onClick={() =>
            navigate(
              "/weekly-schedule",
            )
          }
          className="flex flex-col items-center gap-1 text-yellow-400"
        >
          <CalendarDays size={19} />

          <span className="text-[10px] font-bold">
            Schedule
          </span>
        </button>

        <button
          type="button"
          onClick={() =>
            navigate("/profile")
          }
          className="flex flex-col items-center gap-1 text-gray-600"
        >
          <UserRound size={19} />

          <span className="text-[10px] font-bold">
            Profile
          </span>
        </button>
      </div>
    </nav>
  )
}

/*
|--------------------------------------------------------------------------
| Start Workout
|--------------------------------------------------------------------------
*/

function handleStartWorkout(
  navigate,
  workout,
) {
  const assignment =
    workout?.assignment

  if (!assignment) {
    return
  }

  const assignmentId =
    assignment._id ||
    assignment.id

  const workoutDate =
    workout?.targetDate ||
    assignment?.workoutDate

  const params =
    new URLSearchParams()

  if (assignmentId) {
    params.set(
      "assignmentId",
      assignmentId,
    )
  }

  if (workoutDate) {
    params.set(
      "date",
      formatDateForQuery(
        workoutDate,
      ),
    )
  }

  navigate(
    `/workout?${params.toString()}`,
  )
}

/*
|--------------------------------------------------------------------------
| Find assignment for exact calendar date
|--------------------------------------------------------------------------
*/

function findAssignmentForDate(
  assignments,
  targetDate,
) {
  if (
    !Array.isArray(assignments)
  ) {
    return null
  }

  if (!targetDate) {
    return null
  }

  const targetKey =
    formatDateForQuery(targetDate)

  if (!targetKey) {
    return null
  }

  const matchingAssignments =
    assignments.filter(
      (assignment) => {
        if (!assignment) {
          return false
        }

        if (
          assignment.status &&
          assignment.status !== "active" &&
          assignment.status !== "completed"
        ) {
          return false
        }

        const workoutDateKey =
          formatDateForQuery(
            assignment.workoutDate,
          )

        if (!workoutDateKey) {
          return false
        }

        return (
          workoutDateKey ===
          targetKey
        )
      },
    )

  if (
    matchingAssignments.length ===
    0
  ) {
    return null
  }

  /*
  |--------------------------------------------------------------------------
  | If duplicate active assignments exist for the same date,
  | use the newest assignment.
  |--------------------------------------------------------------------------
  */

  matchingAssignments.sort(
    (
      first,
      second,
    ) => {
      const firstCreated =
        new Date(
          first.createdAt || 0,
        ).getTime()

      const secondCreated =
        new Date(
          second.createdAt || 0,
        ).getTime()

      return (
        secondCreated -
        firstCreated
      )
    },
  )

  return matchingAssignments[0]
}

/*
|--------------------------------------------------------------------------
| Determine schedule status from the exact calendar date
|--------------------------------------------------------------------------
*/

function getScheduleWorkoutStatus(
  item,
  assignment,
  workoutLog,
  targetDate,
) {
  if (item.workoutType === "rest") {
    return "rest"
  }

  if (!assignment) {
    return "not_assigned"
  }

  // A completed assignment must remain visible in the weekly
  // schedule so the day can continue to show COMPLETED.
  if (assignment.status === "completed") {
    return "completed"
  }

  if (workoutLog?.completed) {
    return "completed"
  }

  if (
    Number(workoutLog?.completedSets || 0) > 0
  ) {
    return "in_progress"
  }

  const today =
    startOfDay(new Date())

  if (
    targetDate &&
    startOfDay(targetDate) < today
  ) {
    return "pending"
  }

  return "scheduled"
}

function getStatusLabel(status) {
  switch (status) {
    case "completed":
      return "COMPLETED"
    case "pending":
      return "PENDING"
    case "in_progress":
      return "IN PROGRESS"
    case "not_assigned":
      return "NOT ASSIGNED"
    case "rest":
      return "REST"
    default:
      return "SCHEDULED"
  }
}

/*
|--------------------------------------------------------------------------
| Get exact date for weekday
|--------------------------------------------------------------------------
*/

function getDateObjectForDay(
  dayName,
) {
  const dates =
    getWeekDates(
      new Date(),
    )

  const target =
    dates.find(
      (date) =>
        getDayName(
          date,
        ).toLowerCase() ===
        dayName.toLowerCase(),
    )

  return target || null
}

/*
|--------------------------------------------------------------------------
| Date Helpers
|--------------------------------------------------------------------------
*/

function parseDateOnly(
  value,
) {
  if (!value) {
    return null
  }

  if (
    typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(
      value,
    )
  ) {
    const [year, month, day] =
      value.split("-").map(Number)

    return new Date(
      year,
      month - 1,
      day,
    )
  }

  const date =
    new Date(value)

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return null
  }

  return date
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

function getWeekDates(
  date,
) {
  const current =
    startOfDay(date)

  const day =
    current.getDay()

  const mondayOffset =
    day === 0
      ? -6
      : 1 - day

  const monday =
    new Date(current)

  monday.setDate(
    monday.getDate() +
      mondayOffset,
  )

  return Array.from(
    {
      length: 7,
    },
    (_, index) => {
      const result =
        new Date(monday)

      result.setDate(
        monday.getDate() +
          index,
      )

      return result
    },
  )
}

function getDayName(
  date,
) {
  return date.toLocaleDateString(
    "en-US",
    {
      weekday: "long",
    },
  )
}

function getDateForDay(
  dayName,
) {
  const target =
    getDateObjectForDay(
      dayName,
    )

  if (!target) {
    return ""
  }

  return target.toLocaleDateString(
    "en-US",
    {
      month: "short",
      day: "numeric",
      year: "numeric",
    },
  )
}

function formatDate(
  value,
) {
  const dateKey =
    formatDateForQuery(value)

  if (!dateKey) {
    return ""
  }

  const [year, month, day] =
    dateKey.split("-").map(Number)

  const date =
    new Date(
      year,
      month - 1,
      day,
    )

  return date.toLocaleDateString(
    "en-US",
    {
      month: "short",
      day: "numeric",
      year: "numeric",
    },
  )
}

function formatDateForQuery(
  value,
) {
  if (!value) {
    return ""
  }

  /*
  |--------------------------------------------------------------------------
  | IMPORTANT: workoutDate is a calendar date, not a timezone-dependent
  | moment in time. MongoDB serializes Date values as ISO timestamps.
  | Always preserve the YYYY-MM-DD calendar portion instead of converting
  | the stored UTC timestamp through the browser's local timezone.
  |--------------------------------------------------------------------------
  */

  if (
    typeof value === "string"
  ) {
    const match =
      value.match(
        /^(\d{4}-\d{2}-\d{2})/,
      )

    if (match) {
      return match[1]
    }
  }

  if (value instanceof Date) {
    if (
      Number.isNaN(
        value.getTime(),
      )
    ) {
      return ""
    }

    const year =
      value.getUTCFullYear()

    const month =
      String(
        value.getUTCMonth() + 1,
      ).padStart(2, "0")

    const day =
      String(
        value.getUTCDate(),
      ).padStart(2, "0")

    return `${year}-${month}-${day}`
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

  const year =
    date.getUTCFullYear()

  const month =
    String(
      date.getUTCMonth() + 1,
    ).padStart(2, "0")

  const day =
    String(
      date.getUTCDate(),
    ).padStart(2, "0")

  return `${year}-${month}-${day}`
}

function getCurrentDay() {
  const days = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ]

  return days[
    new Date().getDay()
  ]
}

export default WeeklySchedule