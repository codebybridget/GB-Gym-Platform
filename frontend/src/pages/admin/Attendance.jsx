import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Gift,
  Loader2,
  Users,
} from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"

import {
  getAdminWorkoutProgress,
  getMembers,
  getProgramAssignments,
} from "../../api/api.js"

import { useGym } from "../../context/GymContext"

const GIFT_ATTENDANCE_TARGET = 80

const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
]

function localDateKey(date = new Date()) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")

  return `${y}-${m}-${d}`
}

function normalizeDate(value) {
  if (!value) return ""

  const match = String(value).match(
    /^(\d{4})-(\d{2})-(\d{2})/,
  )

  return match
    ? `${match[1]}-${match[2]}-${match[3]}`
    : localDateKey(new Date(value))
}

function getMemberId(member) {
  return member?._id || member?.id || ""
}

function getMemberName(member) {
  return (
    member?.fullName ||
    `${member?.firstName || ""} ${
      member?.lastName || ""
    }`.trim() ||
    "Member"
  )
}

function getDaysInMonth(
  year,
  monthIndex,
) {
  return new Date(
    year,
    monthIndex + 1,
    0,
  ).getDate()
}

function MonthCalendar({
  year,
  monthIndex,
  attended,
}) {
  const days = getDaysInMonth(
    year,
    monthIndex,
  )

  const firstDay = new Date(
    year,
    monthIndex,
    1,
  ).getDay()

  const cells = []

  for (
    let i = 0;
    i < firstDay;
    i += 1
  ) {
    cells.push(null)
  }

  for (
    let day = 1;
    day <= days;
    day += 1
  ) {
    cells.push(day)
  }

  while (
    cells.length % 7 !== 0
  ) {
    cells.push(null)
  }

  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-black">
          {monthNames[monthIndex]}
        </h3>

        <CalendarDays
          size={15}
          className="text-lime-400"
        />
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-[8px] font-black text-gray-700">
        {[
          "S",
          "M",
          "T",
          "W",
          "T",
          "F",
          "S",
        ].map(
          (
            day,
            index,
          ) => (
            <div
              key={`${day}-${index}`}
            >
              {day}
            </div>
          ),
        )}
      </div>

      <div className="mt-2 grid grid-cols-7 gap-1">
        {cells.map(
          (
            day,
            index,
          ) => {
            if (!day) {
              return (
                <div
                  key={`blank-${index}`}
                  className="aspect-square"
                />
              )
            }

            const key = `${year}-${String(
              monthIndex + 1,
            ).padStart(
              2,
              "0",
            )}-${String(day).padStart(
              2,
              "0",
            )}`

            const done =
              attended.has(key)

            return (
              <div
                key={key}
                className={`flex aspect-square items-center justify-center rounded-md text-[9px] font-black ${
                  done
                    ? "bg-lime-400 text-black"
                    : "bg-black text-gray-600"
                }`}
              >
                {day}
              </div>
            )
          },
        )}
      </div>
    </section>
  )
}

export default function Attendance() {
  const navigate =
    useNavigate()

  const { gym } =
    useGym() || {}

  const gymName =
    gym?.name?.trim() || "Gym"

  const currentYear =
    new Date().getFullYear()

  const [year, setYear] =
    useState(currentYear)

  const [members, setMembers] =
    useState([])

  const [assignments, setAssignments] =
    useState([])

  const [
    completedByMember,
    setCompletedByMember,
  ] = useState({})

  const [
    selectedMemberId,
    setSelectedMemberId,
  ] = useState("")

  const [loading, setLoading] =
    useState(true)

  const [error, setError] =
    useState("")

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        setError("")

        const [
          memberResponse,
          assignmentResponse,
        ] = await Promise.all([
          getMembers({
            active: true,
          }),
          getProgramAssignments(),
        ])

        const loadedMembers =
          Array.isArray(
            memberResponse?.members,
          )
            ? memberResponse.members
            : []

        const loadedAssignments =
          Array.isArray(
            assignmentResponse?.assignments,
          )
            ? assignmentResponse.assignments
            : []

        setMembers(
          loadedMembers,
        )

        setAssignments(
          loadedAssignments,
        )

        if (
          loadedMembers.length &&
          !selectedMemberId
        ) {
          setSelectedMemberId(
            getMemberId(
              loadedMembers[0],
            ),
          )
        }
      } catch (err) {
        setError(
          err?.response?.data
            ?.message ||
            err?.message ||
            "Unable to load attendance data.",
        )
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  const yearAssignments =
    useMemo(
      () =>
        assignments.filter(
          (item) => {
            const date =
              normalizeDate(
                item?.workoutDate,
              )

            return (
              date.startsWith(
                `${year}-`,
              ) &&
              item?.status !==
                "cancelled" &&
              date <=
                localDateKey()
            )
          },
        ),
      [
        assignments,
        year,
      ],
    )

  const scheduledByMember =
    useMemo(() => {
      const map = new Map()

      yearAssignments.forEach(
        (assignment) => {
          const id = String(
            assignment?.member
              ?._id ||
              assignment?.member
                ?.id ||
              assignment?.member ||
              "",
          )

          const date =
            normalizeDate(
              assignment?.workoutDate,
            )

          if (!id || !date) {
            return
          }

          if (!map.has(id)) {
            map.set(
              id,
              new Set(),
            )
          }

          map.get(id).add(
            date,
          )
        },
      )

      return map
    }, [
      yearAssignments,
    ])

  useEffect(() => {
    const loadCompleted =
      async () => {
        if (
          !yearAssignments.length
        ) {
          setCompletedByMember(
            {},
          )

          return
        }

        const dates = [
          ...new Set(
            yearAssignments
              .map(
                (item) =>
                  normalizeDate(
                    item.workoutDate,
                  ),
              )
              .filter(Boolean),
          ),
        ]

        const result = {}

        try {
          for (
            let index = 0;
            index < dates.length;
            index += 8
          ) {
            const batch =
              dates.slice(
                index,
                index + 8,
              )

            const responses =
              await Promise.all(
                batch.map(
                  (date) =>
                    getAdminWorkoutProgress(
                      {
                        date,
                      },
                    ),
                ),
              )

            responses.forEach(
              (response) => {
                const items =
                  Array.isArray(
                    response?.progress,
                  )
                    ? response.progress
                    : []

                items.forEach(
                  (item) => {
                    if (
                      item?.workout
                        ?.status !==
                      "completed"
                    ) {
                      return
                    }

                    const id =
                      String(
                        getMemberId(
                          item?.member,
                        ),
                      )

                    if (!id) {
                      return
                    }

                    if (!result[id]) {
                      result[id] =
                        new Set()
                    }

                    result[
                      id
                    ].add(
                      normalizeDate(
                        item.workout
                          .date,
                      ),
                    )
                  },
                )
              },
            )
          }

          setCompletedByMember(
            result,
          )
        } catch (err) {
          setError(
            err?.response?.data
              ?.message ||
              err?.message ||
              "Unable to load completed workouts for attendance.",
          )
        }
      }

    loadCompleted()
  }, [
    yearAssignments,
  ])

  const rows = useMemo(
    () =>
      members.map(
        (member) => {
          const id = String(
            getMemberId(
              member,
            ),
          )

          const scheduled =
            scheduledByMember.get(
              id,
            ) ||
            new Set()

          const completed =
            completedByMember[
              id
            ] ||
            new Set()

          const attended =
            [
              ...completed,
            ].filter(
              (date) =>
                scheduled.has(
                  date,
                ),
            )

          const rate =
            scheduled.size
              ? Math.round(
                  (attended.length /
                    scheduled.size) *
                    100,
                )
              : 0

          return {
            member,
            id,
            scheduled,
            attended:
              new Set(
                attended,
              ),
            rate,
          }
        },
      ),
    [
      members,
      scheduledByMember,
      completedByMember,
    ],
  )

  const selected =
    rows.find(
      (row) =>
        row.id ===
        String(
          selectedMemberId,
        ),
    ) ||
    rows[0]

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-white">
        <div className="text-center">
          <Loader2
            size={30}
            className="mx-auto animate-spin text-lime-400"
          />

          <p className="mt-4 text-sm font-bold text-gray-500">
            Loading attendance...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black px-5 py-8 text-white">
      <main className="mx-auto max-w-7xl">
        <button
          type="button"
          onClick={() =>
            navigate(-1)
          }
          className="mb-6 inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-gray-500 hover:text-lime-400"
        >
          <ArrowLeft size={16} />

          Back
        </button>

        <header className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-lime-400">
                {gymName} Admin Attendance
              </p>

              <h1 className="mt-2 text-3xl font-black">
                Annual Attendance
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">
                Attendance is derived
                automatically from
                completed assigned
                workouts. No manual
                attendance action is
                used.
              </p>
            </div>

            <select
              value={year}
              onChange={(event) =>
                setYear(
                  Number(
                    event.target.value,
                  ),
                )
              }
              className="rounded-2xl border border-white/10 bg-black px-4 py-3 text-sm font-black text-white outline-none focus:border-lime-400"
            >
              {Array.from(
                {
                  length: 5,
                },
                (
                  _,
                  index,
                ) =>
                  currentYear -
                  index,
              ).map(
                (item) => (
                  <option
                    key={item}
                    value={item}
                  >
                    {item}
                  </option>
                ),
              )}
            </select>
          </div>
        </header>

        {error ? (
          <div className="mt-5 rounded-2xl border border-red-500/20 bg-red-500/5 p-4 text-sm font-bold text-red-300">
            {error}
          </div>
        ) : null}

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <Stat
            icon={
              <Users size={18} />
            }
            label="Members"
            value={
              rows.length
            }
          />

          <Stat
            icon={
              <CheckCircle2
                size={18}
              />
            }
            label="Members at 80%+"
            value={
              rows.filter(
                (row) =>
                  row.rate >=
                    GIFT_ATTENDANCE_TARGET &&
                  row.scheduled
                    .size >
                    0,
              ).length
            }
          />

          <Stat
            icon={
              <Gift size={18} />
            }
            label="Gift Target"
            value={`${GIFT_ATTENDANCE_TARGET}%`}
          />
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[340px_1fr]">
          <section className="rounded-3xl border border-white/10 bg-white/5 p-4">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-black uppercase tracking-wider text-gray-500">
                Members
              </h2>

              <span className="text-xs font-black text-gray-700">
                {rows.length}
              </span>
            </div>

            <div className="space-y-2">
              {rows.map(
                (row) => {
                  const selectedRow =
                    selected?.id ===
                    row.id

                  return (
                    <button
                      key={row.id}
                      type="button"
                      onClick={() =>
                        setSelectedMemberId(
                          row.id,
                        )
                      }
                      className={`w-full rounded-2xl border p-4 text-left ${
                        selectedRow
                          ? "border-lime-400/30 bg-lime-400/10"
                          : "border-white/10 bg-black"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-black">
                            {getMemberName(
                              row.member,
                            )}
                          </p>

                          <p className="mt-1 truncate text-[10px] text-gray-600">
                            {row.member
                              ?.email ||
                              ""}
                          </p>
                        </div>

                        <div className="text-right">
                          <p
                            className={`text-sm font-black ${
                              row.rate >=
                              GIFT_ATTENDANCE_TARGET
                                ? "text-lime-400"
                                : "text-white"
                            }`}
                          >
                            {row.rate}%
                          </p>

                          <p className="text-[8px] font-black uppercase text-gray-700">
                            attendance
                          </p>
                        </div>
                      </div>
                    </button>
                  )
                },
              )}
            </div>
          </section>

          {selected ? (
            <section className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-lime-400">
                    Member Attendance
                  </p>

                  <h2 className="mt-1 text-2xl font-black">
                    {getMemberName(
                      selected.member,
                    )}
                  </h2>
                </div>

                <div
                  className={`rounded-full px-4 py-2 text-[10px] font-black uppercase ${
                    selected.rate >=
                      GIFT_ATTENDANCE_TARGET &&
                    selected.scheduled
                      .size >
                      0
                      ? "bg-lime-400 text-black"
                      : "bg-black text-gray-500"
                  }`}
                >
                  {selected.rate >=
                    GIFT_ATTENDANCE_TARGET &&
                  selected.scheduled
                    .size >
                    0
                    ? "Gift Eligible"
                    : "Not Yet Eligible"}
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <Stat
                  icon={
                    <CheckCircle2
                      size={16}
                    />
                  }
                  label="Rate"
                  value={`${selected.rate}%`}
                />

                <Stat
                  icon={
                    <CalendarDays
                      size={16}
                    />
                  }
                  label="Attended"
                  value={
                    selected
                      .attended
                      .size
                  }
                />

                <Stat
                  icon={
                    <CalendarDays
                      size={16}
                    />
                  }
                  label="Scheduled"
                  value={
                    selected
                      .scheduled
                      .size
                  }
                />
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {monthNames.map(
                  (
                    _,
                    index,
                  ) => (
                    <MonthCalendar
                      key={index}
                      year={year}
                      monthIndex={
                        index
                      }
                      attended={
                        selected.attended
                      }
                    />
                  ),
                )}
              </div>
            </section>
          ) : (
            <section className="flex min-h-80 items-center justify-center rounded-3xl border border-white/10 bg-white/5 p-6 text-center">
              <div>
                <Users
                  size={28}
                  className="mx-auto text-gray-700"
                />

                <p className="mt-3 text-sm font-bold text-gray-500">
                  No members found.
                </p>
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  )
}

function Stat({
  icon,
  label,
  value,
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/50 p-4">
      <div className="flex items-center gap-2 text-lime-400">
        {icon}

        <span className="text-[9px] font-black uppercase tracking-widest text-gray-600">
          {label}
        </span>
      </div>

      <p className="mt-2 text-xl font-black">
        {value}
      </p>
    </div>
  )
}