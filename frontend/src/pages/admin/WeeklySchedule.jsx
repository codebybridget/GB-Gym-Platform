import {
  CalendarDays,
  Check,
  Clock3,
  Dumbbell,
  MapPin,
  RefreshCw,
  Save,
} from "lucide-react"
import { useEffect, useMemo, useState } from "react"

import {
  createSchedule,
  getWeeklySchedule,
  updateSchedule,
} from "../../api/api"

import { useGym } from "../../context/GymContext"

const workoutTypes = [
  {
    value: "Lower Body",
    label: "Lower Body",
  },
  {
    value: "Upper Body",
    label: "Upper Body",
  },
  {
    value: "CrossFit",
    label: "CrossFit",
  },
  {
    value: "Tabata",
    label: "Tabata",
  },
  {
    value: "Rest",
    label: "Rest Day",
  },
]

const dayOrder = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
]

const dayShortNames = {
  Monday: "MON",
  Tuesday: "TUE",
  Wednesday: "WED",
  Thursday: "THU",
  Friday: "FRI",
  Saturday: "SAT",
  Sunday: "SUN",
}

function createDefaultSchedule(
  gymName = "Gym",
) {
  return dayOrder.map(
    (day) => ({
      id: `new-${day}`,
      dayOfWeek: day,
      workoutType:
        day === "Friday"
          ? "CrossFit"
          : day === "Saturday"
            ? "Tabata"
            : day === "Sunday"
              ? "Rest"
              : day === "Tuesday" ||
                  day === "Thursday"
                ? "Upper Body"
                : "Lower Body",
      title:
        day === "Friday"
          ? "CrossFit"
          : day === "Saturday"
            ? "Saturday Tabata"
            : day === "Sunday"
              ? "Rest Day"
              : day === "Tuesday" ||
                  day === "Thursday"
                ? "Upper Body"
                : "Lower Body",
      description:
        day === "Friday"
          ? "General full-body CrossFit training."
          : day === "Saturday"
            ? "One-hour Tabata class."
            : day === "Sunday"
              ? "Recovery and rest."
              : day === "Tuesday" ||
                  day === "Thursday"
                ? "Upper body training."
                : "Lower body training.",
      startTime:
        day === "Saturday"
          ? "08:00"
          : day === "Sunday"
            ? ""
            : "06:00",
      endTime:
        day === "Saturday"
          ? "09:00"
          : day === "Sunday"
            ? ""
            : "07:00",
      location: gymName,
      capacity: 0,
      trainer: null,
      isActive: true,
      isNew: true,
    }),
  )
}

function WeeklyScheduleAdmin() {
  const { gym } = useGym() || {}

  const gymName =
    gym?.name?.trim() || "Gym"

  const defaultSchedule =
    useMemo(
      () =>
        createDefaultSchedule(
          gymName,
        ),
      [gymName],
    )

  const [schedule, setSchedule] =
    useState([])

  const [selectedDay, setSelectedDay] =
    useState("Monday")

  const [loading, setLoading] =
    useState(true)

  const [saving, setSaving] =
    useState(false)

  const [refreshing, setRefreshing] =
    useState(false)

  const [saved, setSaved] =
    useState(false)

  const [error, setError] =
    useState("")

  const loadSchedule = async ({
    showLoader = true,
  } = {}) => {
    try {
      if (showLoader) {
        setLoading(true)
      } else {
        setRefreshing(true)
      }

      setError("")

      const response =
        await getWeeklySchedule()

      const serverSchedule =
        extractScheduleList(
          response,
        )

      const normalized =
        normalizeSchedule(
          serverSchedule,
          gymName,
        )

      setSchedule(normalized)

      if (
        !normalized.some(
          (item) =>
            item.dayOfWeek ===
            selectedDay,
        )
      ) {
        setSelectedDay(
          normalized[0]
            ?.dayOfWeek ||
            "Monday",
        )
      }
    } catch (requestError) {
      console.error(
        "Unable to load admin schedule:",
        requestError,
      )

      setError(
        requestError?.response?.data
          ?.message ||
          requestError?.message ||
          "Unable to load the weekly schedule.",
      )

      setSchedule([])
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadSchedule()
  }, [])

  const selectedSchedule =
    useMemo(
      () =>
        schedule.find(
          (item) =>
            item.dayOfWeek ===
            selectedDay,
        ) ||
        defaultSchedule.find(
          (item) =>
            item.dayOfWeek ===
            selectedDay,
        ),
      [
        schedule,
        selectedDay,
        defaultSchedule,
      ],
    )

  const updateSelectedDay = (
    field,
    value,
  ) => {
    setSchedule((current) => {
      const exists =
        current.some(
          (item) =>
            item.dayOfWeek ===
            selectedDay,
        )

      if (!exists) {
        const fallback =
          defaultSchedule.find(
            (item) =>
              item.dayOfWeek ===
              selectedDay,
          )

        return [
          ...current,
          {
            ...fallback,
            [field]: value,
          },
        ].sort(
          sortByDay,
        )
      }

      return current.map(
        (item) =>
          item.dayOfWeek ===
          selectedDay
            ? {
                ...item,
                [field]: value,
              }
            : item,
      )
    })

    setSaved(false)
    setError("")
  }

  const handleSave = async () => {
    if (!selectedSchedule) {
      return
    }

    try {
      setSaving(true)
      setSaved(false)
      setError("")

      const payload = {
        dayOfWeek:
          selectedSchedule.dayOfWeek,

        workoutType:
          selectedSchedule.workoutType,

        title:
          selectedSchedule.title,

        startTime:
          selectedSchedule.startTime ||
          "",

        endTime:
          selectedSchedule.endTime ||
          "",

        description:
          selectedSchedule.description ||
          "",

        location:
          selectedSchedule.location ||
          gymName,

        capacity:
          Number(
            selectedSchedule.capacity ||
              0,
          ),

        trainer:
          selectedSchedule.trainer
            ? getTrainerId(
                selectedSchedule.trainer,
              )
            : null,

        isActive:
          selectedSchedule.isActive !==
          false,
      }

      let response

      if (
        selectedSchedule._id
      ) {
        response =
          await updateSchedule(
            selectedSchedule._id,
            payload,
          )
      } else {
        response =
          await createSchedule(
            payload,
          )
      }

      const savedSchedule =
        response?.schedule ||
        response?.data?.schedule

      if (savedSchedule) {
        setSchedule(
          (current) =>
            normalizeSchedule(
              [
                ...current.filter(
                  (item) =>
                    item.dayOfWeek !==
                    savedSchedule.dayOfWeek,
                ),
                savedSchedule,
              ],
              gymName,
            ),
        )
      }

      setSaved(true)

      setTimeout(() => {
        setSaved(false)
      }, 3000)
    } catch (saveError) {
      console.error(
        "Unable to save schedule:",
        saveError,
      )

      setError(
        saveError?.response?.data
          ?.message ||
          saveError?.message ||
          "Unable to save the schedule.",
      )
    } finally {
      setSaving(false)
    }
  }

  const handleRefresh =
    async () => {
      await loadSchedule({
        showLoader: false,
      })
    }

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white">
        <main className="mx-auto flex min-h-[60vh] max-w-6xl items-center justify-center px-5 py-8">
          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-5 py-4">
            <RefreshCw
              size={18}
              className="animate-spin text-lime-400"
            />

            <p className="text-sm font-bold text-gray-400">
              Loading weekly schedule...
            </p>
          </div>
        </main>
      </div>
    )
  }

  if (!selectedSchedule) {
    return (
      <div className="min-h-screen bg-black text-white">
        <main className="mx-auto max-w-6xl px-5 py-8">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-center">
            <CalendarDays
              size={32}
              className="mx-auto text-lime-400"
            />

            <h1 className="mt-4 text-2xl font-black">
              Weekly Schedule
            </h1>

            <p className="mt-2 text-sm text-gray-500">
              No schedule data is available.
            </p>

            <button
              type="button"
              onClick={() =>
                loadSchedule()
              }
              className="mt-5 rounded-2xl bg-lime-400 px-5 py-3 text-sm font-black text-black"
            >
              LOAD SCHEDULE
            </button>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <main className="mx-auto max-w-6xl px-5 py-8">

        {/* ======================================================= */}
        {/* PAGE HEADER */}
        {/* ======================================================= */}

        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-lime-400">
              <CalendarDays
                size={18}
              />

              <span className="text-xs font-black uppercase tracking-widest">
                Gym Control
              </span>
            </div>

            <h1 className="mt-2 text-3xl font-black">
              Weekly Schedule
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">
              Set the training schedule that
              members and trainers will see
              in the {gymName} app.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={
                handleRefresh
              }
              disabled={refreshing}
              className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-black text-white transition hover:bg-white/10 disabled:opacity-50"
            >
              <RefreshCw
                size={17}
                className={
                  refreshing
                    ? "animate-spin"
                    : ""
                }
              />

              REFRESH
            </button>

            <button
              type="button"
              onClick={
                handleSave
              }
              disabled={saving}
              className="flex items-center justify-center gap-2 rounded-2xl bg-lime-400 px-5 py-3 text-sm font-black text-black transition hover:bg-lime-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? (
                <>
                  <RefreshCw
                    size={17}
                    className="animate-spin"
                  />

                  SAVING
                </>
              ) : saved ? (
                <>
                  <Check size={17} />
                  SAVED
                </>
              ) : (
                <>
                  <Save size={17} />
                  SAVE SCHEDULE
                </>
              )}
            </button>
          </div>
        </div>

        {/* ======================================================= */}
        {/* ERROR */}
        {/* ======================================================= */}

        {error && (
          <div className="mt-5 rounded-2xl border border-red-400/20 bg-red-400/5 p-4">
            <p className="text-sm font-bold text-red-300">
              {error}
            </p>
          </div>
        )}

        {/* ======================================================= */}
        {/* MAIN */}
        {/* ======================================================= */}

        <div className="mt-8 grid gap-6 lg:grid-cols-[320px_1fr]">

          {/* ===================================================== */}
          {/* TRAINING DAYS */}
          {/* ===================================================== */}

          <section className="rounded-3xl border border-white/10 bg-white/5 p-4">
            <div className="mb-4">
              <p className="text-xs font-black uppercase tracking-wider text-gray-600">
                Training Days
              </p>

              <h2 className="mt-1 text-lg font-black">
                Weekly Plan
              </h2>
            </div>

            <div className="space-y-2">
              {dayOrder.map(
                (day) => {
                  const item =
                    schedule.find(
                      (entry) =>
                        entry.dayOfWeek ===
                        day,
                    ) ||
                    defaultSchedule.find(
                      (entry) =>
                        entry.dayOfWeek ===
                        day,
                    )

                  const active =
                    selectedDay ===
                    day

                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() =>
                        setSelectedDay(
                          day,
                        )
                      }
                      className={`flex w-full items-center gap-3 rounded-2xl border p-4 text-left transition ${
                        active
                          ? "border-yellow-400 bg-yellow-400/10"
                          : "border-white/10 bg-black hover:border-white/20"
                      }`}
                    >
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[10px] font-black ${
                          item.workoutType ===
                          "Rest"
                            ? "bg-white/5 text-gray-600"
                            : "bg-lime-400 text-black"
                        }`}
                      >
                        {
                          dayShortNames[
                            day
                          ]
                        }
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-black">
                          {item.title}
                        </p>

                        <p className="mt-1 truncate text-[10px] text-gray-600">
                          {item.startTime
                            ? `${formatTime(item.startTime)} – ${formatTime(item.endTime)}`
                            : "Recovery"}
                        </p>
                      </div>
                    </button>
                  )
                },
              )}
            </div>
          </section>

          {/* ===================================================== */}
          {/* EDIT WORKOUT */}
          {/* ===================================================== */}

          <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <div className="flex items-start gap-4 border-b border-white/10 pb-6">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-yellow-400 text-black">
                <Dumbbell size={24} />
              </div>

              <div>
                <p className="text-xs font-black uppercase tracking-wider text-gray-600">
                  {
                    selectedSchedule.dayOfWeek
                  }
                </p>

                <h2 className="mt-1 text-2xl font-black">
                  Edit Workout
                </h2>
              </div>
            </div>

            <div className="mt-6 grid gap-5 md:grid-cols-2">

              <Field
                label="Workout Name"
                value={
                  selectedSchedule.title
                }
                onChange={(value) =>
                  updateSelectedDay(
                    "title",
                    value,
                  )
                }
              />

              <div>
                <label className="mb-2 block text-xs font-black uppercase tracking-wider text-gray-500">
                  Workout Type
                </label>

                <select
                  value={
                    selectedSchedule.workoutType
                  }
                  onChange={(
                    event,
                  ) =>
                    updateSelectedDay(
                      "workoutType",
                      event.target.value,
                    )
                  }
                  className="w-full rounded-2xl border border-white/10 bg-black px-4 py-3.5 text-sm font-bold text-white outline-none focus:border-lime-400"
                >
                  {workoutTypes.map(
                    (type) => (
                      <option
                        key={
                          type.value
                        }
                        value={
                          type.value
                        }
                      >
                        {
                          type.label
                        }
                      </option>
                    ),
                  )}
                </select>
              </div>

              <Field
                label="Start Time"
                type="time"
                value={
                  selectedSchedule.startTime
                }
                onChange={(value) =>
                  updateSelectedDay(
                    "startTime",
                    value,
                  )
                }
              />

              <Field
                label="End Time"
                type="time"
                value={
                  selectedSchedule.endTime
                }
                onChange={(value) =>
                  updateSelectedDay(
                    "endTime",
                    value,
                  )
                }
              />

              <Field
                label="Location"
                value={
                  selectedSchedule.location
                }
                onChange={(value) =>
                  updateSelectedDay(
                    "location",
                    value,
                  )
                }
              />

              <Field
                label="Capacity"
                type="number"
                min="0"
                value={
                  selectedSchedule.capacity ||
                  0
                }
                onChange={(value) =>
                  updateSelectedDay(
                    "capacity",
                    value,
                  )
                }
              />
            </div>

            <div className="mt-5">
              <label className="mb-2 block text-xs font-black uppercase tracking-wider text-gray-500">
                Workout Description
              </label>

              <textarea
                rows={5}
                value={
                  selectedSchedule.description ||
                  ""
                }
                onChange={(event) =>
                  updateSelectedDay(
                    "description",
                    event.target.value,
                  )
                }
                className="w-full resize-none rounded-2xl border border-white/10 bg-black px-4 py-4 text-sm leading-6 text-white outline-none focus:border-lime-400"
              />
            </div>

            <div className="mt-6 grid gap-3 md:grid-cols-3">
              <InfoCard
                icon={CalendarDays}
                label="Day"
                value={
                  selectedSchedule.dayOfWeek
                }
              />

              <InfoCard
                icon={Clock3}
                label="Time"
                value={
                  selectedSchedule.startTime
                    ? `${formatTime(
                        selectedSchedule.startTime,
                      )} – ${formatTime(
                        selectedSchedule.endTime,
                      )}`
                    : "Rest"
                }
              />

              <InfoCard
                icon={MapPin}
                label="Location"
                value={
                  selectedSchedule.location ||
                  gymName
                }
              />
            </div>

            <div className="mt-6 rounded-2xl border border-lime-400/20 bg-lime-400/5 p-4">
              <p className="text-xs font-black text-lime-400">
                SHARED GYM SCHEDULE
              </p>

              <p className="mt-2 text-sm font-black">
                Members and trainers will
                see:
              </p>

              <p className="mt-1 text-xs leading-5 text-gray-500">
                {
                  selectedSchedule.dayOfWeek
                }{" "}
                ·{" "}
                {
                  selectedSchedule.title
                }{" "}
                ·{" "}
                {selectedSchedule.startTime
                  ? `${formatTime(
                      selectedSchedule.startTime,
                    )}${
                      selectedSchedule.endTime
                        ? ` – ${formatTime(
                            selectedSchedule.endTime,
                          )}`
                        : ""
                    }`
                  : "Rest Day"}
              </p>
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}

/* ================================================================== */
/* FIELD */
/* ================================================================== */

function Field({
  label,
  value,
  onChange,
  type = "text",
  min,
}) {
  return (
    <div>
      <label className="mb-2 block text-xs font-black uppercase tracking-wider text-gray-500">
        {label}
      </label>

      <input
        type={type}
        min={min}
        value={value ?? ""}
        onChange={(event) =>
          onChange(
            event.target.value,
          )
        }
        className="w-full rounded-2xl border border-white/10 bg-black px-4 py-3.5 text-sm font-bold text-white outline-none focus:border-lime-400"
      />
    </div>
  )
}

/* ================================================================== */
/* INFO CARD */
/* ================================================================== */

function InfoCard({
  icon: Icon,
  label,
  value,
}) {
  return (
    <div className="rounded-2xl bg-black p-4">
      <Icon
        size={16}
        className="text-yellow-400"
      />

      <p className="mt-3 text-[10px] font-black uppercase tracking-wider text-gray-600">
        {label}
      </p>

      <p className="mt-1 text-xs font-black">
        {value}
      </p>
    </div>
  )
}

/* ================================================================== */
/* API RESPONSE */
/* ================================================================== */

function extractScheduleList(
  response,
) {
  if (Array.isArray(response)) {
    return response
  }

  if (
    Array.isArray(
      response?.schedules,
    )
  ) {
    return response.schedules
  }

  if (
    Array.isArray(
      response?.schedule,
    )
  ) {
    return response.schedule
  }

  if (
    Array.isArray(
      response?.data?.schedules,
    )
  ) {
    return response.data.schedules
  }

  if (
    Array.isArray(
      response?.data?.schedule,
    )
  ) {
    return response.data.schedule
  }

  return []
}

/* ================================================================== */
/* NORMALIZE */
/* ================================================================== */

function normalizeSchedule(
  items,
  gymName = "Gym",
) {
  const incoming = Array.isArray(
    items,
  )
    ? items
    : []

  const normalized =
    incoming
      .map((item) => {
        if (!item?.dayOfWeek) {
          return null
        }

        return {
          ...item,

          dayOfWeek:
            item.dayOfWeek,

          workoutType:
            normalizeWorkoutType(
              item.workoutType,
            ),

          title:
            item.title ||
            getDefaultTitle(
              item.dayOfWeek,
            ),

          description:
            item.description ||
            "",

          startTime:
            item.startTime ||
            "",

          endTime:
            item.endTime ||
            "",

          location:
            item.location ||
            gymName,

          capacity:
            Number(
              item.capacity ||
                0,
            ),

          trainer:
            item.trainer ||
            null,

          isActive:
            item.isActive !==
            false,

          shortDay:
            dayShortNames[
              item.dayOfWeek
            ],
        }
      })
      .filter(Boolean)

  return normalized.sort(
    sortByDay,
  )
}

/* ================================================================== */
/* SORT */
/* ================================================================== */

function sortByDay(
  first,
  second,
) {
  return (
    (dayOrder.indexOf(
      first.dayOfWeek,
    ) -
      dayOrder.indexOf(
        second.dayOfWeek,
      ))
  )
}

/* ================================================================== */
/* WORKOUT TYPE */
/* ================================================================== */

function normalizeWorkoutType(
  value,
) {
  const text =
    String(
      value || "",
    ).toLowerCase()

  if (
    text.includes(
      "lower",
    )
  ) {
    return "Lower Body"
  }

  if (
    text.includes(
      "upper",
    )
  ) {
    return "Upper Body"
  }

  if (
    text.includes(
      "cross",
    )
  ) {
    return "CrossFit"
  }

  if (
    text.includes(
      "tabata",
    )
  ) {
    return "Tabata"
  }

  if (
    text.includes(
      "rest",
    )
  ) {
    return "Rest"
  }

  return "Lower Body"
}

/* ================================================================== */
/* DEFAULT TITLE */
/* ================================================================== */

function getDefaultTitle(
  day,
) {
  switch (day) {
    case "Tuesday":
    case "Thursday":
      return "Upper Body"

    case "Friday":
      return "CrossFit"

    case "Saturday":
      return "Saturday Tabata"

    case "Sunday":
      return "Rest Day"

    default:
      return "Lower Body"
  }
}

/* ================================================================== */
/* TRAINER ID */
/* ================================================================== */

function getTrainerId(
  trainer,
) {
  if (!trainer) {
    return null
  }

  if (
    typeof trainer ===
    "string"
  ) {
    return trainer
  }

  return (
    trainer._id ||
    trainer.id ||
    null
  )
}

/* ================================================================== */
/* TIME */
/* ================================================================== */

function formatTime(
  value,
) {
  if (!value) {
    return ""
  }

  const text =
    String(value)

  const match =
    text.match(
      /^(\d{1,2}):(\d{2})/,
    )

  if (!match) {
    return text
  }

  let hour =
    Number(match[1])

  const minute =
    match[2]

  const suffix =
    hour >= 12
      ? "PM"
      : "AM"

  hour =
    hour % 12 || 12

  return `${hour}:${minute} ${suffix}`
}

export default WeeklyScheduleAdmin