import {
  Activity,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Dumbbell,
  Flame,
  Loader2,
  RefreshCw,
  Search,
  TrendingUp,
  UserRound,
  X,
} from "lucide-react"
import { useEffect, useMemo, useState } from "react"

import {
  getAdminMemberWorkoutProgress,
  getAdminWorkoutProgress,
  getMembers,
} from "../../api/api.js"

import { useGym } from "../../context/GymContext"

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "completed", label: "Completed" },
  { value: "in_progress", label: "In Progress" },
  { value: "not_started", label: "Not Started" },
]

const statusMeta = {
  completed: {
    label: "Completed",
    className:
      "border-lime-400/20 bg-lime-400/10 text-lime-400",
    dot: "bg-lime-400",
  },
  in_progress: {
    label: "In Progress",
    className:
      "border-yellow-400/20 bg-yellow-400/10 text-yellow-400",
    dot: "bg-yellow-400",
  },
  not_started: {
    label: "Not Started",
    className:
      "border-white/10 bg-white/5 text-gray-400",
    dot: "bg-gray-500",
  },
}

function formatDate(date) {
  if (!date) return "—"

  const value = new Date(
    `${date}T00:00:00`,
  )

  if (Number.isNaN(value.getTime())) {
    return date
  }

  return value.toLocaleDateString(
    "en-NG",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    },
  )
}

function memberName(member) {
  if (!member) return "Unknown member"

  return (
    member.fullName ||
    `${member.firstName || ""} ${
      member.lastName || ""
    }`.trim() ||
    member.name ||
    member.email ||
    "Unknown member"
  )
}

function initials(member) {
  return memberName(member)
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

function StatCard({
  icon: Icon,
  label,
  value,
  detail,
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-yellow-400 text-black">
          <Icon size={20} />
        </div>

        <TrendingUp
          size={17}
          className="text-gray-700"
        />
      </div>

      <p className="mt-5 text-xs font-black uppercase tracking-wider text-gray-600">
        {label}
      </p>

      <p className="mt-1 text-3xl font-black">
        {value}
      </p>

      {detail ? (
        <p className="mt-1 text-xs text-gray-600">
          {detail}
        </p>
      ) : null}
    </div>
  )
}

function ProgressBar({ value }) {
  const percent = Math.max(
    0,
    Math.min(
      100,
      Number(value) || 0,
    ),
  )

  return (
    <div className="h-2 overflow-hidden rounded-full bg-white/10">
      <div
        className="h-full rounded-full bg-lime-400 transition-all"
        style={{
          width: `${percent}%`,
        }}
      />
    </div>
  )
}

function StatusBadge({ status }) {
  const meta =
    statusMeta[status] ||
    statusMeta.not_started

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${meta.className}`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${meta.dot}`}
      />

      {meta.label}
    </span>
  )
}

function Progress() {
  const { gym } = useGym() || {}

  const gymName =
    gym?.name?.trim() || "Gym"

  const today = new Date()

  const localToday =
    `${today.getFullYear()}-${String(
      today.getMonth() + 1,
    ).padStart(
      2,
      "0",
    )}-${String(
      today.getDate(),
    ).padStart(
      2,
      "0",
    )}`

  const [date, setDate] =
    useState(localToday)

  const [status, setStatus] =
    useState("")

  const [search, setSearch] =
    useState("")

  const [members, setMembers] =
    useState([])

  const [progress, setProgress] =
    useState([])

  const [
    selectedMember,
    setSelectedMember,
  ] = useState(null)

  const [loading, setLoading] =
    useState(true)

  const [
    detailLoading,
    setDetailLoading,
  ] = useState(false)

  const [error, setError] =
    useState("")

  const [
    detailError,
    setDetailError,
  ] = useState("")

  const loadProgress =
    async () => {
      try {
        setLoading(true)
        setError("")

        const [
          membersResponse,
          progressResponse,
        ] = await Promise.all([
          getMembers(),

          getAdminWorkoutProgress({
            date,

            ...(status
              ? { status }
              : {}),
          }),
        ])

        setMembers(
          membersResponse?.members ||
            [],
        )

        setProgress(
          progressResponse?.progress ||
            [],
        )
      } catch (err) {
        console.error(
          "Load admin progress error:",
          err,
        )

        setError(
          err?.response?.data
            ?.message ||
            err?.message ||
            "Unable to load workout progress.",
        )
      } finally {
        setLoading(false)
      }
    }

  useEffect(() => {
    loadProgress()
  }, [date, status])

  const memberMap =
    useMemo(() => {
      const map = new Map()

      members.forEach(
        (member) => {
          map.set(
            String(
              member._id ||
                member.id,
            ),
            member,
          )
        },
      )

      return map
    }, [members])

  const filteredProgress =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase()

      if (!query) {
        return progress
      }

      return progress.filter(
        (item) => {
          const member =
            item.member ||
            memberMap.get(
              String(
                item.member?._id,
              ),
            )

          const name =
            memberName(
              member,
            ).toLowerCase()

          const email =
            String(
              member?.email ||
                "",
            ).toLowerCase()

          const program =
            String(
              item.program
                ?.name ||
                "",
            ).toLowerCase()

          return (
            name.includes(
              query,
            ) ||
            email.includes(
              query,
            ) ||
            program.includes(
              query,
            )
          )
        },
      )
    }, [
      progress,
      search,
      memberMap,
    ])

  const summary =
    useMemo(() => {
      const total =
        progress.length

      const completed =
        progress.filter(
          (item) =>
            item.workout
              ?.status ===
            "completed",
        ).length

      const inProgress =
        progress.filter(
          (item) =>
            item.workout
              ?.status ===
            "in_progress",
        ).length

      const notStarted =
        progress.filter(
          (item) =>
            item.workout
              ?.status ===
            "not_started",
        ).length

      const average =
        total > 0
          ? Math.round(
              progress.reduce(
                (
                  sum,
                  item,
                ) =>
                  sum +
                  Number(
                    item.workout
                      ?.progressPercent ||
                      0,
                  ),
                0,
              ) / total,
            )
          : 0

      const calories =
        progress.reduce(
          (
            sum,
            item,
          ) =>
            sum +
            Number(
              item.workout
                ?.caloriesBurned ||
                0,
            ),
          0,
        )

      return {
        total,
        completed,
        inProgress,
        notStarted,
        average,
        calories,
      }
    }, [progress])

  const openMember =
    async (item) => {
      const id =
        item?.member?._id ||
        item?.member?.id

      if (!id) return

      try {
        setSelectedMember({
          ...item,
          member: item.member,
        })

        setDetailLoading(true)
        setDetailError("")

        const response =
          await getAdminMemberWorkoutProgress(
            id,
            {
              date,

              assignmentId:
                item?.assignment
                  ?.id ||
                item?.assignment
                  ?._id ||
                "",

              programId:
                item?.program
                  ?._id ||
                item?.program
                  ?.id ||
                "",
            },
          )

        setSelectedMember(
          response?.progress?.[0] ||
            response ||
            item,
        )
      } catch (err) {
        console.error(
          "Load member progress error:",
          err,
        )

        setDetailError(
          err?.response?.data
            ?.message ||
            err?.message ||
            "Unable to load this member's workout details.",
        )
      } finally {
        setDetailLoading(
          false,
        )
      }
    }

  const closeMember =
    () => {
      setSelectedMember(
        null,
      )

      setDetailError("")
    }

  return (
    <div className="min-h-screen bg-black px-4 py-6 text-white sm:px-6 lg:px-8">
      <main className="mx-auto max-w-7xl">

        <header className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <div className="flex items-center gap-2 text-lime-400">
              <Activity size={18} />

              <span className="text-xs font-black uppercase tracking-widest">
                {gymName} Admin
              </span>
            </div>

            <h1 className="mt-2 text-3xl font-black sm:text-4xl">
              Progress
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">
              Monitor member workout completion, set progress and training
              performance for a selected day.
            </p>
          </div>

          <button
            type="button"
            onClick={
              loadProgress
            }
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-black transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw
              size={16}
              className={
                loading
                  ? "animate-spin"
                  : ""
              }
            />

            Refresh
          </button>
        </header>

        <section className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <StatCard
            icon={UserRound}
            label="Members"
            value={
              summary.total
            }
            detail={`Progress records for ${formatDate(
              date,
            )}`}
          />

          <StatCard
            icon={CheckCircle2}
            label="Completed"
            value={
              summary.completed
            }
            detail="Finished workouts"
          />

          <StatCard
            icon={Clock3}
            label="In Progress"
            value={
              summary.inProgress
            }
            detail="Members currently training"
          />

          <StatCard
            icon={Dumbbell}
            label="Not Started"
            value={
              summary.notStarted
            }
            detail="Assigned but untouched"
          />

          <StatCard
            icon={Flame}
            label="Calories"
            value={summary.calories.toLocaleString()}
            detail="Recorded for the selected day"
          />
        </section>

        <section className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-5">
          <div className="grid gap-4 lg:grid-cols-[190px_190px_1fr]">

            <div>
              <label className="mb-2 block text-xs font-black uppercase tracking-wider text-gray-600">
                Workout date
              </label>

              <div className="relative">
                <CalendarDays
                  size={16}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-600"
                />

                <input
                  type="date"
                  value={date}
                  onChange={(
                    event,
                  ) =>
                    setDate(
                      event.target
                        .value,
                    )
                  }
                  className="w-full rounded-2xl border border-white/10 bg-black py-3 pl-11 pr-4 text-sm font-bold text-white outline-none focus:border-lime-400"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-xs font-black uppercase tracking-wider text-gray-600">
                Status
              </label>

              <select
                value={status}
                onChange={(
                  event,
                ) =>
                  setStatus(
                    event.target
                      .value,
                  )
                }
                className="w-full rounded-2xl border border-white/10 bg-black px-4 py-3 text-sm font-bold text-white outline-none focus:border-lime-400"
              >
                {STATUS_OPTIONS.map(
                  (
                    option,
                  ) => (
                    <option
                      key={
                        option.value
                      }
                      value={
                        option.value
                      }
                    >
                      {
                        option.label
                      }
                    </option>
                  ),
                )}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-xs font-black uppercase tracking-wider text-gray-600">
                Search member
              </label>

              <div className="relative">
                <Search
                  size={16}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-600"
                />

                <input
                  value={search}
                  onChange={(
                    event,
                  ) =>
                    setSearch(
                      event.target
                        .value,
                    )
                  }
                  placeholder="Search by name, email or program..."
                  className="w-full rounded-2xl border border-white/10 bg-black py-3 pl-11 pr-4 text-sm font-bold text-white outline-none placeholder:text-gray-700 focus:border-lime-400"
                />
              </div>
            </div>
          </div>

          <div className="mt-5 flex items-center justify-between border-t border-white/5 pt-4">
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-gray-600">
                Average completion
              </p>

              <p className="mt-1 text-xl font-black">
                {summary.average}%
              </p>
            </div>

            <div className="hidden w-56 sm:block">
              <ProgressBar
                value={
                  summary.average
                }
              />
            </div>
          </div>
        </section>

        {error ? (
          <div className="mt-6 rounded-3xl border border-red-400/20 bg-red-400/5 p-5 text-sm text-red-300">
            {error}
          </div>
        ) : null}

        <section className="mt-6 overflow-hidden rounded-3xl border border-white/10 bg-white/5">
          <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-gray-600">
                Daily member progress
              </p>

              <h2 className="mt-1 text-lg font-black">
                {formatDate(
                  date,
                )}
              </h2>
            </div>

            <span className="rounded-full bg-white/5 px-3 py-1.5 text-xs font-black text-gray-500">
              {
                filteredProgress.length
              }{" "}
              record
              {filteredProgress.length ===
              1
                ? ""
                : "s"}
            </span>
          </div>

          {loading ? (
            <div className="flex min-h-64 items-center justify-center">
              <Loader2
                size={24}
                className="animate-spin text-lime-400"
              />
            </div>
          ) : filteredProgress.length ===
            0 ? (
            <div className="flex min-h-64 flex-col items-center justify-center px-6 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5">
                <Dumbbell
                  size={22}
                  className="text-gray-600"
                />
              </div>

              <h3 className="mt-4 text-lg font-black">
                No progress records
              </h3>

              <p className="mt-1 max-w-md text-sm leading-6 text-gray-600">
                There are no workout progress records matching the selected
                date and filters.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {filteredProgress.map(
                (
                  item,
                  index,
                ) => {
                  const member =
                    item.member ||
                    memberMap.get(
                      String(
                        item.member
                          ?._id,
                      ),
                    )

                  const workout =
                    item.workout ||
                    {}

                  const program =
                    item.program ||
                    {}

                  const progressPercent =
                    Number(
                      workout.progressPercent ||
                        0,
                    )

                  return (
                    <button
                      type="button"
                      key={
                        item.assignment
                          ?.id ||
                        item.member
                          ?._id ||
                        index
                      }
                      onClick={() =>
                        openMember(
                          item,
                        )
                      }
                      className="flex w-full flex-col gap-4 px-5 py-5 text-left transition hover:bg-white/[0.03] lg:flex-row lg:items-center"
                    >
                      <div className="flex min-w-0 flex-1 items-center gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-yellow-400 text-xs font-black text-black">
                          {initials(
                            member,
                          )}
                        </div>

                        <div className="min-w-0">
                          <p className="truncate text-sm font-black">
                            {memberName(
                              member,
                            )}
                          </p>

                          <p className="mt-1 truncate text-xs text-gray-600">
                            {member?.email ||
                              "Member"}
                          </p>
                        </div>
                      </div>

                      <div className="min-w-0 lg:w-64">
                        <p className="truncate text-sm font-bold">
                          {program.name ||
                            "Workout Program"}
                        </p>

                        <p className="mt-1 text-xs text-gray-600">
                          {program.workoutType ||
                            "Training"}
                        </p>
                      </div>

                      <div className="w-full lg:w-52">
                        <div className="mb-2 flex items-center justify-between">
                          <span className="text-[10px] font-black uppercase tracking-wider text-gray-600">
                            Completion
                          </span>

                          <span className="text-xs font-black">
                            {
                              progressPercent
                            }
                            %
                          </span>
                        </div>

                        <ProgressBar
                          value={
                            progressPercent
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between gap-4 lg:w-40 lg:justify-end">
                        <StatusBadge
                          status={
                            workout.status
                          }
                        />

                        <ChevronRight
                          size={18}
                          className="text-gray-700"
                        />
                      </div>
                    </button>
                  )
                },
              )}
            </div>
          )}
        </section>
      </main>

      {selectedMember ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-5">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-t-3xl border border-white/10 bg-[#0a0a0a] shadow-2xl sm:rounded-3xl">

            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-[#0a0a0a]/95 px-5 py-4 backdrop-blur">
              <div>
                <p className="text-xs font-black uppercase tracking-wider text-lime-400">
                  Member progress
                </p>

                <h2 className="mt-1 text-lg font-black">
                  {memberName(
                    selectedMember.member,
                  )}
                </h2>
              </div>

              <button
                type="button"
                onClick={
                  closeMember
                }
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-gray-400 transition hover:bg-white/10 hover:text-white"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            {detailLoading ? (
              <div className="flex min-h-72 items-center justify-center">
                <Loader2
                  size={24}
                  className="animate-spin text-lime-400"
                />
              </div>
            ) : detailError ? (
              <div className="m-5 rounded-2xl border border-red-400/20 bg-red-400/5 p-4 text-sm text-red-300">
                {detailError}
              </div>
            ) : (
              <div className="space-y-5 p-5">

                <div className="grid gap-3 sm:grid-cols-3">

                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-[10px] font-black uppercase tracking-wider text-gray-600">
                      Status
                    </p>

                    <div className="mt-2">
                      <StatusBadge
                        status={
                          selectedMember
                            .workout
                            ?.status
                        }
                      />
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-[10px] font-black uppercase tracking-wider text-gray-600">
                      Sets
                    </p>

                    <p className="mt-1 text-xl font-black">
                      {selectedMember
                        .workout
                        ?.completedSets ||
                        0}

                      <span className="text-sm text-gray-600">
                        {" "}
                        /{" "}
                        {selectedMember
                          .workout
                          ?.totalSets ||
                          0}
                      </span>
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-[10px] font-black uppercase tracking-wider text-gray-600">
                      Calories
                    </p>

                    <p className="mt-1 text-xl font-black">
                      {Number(
                        selectedMember
                          .workout
                          ?.caloriesBurned ||
                          0,
                      ).toLocaleString()}
                    </p>
                  </div>

                </div>

                <div className="rounded-3xl border border-white/10 bg-white/5 p-5">

                  <div className="flex items-end justify-between gap-4">
                    <div>
                      <p className="text-xs font-black uppercase tracking-wider text-gray-600">
                        Workout
                      </p>

                      <h3 className="mt-1 text-xl font-black">
                        {selectedMember
                          .program
                          ?.name ||
                          "Workout Program"}
                      </h3>

                      <p className="mt-1 text-sm text-gray-600">
                        {selectedMember
                          .program
                          ?.workoutType ||
                          "Training"}{" "}
                        ·{" "}
                        {formatDate(
                          selectedMember
                            .workout
                            ?.date,
                        )}
                      </p>
                    </div>

                    <p className="text-2xl font-black text-lime-400">
                      {selectedMember
                        .workout
                        ?.progressPercent ||
                        0}
                      %
                    </p>
                  </div>

                  <div className="mt-4">
                    <ProgressBar
                      value={
                        selectedMember
                          .workout
                          ?.progressPercent ||
                        0
                      }
                    />
                  </div>
                </div>

                <div>
                  <p className="text-xs font-black uppercase tracking-wider text-gray-600">
                    Exercise details
                  </p>

                  <div className="mt-3 space-y-2">
                    {(
                      selectedMember
                        .workout
                        ?.exercises ||
                      []
                    ).map(
                      (
                        exercise,
                        index,
                      ) => {
                        const completedSets =
                          exercise?.sets?.filter(
                            (
                              set,
                            ) =>
                              set.completed,
                          ).length ||
                          0

                        const totalSets =
                          exercise
                            ?.sets
                            ?.length ||
                          0

                        const name =
                          exercise
                            ?.exercise
                            ?.name ||
                          exercise?.name ||
                          `Exercise ${
                            index +
                            1
                          }`

                        return (
                          <div
                            key={
                              exercise?._id ||
                              exercise
                                ?.exercise
                                ?._id ||
                              index
                            }
                            className="rounded-2xl border border-white/10 bg-black p-4"
                          >
                            <div className="flex items-center justify-between gap-4">
                              <div className="min-w-0">
                                <p className="truncate text-sm font-black">
                                  {
                                    name
                                  }
                                </p>

                                <p className="mt-1 text-xs text-gray-600">
                                  {
                                    completedSets
                                  }{" "}
                                  of{" "}
                                  {
                                    totalSets
                                  }{" "}
                                  sets completed
                                </p>
                              </div>

                              <span className="shrink-0 text-sm font-black text-lime-400">
                                {totalSets >
                                0
                                  ? Math.round(
                                      (completedSets /
                                        totalSets) *
                                        100,
                                    )
                                  : 0}
                                %
                              </span>
                            </div>

                            <div className="mt-3">
                              <ProgressBar
                                value={
                                  totalSets >
                                  0
                                    ? (completedSets /
                                        totalSets) *
                                      100
                                    : 0
                                }
                              />
                            </div>
                          </div>
                        )
                      },
                    )}

                    {selectedMember
                      .workout
                      ?.exercises
                      ?.length ===
                    0 ? (
                      <div className="rounded-2xl border border-white/10 bg-black p-5 text-sm text-gray-600">
                        No exercise log has been recorded yet.
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default Progress