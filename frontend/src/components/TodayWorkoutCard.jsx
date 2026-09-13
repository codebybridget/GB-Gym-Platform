import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  Dumbbell,
  Play,
} from "lucide-react"

function TodayWorkoutCard({
  workout,
  onStart,
}) {
  const today = new Date()

  const isSunday =
    today.getDay() === 0

  /*
  |--------------------------------------------------------------------------
  | NORMALIZE WORKOUT DATA
  |--------------------------------------------------------------------------
  | The API/helper may provide the assignment and program at different
  | levels. Always accept the program if it exists anywhere in the
  | normalized workout object.
  */

  const assignment =
    workout?.assignment ||
    null

  const program =
    assignment?.program ||
    workout?.program ||
    workout?.workout?.program ||
    workout?.workout ||
    null

  const hasAssignment =
    Boolean(
      workout?.hasWorkout &&
        program,
    )

  /*
  |--------------------------------------------------------------------------
  | SUNDAY = ONLY REST DAY
  |--------------------------------------------------------------------------
  */

  if (isSunday) {
    return (
      <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className="inline-flex rounded-full bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-gray-400">
              TODAY
            </span>

            <p className="mt-5 text-xs font-bold uppercase tracking-wider text-gray-600">
              Sunday
            </p>

            <h2 className="mt-1 text-2xl font-black">
              Rest / Recovery
            </h2>

            <p className="mt-2 text-sm leading-6 text-gray-500">
              Sunday is your recovery day. Use this time
              to rest, stretch and prepare for your next
              training session.
            </p>
          </div>

          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-black text-gray-500">
            <CheckCircle2 size={22} />
          </div>
        </div>

        <div className="mt-5 rounded-2xl bg-black p-4">
          <p className="text-sm font-black">
            Recovery Day
          </p>

          <p className="mt-1 text-xs leading-5 text-gray-600">
            No workout is scheduled for Sunday.
          </p>
        </div>
      </section>
    )
  }

  /*
  |--------------------------------------------------------------------------
  | MONDAY - SATURDAY
  |--------------------------------------------------------------------------
  */

  if (!hasAssignment) {
    return (
      <section className="rounded-3xl border border-yellow-400/20 bg-yellow-400/5 p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className="inline-flex rounded-full bg-yellow-400 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-black">
              TODAY
            </span>

            <p className="mt-5 text-xs font-bold uppercase tracking-wider text-gray-600">
              {today.toLocaleDateString(
                "en-US",
                {
                  weekday: "long",
                },
              )}
            </p>

            <h2 className="mt-1 text-2xl font-black">
              Workout Not Assigned
            </h2>

            <p className="mt-2 text-sm leading-6 text-gray-500">
              Today is a training day, but your trainer
              has not assigned a workout for today yet.
            </p>
          </div>

          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-black text-yellow-400">
            <Dumbbell size={22} />
          </div>
        </div>

        <div className="mt-5 rounded-2xl bg-black p-4">
          <p className="text-sm font-black">
            Training Day
          </p>

          <p className="mt-1 text-xs leading-5 text-gray-600">
            Your assigned workout will appear here once
            your trainer assigns it.
          </p>
        </div>
      </section>
    )
  }

  /*
  |--------------------------------------------------------------------------
  | ASSIGNED WORKOUT
  |--------------------------------------------------------------------------
  */

  const programName =
    program?.name ||
    program?.title ||
    "Today's Workout"

  const description =
    program?.description ||
    workout?.description ||
    "Your trainer has assigned this workout for today."

  const duration =
    program?.estimatedDuration ||
    program?.duration ||
    workout?.duration ||
    "Not specified"

  const exercises =
    Array.isArray(
      program?.exercises,
    )
      ? program.exercises
      : []

  const exerciseCount =
    exercises.length

  const trainer =
    assignment?.assignedBy ||
    workout?.assignedBy ||
    null

  const trainerName =
    trainer
      ? `${trainer.firstName || ""} ${
          trainer.lastName || ""
        }`.trim()
      : ""

  const dayName =
    today.toLocaleDateString(
      "en-US",
      {
        weekday: "long",
      },
    )

  const dateText =
    today.toLocaleDateString(
      "en-US",
      {
        month: "long",
        day: "numeric",
        year: "numeric",
      },
    )

  return (
    <section className="overflow-hidden rounded-3xl border border-lime-400/30 bg-white/5">
      <div className="bg-lime-400/10 p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1 rounded-full bg-lime-400 px-3 py-1 text-[9px] font-black text-black">
              <CheckCircle2 size={11} />
              WORKOUT ASSIGNED
            </span>

            <p className="mt-4 text-xs font-bold uppercase tracking-wider text-gray-500">
              {dayName}
            </p>

            <p className="mt-1 text-[11px] font-bold text-gray-600">
              {dateText}
            </p>

            <h2 className="mt-1 text-2xl font-black">
              {programName}
            </h2>

            <p className="mt-2 text-xs leading-5 text-gray-500">
              {description}
            </p>
          </div>

          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-black text-lime-400">
            <Dumbbell size={22} />
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2">
          <InfoItem
            icon={Clock3}
            label="Duration"
            value={duration}
          />

          <InfoItem
            icon={CalendarDays}
            label="Exercises"
            value={`${exerciseCount} ${
              exerciseCount === 1
                ? "Exercise"
                : "Exercises"
            }`}
          />
        </div>

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
            Your trainer has assigned this workout.
            Open it to see your exercises, sets, reps
            and target weights.
          </p>
        </div>

        <button
          type="button"
          onClick={onStart}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-lime-400 px-5 py-4 text-sm font-black text-black transition hover:bg-lime-300 active:scale-[0.98]"
        >
          <Play
            size={17}
            fill="currentColor"
          />

          START WORKOUT
        </button>
      </div>
    </section>
  )
}

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

export default TodayWorkoutCard