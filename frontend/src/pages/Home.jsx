import {
  useEffect,
  useState,
} from "react"

import {
  ArrowRight,
  CalendarDays,
  Clock3,
  Flame,
  Loader2,
  UserRound,
} from "lucide-react"

import {
  useNavigate,
} from "react-router-dom"

import TodayWorkoutCard from "../components/TodayWorkoutCard"

import getTodayWorkout from "../utils/getTodayWorkout"

import {
  useAuth,
} from "../context/AuthContext.jsx"

import {
  useGym,
} from "../context/GymContext.jsx"

import {
  buildMediaUrl,
  getMyProfile,
  getMySubscription,
  getMyWorkoutHistory,
  getMyPrograms,
} from "../api/api.js"


function resolveProfilePhoto(photo) {
  if (!photo) {
    return ""
  }

  const value =
    String(photo).trim()

  if (!value) {
    return ""
  }

  if (
    value.startsWith("http://") ||
    value.startsWith("https://") ||
    value.startsWith("data:")
  ) {
    return value
  }

  try {
    return buildMediaUrl(value)
  } catch (error) {
    console.error(
      "Unable to build profile photo URL:",
      error,
    )

    return value
  }
}


function Home() {
  const {
    gym,
  } = useGym() || {}

  const navigate =
    useNavigate()

  const {
    user,
  } = useAuth()

  const userId =
    user?._id ||
    user?.id ||
    user?.userId ||
    null

  const [
    todayWorkout,
    setTodayWorkout,
  ] = useState(null)

  const [
    workoutLoading,
    setWorkoutLoading,
  ] = useState(true)

  const [
    workoutError,
    setWorkoutError,
  ] = useState("")

  const [
    profilePhoto,
    setProfilePhoto,
  ] = useState(() =>
    resolveProfilePhoto(
      user?.profilePhoto,
    ),
  )

  const [
    statistics,
    setStatistics,
  ] = useState({
    currentStreak: 0,
    totalWorkouts: 0,
  })

  const [
    subscription,
    setSubscription,
  ] = useState(null)

  const [
    subscriptionLoading,
    setSubscriptionLoading,
  ] = useState(true)


  /*
  |--------------------------------------------------------------------------
  | Member name
  |--------------------------------------------------------------------------
  */

  const firstName =
    user?.firstName ||
    user?.firstname ||
    user?.name
      ?.trim()
      ?.split(" ")[0] ||
    user?.fullName
      ?.trim()
      ?.split(" ")[0] ||
    "Member"


  /*
  |--------------------------------------------------------------------------
  | Load today's workout from backend
  |--------------------------------------------------------------------------
  */

  const loadTodayWorkout =
    async () => {
      try {
        setWorkoutLoading(
          true,
        )

        setWorkoutError("")

        const result =
          await getTodayWorkout()

        console.log(
          "TODAY WORKOUT:",
          result,
        )

        /*
        |--------------------------------------------------------------------------
        | getTodayWorkout already resolves the member's assignment using the
        | exact local calendar date. Do not re-parse result.date here.
        |--------------------------------------------------------------------------
        */

        setTodayWorkout(
          result,
        )
      } catch (error) {
        console.error(
          "Unable to load today's workout:",
          error,
        )

        setWorkoutError(
          error?.message ||
            "Unable to load today's workout.",
        )

        setTodayWorkout(null)
      } finally {
        setWorkoutLoading(
          false,
        )
      }
    }


  /*
  |--------------------------------------------------------------------------
  | Load workout on page open
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    let mounted = true

    if (!userId) {
      setTodayWorkout(null)
      setWorkoutLoading(false)
      setWorkoutError("")

      return () => {
        mounted = false
      }
    }

    const load =
      async () => {
        if (!mounted) {
          return
        }

        await loadTodayWorkout()
      }

    load()

    return () => {
      mounted = false
    }
  }, [userId])


  /*
  |--------------------------------------------------------------------------
  | Load profile photo
  |--------------------------------------------------------------------------
  |
  | The profile photo is loaded directly from the backend so that the Home
  | screen does not depend only on the possibly stale AuthContext user.
  |
  */

  useEffect(() => {
    let mounted = true

    if (!userId) {
      setProfilePhoto("")

      return () => {
        mounted = false
      }
    }

    const loadProfilePhoto =
      async () => {
        try {
          /*
          |--------------------------------------------------------------------------
          | Immediately show cached AuthContext photo if available.
          |--------------------------------------------------------------------------
          */

          const cachedPhoto =
            user?.profilePhoto || ""

          if (
            cachedPhoto &&
            mounted
          ) {
            setProfilePhoto(
              resolveProfilePhoto(
                cachedPhoto,
              ),
            )
          }

          /*
          |--------------------------------------------------------------------------
          | Then get the current photo from MongoDB.
          |--------------------------------------------------------------------------
          */

          const response =
            await getMyProfile()

          const serverPhoto =
            response?.user
              ?.profilePhoto ||
            ""

          if (!mounted) {
            return
          }

          if (serverPhoto) {
            setProfilePhoto(
              resolveProfilePhoto(
                serverPhoto,
              ),
            )
          } else if (
            cachedPhoto
          ) {
            setProfilePhoto(
              resolveProfilePhoto(
                cachedPhoto,
              ),
            )
          } else {
            setProfilePhoto("")
          }
        } catch (error) {
          console.error(
            "Unable to load profile photo:",
            error,
          )

          /*
          |--------------------------------------------------------------------------
          | Keep cached photo if backend refresh fails.
          |--------------------------------------------------------------------------
          */

          if (
            mounted &&
            user?.profilePhoto
          ) {
            setProfilePhoto(
              resolveProfilePhoto(
                user.profilePhoto,
              ),
            )
          }
        }
      }

    loadProfilePhoto()

    return () => {
      mounted = false
    }
  }, [
    userId,
    user?.profilePhoto,
  ])


  /*
  |--------------------------------------------------------------------------
  | Load subscription
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    let mounted = true

    if (!userId) {
      setSubscription(null)
      setSubscriptionLoading(false)

      return () => {
        mounted = false
      }
    }

    const loadSubscription =
      async () => {
        try {
          setSubscriptionLoading(
            true,
          )

          const response =
            await getMySubscription()

          if (mounted) {
            setSubscription(
              response?.hasActiveSubscription
                ? response.subscription
                : null,
            )
          }
        } catch (error) {
          console.error(
            "Unable to load subscription:",
            error,
          )

          if (mounted) {
            setSubscription(null)
          }
        } finally {
          if (mounted) {
            setSubscriptionLoading(
              false,
            )
          }
        }
      }

    loadSubscription()

    return () => {
      mounted = false
    }
  }, [userId])


  /*
  |--------------------------------------------------------------------------
  | Load statistics
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    let mounted = true

    if (!userId) {
      setStatistics({
        currentStreak: 0,
        totalWorkouts: 0,
      })

      return () => {
        mounted = false
      }
    }

    const loadStatistics =
      async () => {
        try {
          const [
            historyResponse,
            programsResponse,
          ] =
            await Promise.all([
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

          if (!mounted) {
            return
          }

          setStatistics({
            currentStreak:
              calculateCurrentStreak(
                completedScheduledWorkouts,
              ),

            totalWorkouts:
              completedScheduledWorkouts.length,
          })
        } catch (error) {
          console.error(
            "Unable to load workout statistics:",
            error,
          )

          if (mounted) {
            setStatistics({
              currentStreak: 0,
              totalWorkouts: 0,
            })
          }
        }
      }

    loadStatistics()

    return () => {
      mounted = false
    }
  }, [userId])


  /*
  |--------------------------------------------------------------------------
  | Start workout
  |--------------------------------------------------------------------------
  */

  const handleStartWorkout =
    () => {
      console.log(
        "START TODAY'S WORKOUT CLICKED",
      )

      console.log(
        "Workout being passed:",
        todayWorkout,
      )

      if (
        !todayWorkout?.hasWorkout ||
        !todayWorkout?.workout
      ) {
        console.warn(
          "No assigned workout available.",
        )

        return
      }

      const assignmentId =
        todayWorkout
          ?.assignmentId ||
        todayWorkout
          ?.workout
          ?.assignmentId

      const programId =
        todayWorkout
          ?.program
          ?._id ||
        todayWorkout
          ?.workout
          ?.program
          ?._id

      const date =
        todayWorkout?.date ||
        todayWorkout
          ?.workout
          ?.workoutDate ||
        new Date()
          .toISOString()
          .split("T")[0]

      const params =
        new URLSearchParams()

      if (assignmentId) {
        params.set(
          "assignmentId",
          assignmentId,
        )
      }

      if (programId) {
        params.set(
          "programId",
          programId,
        )
      }

      if (date) {
        params.set(
          "date",
          date,
        )
      }

      const query =
        params.toString()

      const workoutUrl =
        query
          ? `/workout?${query}`
          : "/workout"

      console.log(
        "Navigating to:",
        workoutUrl,
      )

      navigate(
        workoutUrl,
        {
          replace: false,

          state: {
            date,

            assignmentId,

            programId,

            workout: {
              ...(todayWorkout.workout ||
                {}),

              startTime:
                todayWorkout.startTime ||
                todayWorkout.assignment
                  ?.startTime ||
                todayWorkout.workout
                  ?.startTime ||
                todayWorkout.workout
                  ?.assignment
                  ?.startTime ||
                null,

              endTime:
                todayWorkout.endTime ||
                todayWorkout.assignment
                  ?.endTime ||
                todayWorkout.workout
                  ?.endTime ||
                todayWorkout.workout
                  ?.assignment
                  ?.endTime ||
                null,

              reminderEnabled:
                todayWorkout
                  .reminderEnabled ??
                todayWorkout.assignment
                  ?.reminderEnabled ??
                todayWorkout.workout
                  ?.reminderEnabled ??
                todayWorkout.workout
                  ?.assignment
                  ?.reminderEnabled ??
                true,

              reminderMinutesBefore:
                todayWorkout
                  .reminderMinutesBefore ??
                todayWorkout.assignment
                  ?.reminderMinutesBefore ??
                todayWorkout.workout
                  ?.reminderMinutesBefore ??
                todayWorkout.workout
                  ?.assignment
                  ?.reminderMinutesBefore ??
                5,
            },

            program:
              todayWorkout.program,

            durationSeconds:
              todayWorkout.durationSeconds,

            startTime:
              todayWorkout.startTime ||
              todayWorkout.assignment
                ?.startTime ||
              todayWorkout.workout
                ?.startTime ||
              todayWorkout.workout
                ?.assignment
                ?.startTime ||
              null,

            endTime:
              todayWorkout.endTime ||
              todayWorkout.assignment
                ?.endTime ||
              todayWorkout.workout
                ?.endTime ||
              todayWorkout.workout
                ?.assignment
                ?.endTime ||
              null,

            reminderEnabled:
              todayWorkout
                .reminderEnabled ??
              todayWorkout.assignment
                ?.reminderEnabled ??
              todayWorkout.workout
                ?.reminderEnabled ??
              todayWorkout.workout
                ?.assignment
                ?.reminderEnabled ??
              true,

            reminderMinutesBefore:
              todayWorkout
                .reminderMinutesBefore ??
              todayWorkout.assignment
                ?.reminderMinutesBefore ??
              todayWorkout.workout
                ?.reminderMinutesBefore ??
              todayWorkout.workout
                ?.assignment
                ?.reminderMinutesBefore ??
              5,
          },
        },
      )
    }


  /*
  |--------------------------------------------------------------------------
  | Render
  |--------------------------------------------------------------------------
  */

  return (
    <div className="min-h-screen bg-black pb-28 text-white">

      {/* ---------------------------------------------------------------- */}
      {/* Header */}
      {/* ---------------------------------------------------------------- */}

      <header className="border-b border-white/10">

        <div className="mx-auto flex max-w-md items-center justify-between px-5 py-4">

          <div>

            <p className="max-w-[210px] truncate text-2xl font-black tracking-tight">
              {gym?.name ||
                "Gym"}
            </p>

            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-lime-400">
              Fitness
            </p>

          </div>


          {/* ------------------------------------------------------------ */}
          {/* Profile Photo */}
          {/* ------------------------------------------------------------ */}

          <button
            type="button"
            onClick={() =>
              navigate(
                "/profile",
              )
            }
            className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border-2 border-lime-400/40 bg-white/10 transition hover:bg-white/20"
            aria-label="Open profile"
          >

            {profilePhoto ? (
              <img
                src={profilePhoto}
                alt="Profile"
                className="h-full w-full object-cover"
                onError={(
                  event,
                ) => {
                  console.error(
                    "Profile photo failed to load:",
                    profilePhoto,
                  )

                  event.currentTarget.style.display =
                    "none"

                  setProfilePhoto("")
                }}
              />
            ) : (
              <UserRound
                size={21}
              />
            )}

          </button>

        </div>

      </header>


      <main className="mx-auto w-full max-w-md px-5 py-6">

        {/* ---------------------------------------------------------------- */}
        {/* Welcome */}
        {/* ---------------------------------------------------------------- */}

        <section className="mb-6">

          <p className="text-xs font-semibold uppercase tracking-wider text-gray-600">
            Welcome back
          </p>

          <h1 className="mt-1 text-3xl font-black">
            {firstName}
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Here's your training plan for today.
          </p>

        </section>


        {/* ---------------------------------------------------------------- */}
        {/* Workout */}
        {/* ---------------------------------------------------------------- */}

        {workoutLoading ? (
          <section className="rounded-3xl border border-white/10 bg-white/5 p-8">

            <div className="flex flex-col items-center justify-center text-center">

              <Loader2
                size={28}
                className="animate-spin text-lime-400"
              />

              <p className="mt-4 text-sm font-bold text-white">
                Loading today's workout...
              </p>

              <p className="mt-1 text-xs text-gray-600">
                Checking your assigned training plan.
              </p>

            </div>

          </section>
        ) : workoutError ? (
          <section className="rounded-3xl border border-red-500/20 bg-red-500/5 p-5">

            <p className="text-sm font-black text-red-300">
              Unable to load workout
            </p>

            <p className="mt-2 text-xs leading-5 text-gray-500">
              {workoutError}
            </p>

            <button
              type="button"
              onClick={
                loadTodayWorkout
              }
              className="mt-4 rounded-xl bg-white px-4 py-3 text-xs font-black text-black transition hover:bg-gray-200"
            >
              TRY AGAIN
            </button>

          </section>
        ) : todayWorkout?.completed ? (
          <CompletedTodayWorkoutCard
            workout={
              todayWorkout
            }
            onView={
              handleStartWorkout
            }
          />
        ) : (
          <TodayWorkoutCard
            workout={
              todayWorkout
            }
            onStart={
              handleStartWorkout
            }
          />
        )}


        {/* ---------------------------------------------------------------- */}
        {/* Subscription */}
        {/* ---------------------------------------------------------------- */}

        <section className="mt-6 rounded-3xl border border-lime-400/20 bg-lime-400/5 p-5">

          <div className="flex items-start justify-between gap-4">

            <div>

              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-lime-400">
                Membership
              </p>

              <h2 className="mt-1 text-xl font-black">
                {subscription?.planName ||
                  subscription
                    ?.membershipPlan
                    ?.name ||
                  "No active subscription"}
              </h2>

            </div>

            <Clock3
              size={20}
              className="text-lime-400"
            />

          </div>


          {subscriptionLoading ? (
            <p className="mt-4 text-xs text-gray-500">
              Checking membership status...
            </p>
          ) : subscription ? (
            <>

              <div className="mt-5 flex items-end justify-between gap-4">

                <div>

                  <p className="text-[9px] font-black uppercase tracking-wider text-gray-600">
                    Days remaining
                  </p>

                  <p className="mt-1 text-3xl font-black">
                    {Math.max(
                      0,
                      Number(
                        subscription.daysRemaining,
                      ) || 0,
                    )}
                  </p>

                </div>


                <p className="text-xs font-black text-gray-500">
                  Expires{" "}
                  {subscription.endDate
                    ? new Date(
                        subscription.endDate,
                      ).toLocaleDateString()
                    : "N/A"}
                </p>

              </div>


              <div className="mt-4 h-2 overflow-hidden rounded-full bg-black/50">

                <div
                  className={`h-full rounded-full transition-all ${
                    Number(
                      subscription.percentageRemaining,
                    ) <= 20
                      ? "bg-red-400"
                      : Number(
                            subscription.percentageRemaining,
                          ) <= 40
                        ? "bg-yellow-400"
                        : "bg-lime-400"
                  }`}
                  style={{
                    width: `${Math.min(
                      100,
                      Math.max(
                        0,
                        Number(
                          subscription.percentageRemaining,
                        ) || 0,
                      ),
                    )}%`,
                  }}
                />

              </div>


              <div className="mt-2 flex items-center justify-between text-[10px] font-bold">

                <span className="text-gray-600">
                  {Math.min(
                    100,
                    Math.max(
                      0,
                      Number(
                        subscription.percentageRemaining,
                      ) || 0,
                    ),
                  )}
                  % remaining
                </span>


                {Number(
                  subscription.daysRemaining,
                ) <= 7 && (
                  <span className="text-red-400">
                    Subscription ending soon
                  </span>
                )}

              </div>

            </>
          ) : (
            <button
              type="button"
              onClick={() =>
                navigate(
                  "/membership-plans",
                )
              }
              className="mt-4 w-full rounded-2xl bg-lime-400 px-4 py-3 text-xs font-black text-black"
            >
              VIEW MEMBERSHIP PLANS
            </button>
          )}

        </section>


        {/* ---------------------------------------------------------------- */}
        {/* Statistics */}
        {/* ---------------------------------------------------------------- */}

        <section className="mt-6 grid grid-cols-2 gap-3">

          <button
            type="button"
            onClick={() =>
              navigate(
                "/workout-history",
              )
            }
            className="rounded-3xl border border-white/10 bg-white/5 p-5 text-left transition hover:border-yellow-400/30"
          >

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-400 text-black">
              <Flame
                size={18}
              />
            </div>

            <p className="mt-4 text-2xl font-black">
              {
                statistics.currentStreak
              }
            </p>

            <p className="mt-1 text-xs text-gray-600">
              Day streak
            </p>

          </button>


          <button
            type="button"
            onClick={() =>
              navigate(
                "/progress",
              )
            }
            className="rounded-3xl border border-white/10 bg-white/5 p-5 text-left transition hover:border-lime-400/30"
          >

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-lime-400 text-black">
              <CalendarDays
                size={18}
              />
            </div>

            <p className="mt-4 text-2xl font-black">
              {
                statistics.totalWorkouts
              }
            </p>

            <p className="mt-1 text-xs text-gray-600">
              Workouts completed
            </p>

          </button>

        </section>


        {/* ---------------------------------------------------------------- */}
        {/* Attendance */}
        {/* ---------------------------------------------------------------- */}

        <section className="mt-6 rounded-3xl border border-lime-400/20 bg-lime-400/5 p-5">

          <div className="flex items-start justify-between gap-4">

            <div>

              <p className="text-xs font-bold uppercase tracking-wider text-lime-400">
                Attendance
              </p>

              <h2 className="mt-1 text-lg font-black">
                Attendance Calendar
              </h2>

              <p className="mt-2 text-xs leading-5 text-gray-500">
                View your yearly attendance and completed workout days.
              </p>

            </div>

            <CalendarDays
              size={20}
              className="text-lime-400"
            />

          </div>


          <button
            type="button"
            onClick={() =>
              navigate(
                "/attendance",
              )
            }
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-lime-400 px-5 py-3 text-xs font-black text-black transition hover:bg-lime-300"
          >
            VIEW ATTENDANCE

            <ArrowRight
              size={14}
            />
          </button>

        </section>


        {/* ---------------------------------------------------------------- */}
        {/* Weekly training */}
        {/* ---------------------------------------------------------------- */}

        <section className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-5">

          <div className="flex items-center justify-between">

            <div>

              <p className="text-xs font-bold uppercase tracking-wider text-gray-600">
                Weekly training
              </p>

              <h2 className="mt-1 text-lg font-black">
                Your week
              </h2>

            </div>


            <button
              type="button"
              onClick={() =>
                navigate(
                  "/weekly-schedule",
                )
              }
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 transition hover:bg-white/10"
              aria-label="View weekly schedule"
            >
              <ArrowRight
                size={16}
              />
            </button>

          </div>


          <div className="mt-5 space-y-2">

            <ScheduleRow
              day="Mon"
              workout="View schedule"
            />

            <ScheduleRow
              day="Tue"
              workout="View schedule"
            />

            <ScheduleRow
              day="Wed"
              workout="View schedule"
            />

            <ScheduleRow
              day="Thu"
              workout="View schedule"
            />

            <ScheduleRow
              day="Fri"
              workout="View schedule"
            />

            <ScheduleRow
              day="Sat"
              workout="View schedule"
            />

            <ScheduleRow
              day="Sun"
              workout="View schedule"
            />

          </div>


          <button
            type="button"
            onClick={() =>
              navigate(
                "/weekly-schedule",
              )
            }
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-xs font-black text-black transition hover:bg-gray-200"
          >
            VIEW FULL SCHEDULE

            <ArrowRight
              size={14}
            />
          </button>

        </section>

      </main>


      <BottomNavigation />

    </div>
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
  ).padStart(
    2,
    "0",
  )}-${String(
    date.getDate(),
  ).padStart(
    2,
    "0",
  )}`
}


function calculateCurrentStreak(
  history,
) {
  if (
    !Array.isArray(
      history,
    ) ||
    history.length === 0
  ) {
    return 0
  }

  const completedDates = [
    ...new Set(
      history
        .filter(
          (
            workout,
          ) =>
            workout?.completed,
        )
        .map(
          (
            workout,
          ) =>
            toLocalDateKey(
              workout?.date,
            ),
        )
        .filter(Boolean),
    ),
  ].sort(
    (a, b) =>
      b.localeCompare(a),
  )

  if (
    completedDates.length ===
    0
  ) {
    return 0
  }

  let streak = 1

  let previousDate =
    new Date(
      `${completedDates[0]}T00:00:00`,
    )

  for (
    let index = 1;
    index <
    completedDates.length;
    index += 1
  ) {
    const currentDate =
      new Date(
        `${completedDates[index]}T00:00:00`,
      )

    const difference =
      Math.round(
        (previousDate -
          currentDate) /
          86400000,
      )

    if (
      difference !==
      1
    ) {
      break
    }

    streak += 1
    previousDate =
      currentDate
  }

  return streak
}


function formatWorkoutDuration(
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
  )}:${String(
    remainingSeconds,
  ).padStart(
    2,
    "0",
  )}`
}


function CompletedTodayWorkoutCard({
  workout,
  onView,
}) {
  return (
    <section className="rounded-3xl border border-lime-400/30 bg-lime-400/10 p-5">

      <span className="inline-flex items-center rounded-full bg-lime-400 px-3 py-1 text-[9px] font-black text-black">
        WORKOUT COMPLETED
      </span>

      <h2 className="mt-3 text-2xl font-black">
        {workout?.title ||
          "Today's Workout"}
      </h2>

      <p className="mt-2 text-sm leading-6 text-gray-400">
        You completed today's workout. Great work.
      </p>

      {workout?.durationSeconds !==
        null &&
        workout?.durationSeconds !==
          undefined && (
          <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 px-4 py-3">

            <p className="text-[9px] font-black uppercase tracking-wider text-gray-500">
              Actual workout time
            </p>

            <p className="mt-1 text-xl font-black text-white">
              {formatWorkoutDuration(
                workout.durationSeconds,
              )}
            </p>

          </div>
        )}


      <button
        type="button"
        onClick={onView}
        className="mt-5 flex w-full items-center justify-center rounded-2xl bg-white px-5 py-3 text-xs font-black text-black transition hover:bg-gray-200"
      >
        VIEW WORKOUT
      </button>

    </section>
  )
}


/*
|--------------------------------------------------------------------------
| Schedule Row
|--------------------------------------------------------------------------
*/

function ScheduleRow({
  day,
  workout,
}) {
  return (
    <div className="flex items-center justify-between rounded-2xl bg-white/5 px-4 py-3">

      <p className="w-10 text-xs font-black text-gray-500">
        {day}
      </p>

      <p className="flex-1 text-xs font-bold text-gray-400">
        {workout}
      </p>

      <ArrowRight
        size={14}
        className="text-gray-700"
      />

    </div>
  )
}


/*
|--------------------------------------------------------------------------
| Bottom Navigation
|--------------------------------------------------------------------------
*/

function BottomNavigation() {
  const navigate =
    useNavigate()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-white/10 bg-black/95 backdrop-blur-xl">

      <div className="mx-auto grid max-w-md grid-cols-3 px-5 py-3">

        <button
          type="button"
          onClick={() =>
            navigate(
              "/dashboard",
            )
          }
          className="flex flex-col items-center gap-1 text-yellow-400"
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
              "/progress",
            )
          }
          className="flex flex-col items-center gap-1 text-gray-600"
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
          <UserRound
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


export default Home