import { useState } from "react"
import {
  CalendarDays,
  Check,
  ChevronDown,
  Clock3,
  Dumbbell,
  Save,
} from "lucide-react"

import workoutSchedule from "../../data/workoutSchedule"
import { workoutPrograms } from "../../data/workoutData"
import { useGym } from "../../context/GymContext.jsx"

const days = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
]

const dayLabels = {
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
  sunday: "Sunday",
}

function WorkoutSchedule() {
  const { gym } = useGym() || {}

  const gymName =
    gym?.name?.trim() || "Gym"

  const [schedule, setSchedule] =
    useState(workoutSchedule)

  const [selectedDay, setSelectedDay] =
    useState("monday")

  const [saved, setSaved] =
    useState(false)

  const selectedSchedule =
    schedule[selectedDay]

  const availablePrograms =
    Object.values(workoutPrograms)

  const selectedProgram =
    selectedSchedule.workoutId
      ? workoutPrograms[
          selectedSchedule.workoutId
        ]
      : null

  const handleWorkoutChange = (event) => {
    const workoutId =
      event.target.value

    const selectedWorkout =
      workoutPrograms[workoutId]

    setSchedule((current) => ({
      ...current,

      [selectedDay]: {
        ...current[selectedDay],

        workoutId,

        workoutName:
          selectedWorkout?.name ||
          "Rest Day",

        category:
          selectedWorkout?.category ||
          "Rest",

        type:
          workoutId === "crossfit" ||
          workoutId === "tabata"
            ? "class"
            : "workout",
      },
    }))

    setSaved(false)
  }

  const handleTimeChange = (
    field,
    value,
  ) => {
    setSchedule((current) => ({
      ...current,

      [selectedDay]: {
        ...current[selectedDay],
        [field]: value,
      },
    }))

    setSaved(false)
  }

  const saveSchedule = () => {
    setSaved(true)
  }

  return (
    <div className="min-h-screen bg-black pb-10 text-white">
      <header className="border-b border-white/10">
        <div className="mx-auto max-w-5xl px-5 py-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-yellow-400 text-black">
              <CalendarDays size={21} />
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-lime-400">
                {gymName} Admin
              </p>

              <h1 className="text-2xl font-black">
                Workout Schedule
              </h1>
            </div>
          </div>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-500">
            Manage the weekly training schedule.
            Members will see the workout assigned
            to them for the current day.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-5 py-6">
        <section className="grid gap-3 md:grid-cols-7">
          {days.map((day) => {
            const daySchedule =
              schedule[day]

            const isSelected =
              selectedDay === day

            return (
              <button
                key={day}
                type="button"
                onClick={() => {
                  setSelectedDay(day)
                  setSaved(false)
                }}
                className={`rounded-2xl border p-4 text-left transition ${
                  isSelected
                    ? "border-yellow-400 bg-yellow-400 text-black"
                    : "border-white/10 bg-white/5 hover:border-white/20"
                }`}
              >
                <p
                  className={`text-xs font-black uppercase ${
                    isSelected
                      ? "text-black/60"
                      : "text-gray-500"
                  }`}
                >
                  {dayLabels[day]}
                </p>

                <p className="mt-2 text-sm font-black">
                  {daySchedule.workoutName}
                </p>

                {daySchedule.startTime && (
                  <p
                    className={`mt-1 text-xs ${
                      isSelected
                        ? "text-black/60"
                        : "text-gray-600"
                    }`}
                  >
                    {daySchedule.startTime} –{" "}
                    {daySchedule.endTime}
                  </p>
                )}
              </button>
            )
          })}
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-lime-400">
                  {dayLabels[selectedDay]}
                </p>

                <h2 className="mt-1 text-2xl font-black">
                  Configure workout
                </h2>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/5">
                <Dumbbell
                  size={20}
                  className="text-yellow-400"
                />
              </div>
            </div>

            <div className="mt-6">
              <label
                htmlFor="workout"
                className="mb-2 block text-xs font-bold text-gray-400"
              >
                Workout / Class
              </label>

              <div className="relative">
                <select
                  id="workout"
                  value={
                    selectedSchedule.workoutId ||
                    ""
                  }
                  onChange={
                    handleWorkoutChange
                  }
                  className="w-full appearance-none rounded-2xl border border-white/10 bg-black px-4 py-4 pr-12 text-sm font-bold text-white outline-none transition focus:border-yellow-400"
                >
                  <option
                    value=""
                    className="bg-black"
                  >
                    Rest Day
                  </option>

                  {availablePrograms.map(
                    (program) => (
                      <option
                        key={program.id}
                        value={program.id}
                        className="bg-black"
                      >
                        {program.name}
                      </option>
                    ),
                  )}
                </select>

                <ChevronDown
                  size={18}
                  className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-500"
                />
              </div>
            </div>

            {selectedSchedule.workoutId ===
              "tabata" && (
              <div className="mt-5 rounded-2xl border border-yellow-400/20 bg-yellow-400/5 p-4">
                <div className="flex items-start gap-3">
                  <Clock3
                    size={19}
                    className="mt-0.5 shrink-0 text-yellow-400"
                  />

                  <div>
                    <p className="text-sm font-bold">
                      Tabata class
                    </p>

                    <p className="mt-1 text-xs leading-5 text-gray-500">
                      Saturday Tabata is
                      scheduled for one hour.
                      Set the class start and
                      end time below.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {selectedSchedule.workoutId ===
              "crossfit" && (
              <div className="mt-5 rounded-2xl border border-lime-400/20 bg-lime-400/5 p-4">
                <p className="text-sm font-bold">
                  CrossFit — General Body
                </p>

                <p className="mt-1 text-xs leading-5 text-gray-500">
                  Friday is treated as a
                  general-body CrossFit session.
                </p>
              </div>
            )}

            {selectedSchedule.workoutId && (
              <div className="mt-6 grid grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="startTime"
                    className="mb-2 block text-xs font-bold text-gray-400"
                  >
                    Start time
                  </label>

                  <input
                    id="startTime"
                    type="time"
                    value={
                      selectedSchedule.startTime ||
                      ""
                    }
                    onChange={(event) =>
                      handleTimeChange(
                        "startTime",
                        event.target.value,
                      )
                    }
                    className="w-full rounded-2xl border border-white/10 bg-black px-4 py-3 text-sm font-bold text-white outline-none focus:border-yellow-400"
                  />
                </div>

                <div>
                  <label
                    htmlFor="endTime"
                    className="mb-2 block text-xs font-bold text-gray-400"
                  >
                    End time
                  </label>

                  <input
                    id="endTime"
                    type="time"
                    value={
                      selectedSchedule.endTime ||
                      ""
                    }
                    onChange={(event) =>
                      handleTimeChange(
                        "endTime",
                        event.target.value,
                      )
                    }
                    className="w-full rounded-2xl border border-white/10 bg-black px-4 py-3 text-sm font-bold text-white outline-none focus:border-yellow-400"
                  />
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={saveSchedule}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-yellow-400 px-5 py-4 text-sm font-black text-black transition hover:bg-yellow-300"
            >
              <Save size={18} />
              SAVE SCHEDULE
            </button>

            {saved && (
              <div className="mt-3 flex items-center justify-center gap-2 rounded-2xl bg-lime-400/10 px-4 py-3 text-xs font-bold text-lime-400">
                <Check size={16} />
                Schedule saved successfully.
              </div>
            )}
          </div>

          <aside className="rounded-3xl bg-white p-6 text-black">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-500">
              Preview
            </p>

            <h2 className="mt-1 text-xl font-black">
              Member view
            </h2>

            <div className="mt-5 rounded-3xl bg-black p-5 text-white">
              <p className="text-xs font-bold uppercase tracking-wider text-lime-400">
                Today's workout
              </p>

              <h3 className="mt-2 text-2xl font-black">
                {selectedSchedule.workoutName}
              </h3>

              <p className="mt-1 text-sm text-gray-500">
                {selectedSchedule.category}
              </p>

              {selectedSchedule.startTime &&
                selectedSchedule.endTime && (
                  <div className="mt-4 flex items-center gap-2 rounded-2xl bg-white/5 p-3">
                    <Clock3
                      size={16}
                      className="text-yellow-400"
                    />

                    <span className="text-xs font-bold">
                      {selectedSchedule.startTime} –{" "}
                      {selectedSchedule.endTime}
                    </span>
                  </div>
                )}

              {selectedProgram && (
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <div className="rounded-2xl bg-white/5 p-3">
                    <p className="text-lg font-black">
                      {
                        selectedProgram
                          .exercises
                          .length
                      }
                    </p>

                    <p className="text-xs text-gray-500">
                      Exercises
                    </p>
                  </div>

                  <div className="rounded-2xl bg-white/5 p-3">
                    <p className="text-lg font-black">
                      {
                        selectedProgram
                          .estimatedDuration
                      }m
                    </p>

                    <p className="text-xs text-gray-500">
                      Est. time
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-5 rounded-2xl bg-gray-100 p-4">
              <p className="text-sm font-black">
                Trainer control
              </p>

              <p className="mt-1 text-xs leading-5 text-gray-500">
                Members will see the saved schedule
                on their Home screen. They don't need
                to select the workout themselves.
              </p>
            </div>
          </aside>
        </section>
      </main>
    </div>
  )
}

export default WorkoutSchedule