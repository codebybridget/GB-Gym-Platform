import {
  CalendarDays,
  Dumbbell,
  Plus,
  Save,
  Trash2,
} from "lucide-react"

import {
  useEffect,
  useMemo,
  useState,
} from "react"

import {
  createProgram,
  deleteProgram,
  getPrograms,
  updateProgram,
} from "../../api/api.js"

import { useAuth } from "../../context/AuthContext.jsx"
import { useGym } from "../../context/GymContext.jsx"

const weekDays = [
  {
    day: "Monday",
    workoutType: "Lower Body",
    time: "",
  },
  {
    day: "Tuesday",
    workoutType: "Upper Body",
    time: "",
  },
  {
    day: "Wednesday",
    workoutType: "Lower Body",
    time: "",
  },
  {
    day: "Thursday",
    workoutType: "Upper Body",
    time: "",
  },
  {
    day: "Friday",
    workoutType: "CrossFit",
    time: "",
  },
  {
    day: "Saturday",
    workoutType: "Tabata",
    time: "8:00 AM - 9:00 AM",
  },
]

const workoutTypes = [
  "Upper Body",
  "Lower Body",
  "Full Body",
  "Core",
  "Cardio",
  "HIIT",
  "Tabata",
  "CrossFit",
  "Strength Training",
  "Functional Training",
  "Mobility & Flexibility",
  "Plyometrics",
]

function Programs() {
  const { user } = useAuth() || {}
  const { gym } = useGym() || {}

  const gymName =
    gym?.name?.trim() ||
    user?.gym?.name?.trim() ||
    "Gym"

  const role = String(
    user?.role ||
      user?.userType ||
      "",
  ).toLowerCase()

  const isTrainer =
    role === "trainer"

  const [
    programs,
    setPrograms,
  ] = useState([])

  const [
    selectedProgramId,
    setSelectedProgramId,
  ] = useState("")

  const [
    loading,
    setLoading,
  ] = useState(true)

  const [
    saving,
    setSaving,
  ] = useState(false)

  const [
    creating,
    setCreating,
  ] = useState(false)

  const [
    error,
    setError,
  ] = useState("")

  /*
  |--------------------------------------------------------------------------
  | Load programs from MongoDB
  |--------------------------------------------------------------------------
  */

  const loadPrograms =
    async () => {
      try {
        setLoading(true)
        setError("")

        const response =
          await getPrograms()

        const loadedPrograms =
          Array.isArray(
            response?.programs,
          )
            ? response.programs
            : []

        const activePrograms =
          loadedPrograms.filter(
            (program) =>
              program?.isActive !==
              false,
          )

        setPrograms(
          activePrograms,
        )

        if (
          activePrograms.length >
          0
        ) {
          setSelectedProgramId(
            (current) => {
              const stillExists =
                activePrograms.some(
                  (program) =>
                    getProgramId(
                      program,
                    ) === current,
                )

              return stillExists
                ? current
                : getProgramId(
                    activePrograms[0],
                  )
            },
          )
        } else {
          setSelectedProgramId("")
        }
      } catch (error) {
        console.error(
          "Load programs error:",
          error,
        )

        setError(
          error.response?.data
            ?.message ||
            error.message ||
            "Unable to load workout programs.",
        )
      } finally {
        setLoading(false)
      }
    }

  useEffect(() => {
    loadPrograms()
  }, [])

  /*
  |--------------------------------------------------------------------------
  | Selected program
  |--------------------------------------------------------------------------
  */

  const selectedProgram =
    useMemo(
      () =>
        programs.find(
          (program) =>
            getProgramId(
              program,
            ) ===
            selectedProgramId,
        ) || null,
      [
        programs,
        selectedProgramId,
      ],
    )

  /*
  |--------------------------------------------------------------------------
  | Program selection
  |--------------------------------------------------------------------------
  */

  const handleProgramChange =
    (event) => {
      setSelectedProgramId(
        event.target.value,
      )
    }

  /*
  |--------------------------------------------------------------------------
  | Update program
  |--------------------------------------------------------------------------
  */

  const handleUpdateProgram =
    async (
      changes,
    ) => {
      if (
        !selectedProgram
      ) {
        return
      }

      try {
        setSaving(true)
        setError("")

        const programId =
          getProgramId(
            selectedProgram,
          )

        const response =
          await updateProgram(
            programId,
            changes,
          )

        const updatedProgram =
          response?.program

        if (
          updatedProgram
        ) {
          setPrograms(
            (current) =>
              current.map(
                (program) =>
                  getProgramId(
                    program,
                  ) === programId
                    ? updatedProgram
                    : program,
              ),
          )
        } else {
          await loadPrograms()
        }
      } catch (error) {
        console.error(
          "Update program error:",
          error,
        )

        setError(
          error.response?.data
            ?.message ||
            error.message ||
            "Unable to update workout program.",
        )
      } finally {
        setSaving(false)
      }
    }

  /*
  |--------------------------------------------------------------------------
  | Update exercise
  |--------------------------------------------------------------------------
  */

  const handleUpdateExercise =
    async (
      exerciseId,
      changes,
    ) => {
      if (
        !selectedProgram
      ) {
        return
      }

      const currentExercises =
        Array.isArray(
          selectedProgram.exercises,
        )
          ? selectedProgram.exercises
          : []

      const updatedExercises =
        currentExercises.map(
          (exercise) => {
            const id =
              getExerciseId(
                exercise,
              )

            if (
              id !== exerciseId
            ) {
              return exercise
            }

            return {
              ...exercise,
              ...changes,
            }
          },
        )

      await handleUpdateProgram(
        {
          exercises:
            updatedExercises,
        },
      )
    }

  /*
  |--------------------------------------------------------------------------
  | Remove exercise
  |--------------------------------------------------------------------------
  */

  const handleRemoveExercise =
    async (
      exerciseId,
    ) => {
      if (
        !selectedProgram
      ) {
        return
      }

      const confirmed =
        window.confirm(
          "Remove this exercise from the program?",
        )

      if (!confirmed) {
        return
      }

      const currentExercises =
        Array.isArray(
          selectedProgram.exercises,
        )
          ? selectedProgram.exercises
          : []

      const updatedExercises =
        currentExercises.filter(
          (exercise) =>
            getExerciseId(
              exercise,
            ) !== exerciseId,
        )

      await handleUpdateProgram(
        {
          exercises:
            updatedExercises,
        },
      )
    }

  /*
  |--------------------------------------------------------------------------
  | Create program
  |--------------------------------------------------------------------------
  */

  const handleCreateProgram =
    async () => {
      const name =
        window.prompt(
          "Enter the program name:",
        )

      if (!name?.trim()) {
        return
      }

      const workoutType =
        window.prompt(
          `Enter workout type:\n${workoutTypes.join("\n")}`,
          "Lower Body",
        )

      const normalizedWorkoutType =
        workoutTypes.includes(
          workoutType,
        )
          ? workoutType
          : "Lower Body"

      try {
        setCreating(true)
        setError("")

        const response =
          await createProgram({
            name:
              name.trim(),

            description:
              `${normalizedWorkoutType} training program.`,

            workoutType:
              normalizedWorkoutType,

            exercises: [],

            isActive: true,
          })

        const createdProgram =
          response?.program

        if (
          !createdProgram
        ) {
          throw new Error(
            "Program was created but no program was returned by the server.",
          )
        }

        setPrograms(
          (current) => [
            ...current,
            createdProgram,
          ],
        )

        setSelectedProgramId(
          getProgramId(
            createdProgram,
          ),
        )

        window.alert(
          "Program created successfully.",
        )
      } catch (error) {
        console.error(
          "Create program error:",
          error,
        )

        setError(
          error.response?.data
            ?.message ||
            error.message ||
            "Unable to create workout program.",
        )
      } finally {
        setCreating(false)
      }
    }

  /*
  |--------------------------------------------------------------------------
  | Deactivate program
  |--------------------------------------------------------------------------
  */

  const handleDeleteProgram =
    async () => {
      if (
        !selectedProgram
      ) {
        return
      }

      const confirmed =
        window.confirm(
          `Deactivate "${selectedProgram.name}"?`,
        )

      if (!confirmed) {
        return
      }

      try {
        setSaving(true)
        setError("")

        await deleteProgram(
          getProgramId(
            selectedProgram,
          ),
        )

        const remaining =
          programs.filter(
            (program) =>
              getProgramId(
                program,
              ) !==
              getProgramId(
                selectedProgram,
              ),
          )

        setPrograms(
          remaining,
        )

        setSelectedProgramId(
          remaining.length
            ? getProgramId(
                remaining[0],
              )
            : "",
        )
      } catch (error) {
        console.error(
          "Delete program error:",
          error,
        )

        setError(
          error.response?.data
            ?.message ||
            error.message ||
            "Unable to deactivate workout program.",
        )
      } finally {
        setSaving(false)
      }
    }

  return (
    <div className="min-h-screen bg-black text-white">
      <main className="mx-auto max-w-6xl px-5 py-8">

        {/* HEADER */}

        <header className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-lime-400">
              <CalendarDays size={18} />

              <span className="text-xs font-black uppercase tracking-widest">
                {gymName} Training Programs
              </span>
            </div>

            <h1 className="mt-2 text-3xl font-black">
              Program Builder
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">
              Build the training programs that trainers
              will assign to {gymName} members.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={
                handleCreateProgram
              }
              disabled={
                creating
              }
              className="flex items-center justify-center gap-2 rounded-2xl bg-yellow-400 px-5 py-3.5 text-sm font-black text-black disabled:opacity-50"
            >
              <Plus size={17} />

              {creating
                ? "CREATING..."
                : "NEW PROGRAM"}
            </button>

            <button
              type="button"
              onClick={() =>
                handleUpdateProgram(
                  {},
                )
              }
              disabled={
                saving ||
                !selectedProgram
              }
              className="flex items-center justify-center gap-2 rounded-2xl bg-lime-400 px-5 py-3.5 text-sm font-black text-black disabled:opacity-50"
            >
              <Save size={17} />

              {saving
                ? "SAVING..."
                : "SAVE PROGRAM"}
            </button>
          </div>
        </header>

        {/* ERROR */}

        {error && (
          <div className="mt-6 rounded-2xl border border-red-400/20 bg-red-400/10 p-4 text-sm font-bold text-red-400">
            {error}
          </div>
        )}

        {/* LOADING */}

        {loading ? (
          <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-12 text-center">
            <p className="text-sm font-bold text-gray-500">
              Loading programs from MongoDB...
            </p>
          </div>
        ) : programs.length ===
          0 ? (
          <div className="mt-8 rounded-3xl border border-dashed border-white/10 bg-white/5 p-12 text-center">
            <Dumbbell
              size={32}
              className="mx-auto text-gray-700"
            />

            <h2 className="mt-4 text-lg font-black">
              No workout programs found
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-600">
              Create your first program so it can later be assigned to members.
            </p>

            <button
              type="button"
              onClick={
                handleCreateProgram
              }
              className="mt-5 rounded-2xl bg-yellow-400 px-5 py-3 text-xs font-black text-black"
            >
              CREATE FIRST PROGRAM
            </button>
          </div>
        ) : (
          <>
            {/* PROGRAM SELECTOR */}

            <section className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-5">
              <label
                htmlFor="program-selector"
                className="mb-2 block text-[10px] font-black uppercase tracking-wider text-gray-600"
              >
                Select Program
              </label>

              <select
                id="program-selector"
                value={
                  selectedProgramId
                }
                onChange={
                  handleProgramChange
                }
                className="w-full rounded-2xl border border-white/10 bg-black px-4 py-4 text-sm font-black text-white outline-none focus:border-lime-400"
              >
                {programs.map(
                  (
                    program,
                  ) => (
                    <option
                      key={getProgramId(
                        program,
                      )}
                      value={getProgramId(
                        program,
                      )}
                    >
                      {program.name ||
                        "Unnamed Program"}
                      {program.workoutType
                        ? ` — ${program.workoutType}`
                        : ""}
                    </option>
                  ),
                )}
              </select>
            </section>

            {/* PROGRAM CARDS */}

            <section className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {programs.map(
                (
                  program,
                ) => {
                  const active =
                    getProgramId(
                      program,
                    ) ===
                    selectedProgramId

                  return (
                    <button
                      key={getProgramId(
                        program,
                      )}
                      type="button"
                      onClick={() =>
                        setSelectedProgramId(
                          getProgramId(
                            program,
                          ),
                        )
                      }
                      className={`rounded-3xl border p-5 text-left transition ${
                        active
                          ? "border-lime-400/40 bg-lime-400/10"
                          : "border-white/10 bg-white/5"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p
                            className={`text-xs font-black uppercase tracking-wider ${
                              active
                                ? "text-lime-400"
                                : "text-gray-500"
                            }`}
                          >
                            {program.workoutType ||
                              "Workout"}
                          </p>

                          <h2 className="mt-1 text-lg font-black">
                            {program.name ||
                              "Unnamed Program"}
                          </h2>
                        </div>

                        <div className="rounded-xl bg-black p-2">
                          <Dumbbell
                            size={17}
                            className={
                              active
                                ? "text-yellow-400"
                                : "text-gray-600"
                            }
                          />
                        </div>
                      </div>

                      <div className="mt-4 flex items-center justify-between text-xs">
                        <span className="text-gray-600">
                          {program.exercises
                            ?.length ||
                            0}{" "}
                          exercises
                        </span>

                        <span className="text-yellow-400">
                          {program.isActive ===
                          false
                            ? "Inactive"
                            : "Active"}
                        </span>
                      </div>
                    </button>
                  )
                },
              )}
            </section>

            {/* SELECTED PROGRAM */}

            {selectedProgram && (
              <section className="mt-8">

                {/* PROGRAM DETAILS */}

                <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                  <div className="grid gap-4 md:grid-cols-3">

                    <Field
                      label="Program Name"
                      value={
                        selectedProgram.name ||
                        ""
                      }
                      onChange={(
                        value,
                      ) =>
                        handleUpdateProgram(
                          {
                            name: value,
                          },
                        )
                      }
                    />

                    <SelectField
                      label="Workout Type"
                      value={
                        selectedProgram.workoutType ||
                        ""
                      }
                      options={workoutTypes}
                      onChange={(
                        value,
                      ) =>
                        handleUpdateProgram(
                          {
                            workoutType:
                              value,
                          },
                        )
                      }
                    />

                    <Field
                      label="Class Time"
                      value={
                        selectedProgram.time ||
                        ""
                      }
                      placeholder="Optional"
                      onChange={(
                        value,
                      ) =>
                        handleUpdateProgram(
                          {
                            time: value,
                          },
                        )
                      }
                    />
                  </div>
                </div>

                {/* EXERCISES */}

                <div className="mt-6 flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-black">
                      Assigned Exercises
                    </h2>

                    <p className="mt-1 text-xs text-gray-600">
                      {selectedProgram
                        .exercises
                        ?.length ||
                        0}{" "}
                      exercises in this workout
                    </p>
                  </div>

                  <span className="rounded-full bg-yellow-400/10 px-3 py-2 text-[10px] font-black uppercase text-yellow-400">
                    {selectedProgram.workoutType ||
                      "Workout"}
                  </span>
                </div>

                <div className="mt-4 space-y-3">
                  {selectedProgram
                    .exercises
                    ?.length === 0 ||
                  !selectedProgram
                    .exercises ? (
                    <EmptyProgram />
                  ) : (
                    selectedProgram.exercises.map(
                      (
                        exercise,
                        index,
                      ) => (
                        <ProgramExercise
                          key={
                            getExerciseId(
                              exercise,
                            ) ||
                            index
                          }
                          exercise={
                            exercise
                          }
                          index={
                            index
                          }
                          onUpdate={(
                            changes,
                          ) =>
                            handleUpdateExercise(
                              getExerciseId(
                                exercise,
                              ),
                              changes,
                            )
                          }
                          onRemove={() =>
                            handleRemoveExercise(
                              getExerciseId(
                                exercise,
                              ),
                            )
                          }
                        />
                      ),
                    )
                  )}
                </div>

                {/* ADD EXERCISE INFORMATION */}

                <div className="mt-6 rounded-3xl border border-dashed border-white/10 bg-white/[0.02] p-6 text-center">
                  <Plus
                    size={24}
                    className="mx-auto text-gray-700"
                  />

                  <p className="mt-3 text-sm font-black">
                    Add exercises from the Exercise Library
                  </p>

                  <p className="mt-1 text-xs text-gray-600">
                    Open {gymName} → Exercises and use
                    "Add to Program".
                  </p>
                </div>

                {/* DELETE PROGRAM */}

                <div className="mt-6 flex justify-end">
                  <button
                    type="button"
                    onClick={
                      handleDeleteProgram
                    }
                    disabled={
                      saving
                    }
                    className="flex items-center gap-2 rounded-2xl bg-red-400/10 px-4 py-3 text-xs font-black text-red-400 disabled:opacity-50"
                  >
                    <Trash2
                      size={15}
                    />

                    DEACTIVATE PROGRAM
                  </button>
                </div>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  )
}

/*
|--------------------------------------------------------------------------
| Program Exercise
|--------------------------------------------------------------------------
*/

function ProgramExercise({
  exercise,
  index,
  onUpdate,
  onRemove,
}) {
  const isTabata =
    String(
      exercise.category ||
        exercise.workoutType ||
        exercise.exercise?.category ||
        exercise.exercise?.workoutType ||
        "",
    ).toLowerCase() ===
    "tabata"

  const exerciseData =
    typeof exercise.exercise ===
    "object"
      ? exercise.exercise
      : exercise

  const exerciseName =
    exercise.name ||
    exerciseData?.name ||
    "Unnamed Exercise"

  const imageUrl =
    exercise.imageUrl ||
    exerciseData?.imageUrl ||
    exercise.image?.url ||
    exerciseData?.image?.url ||
    exercise.image ||
    exerciseData?.image ||
    ""

  const muscleGroup =
    exercise.muscleGroup ||
    exerciseData?.muscleGroup ||
    "Muscle group"

  const equipment =
    exercise.equipment ??
    exerciseData?.equipment

  const equipmentText =
    Array.isArray(equipment)
      ? equipment.join(", ")
      : equipment ||
        "No equipment"

  return (
    <article className="overflow-hidden rounded-3xl border border-white/10 bg-white/5">

      {/* EXERCISE HEADER */}

      <div className="flex items-start gap-4 p-5">

        {/* EXERCISE IMAGE */}

        <div className="relative h-24 w-28 shrink-0 overflow-hidden rounded-2xl bg-black">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={exerciseName}
              className="h-full w-full object-cover"
              onError={(event) => {
                const image =
                  event.currentTarget

                image.style.display =
                  "none"

                const fallback =
                  image.parentElement?.querySelector(
                    "[data-program-exercise-image-fallback]",
                  )

                if (fallback) {
                  fallback.classList.remove(
                    "hidden",
                  )
                }
              }}
            />
          ) : null}

          <div
            data-program-exercise-image-fallback
            className={`${
              imageUrl
                ? "hidden "
                : ""
            }absolute inset-0 flex flex-col items-center justify-center bg-slate-900`}
          >
            <Dumbbell
              size={28}
              className="text-gray-600"
            />

            <span className="mt-1 text-[8px] font-black uppercase tracking-wider text-gray-700">
              No Image
            </span>
          </div>
        </div>

        {/* EXERCISE INFORMATION */}

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-black text-yellow-400">
              EXERCISE {index + 1}
            </span>

            <span className="rounded-full bg-lime-400/10 px-2 py-1 text-[9px] font-black uppercase text-lime-400">
              {exercise.category ||
                exerciseData?.category ||
                "Exercise"}
            </span>
          </div>

          <h3 className="mt-1 text-base font-black">
            {exerciseName}
          </h3>

          <p className="mt-1 text-xs text-gray-600">
            {muscleGroup}
            {" · "}
            {equipmentText}
          </p>
        </div>

        {/* REMOVE */}

        <button
          type="button"
          onClick={
            onRemove
          }
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-400/10 text-red-400"
          aria-label={`Remove ${exerciseName}`}
        >
          <Trash2
            size={15}
          />
        </button>
      </div>

      {/* WORKOUT SETTINGS */}

      {isTabata ? (
        <div className="border-t border-white/10 px-5 pb-5">
          <div className="mt-5 grid grid-cols-3 gap-3">
            <NumberField
              label="Work Seconds"
              value={
                exercise.workInterval
              }
              onChange={(
                value,
              ) =>
                onUpdate({
                  workInterval:
                    Number(
                      value,
                    ),
                })
              }
            />

            <NumberField
              label="Rest Seconds"
              value={
                exercise.restInterval
              }
              onChange={(
                value,
              ) =>
                onUpdate({
                  restInterval:
                    Number(
                      value,
                    ),
                })
              }
            />

            <NumberField
              label="Rounds"
              value={
                exercise.rounds
              }
              onChange={(
                value,
              ) =>
                onUpdate({
                  rounds:
                    Number(
                      value,
                    ),
                })
              }
            />
          </div>

          <TextField
            label="Trainer Notes"
            value={
              exercise.notes
            }
            placeholder="Optional instructions for members"
            onChange={(
              value,
            ) =>
              onUpdate({
                notes: value,
              })
            }
          />
        </div>
      ) : (
        <div className="border-t border-white/10 px-5 pb-5">
          <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
            <NumberField
              label="Sets"
              value={
                exercise.sets
              }
              onChange={(
                value,
              ) =>
                onUpdate({
                  sets:
                    Number(
                      value,
                    ),
                })
              }
            />

            <NumberField
              label="Reps"
              value={
                exercise.reps
              }
              onChange={(
                value,
              ) =>
                onUpdate({
                  reps:
                    Number(
                      value,
                    ),
                })
              }
            />

            <TextField
              label="Weight"
              value={
                exercise.weight
              }
              placeholder="e.g. 20 kg"
              onChange={(
                value,
              ) =>
                onUpdate({
                  weight: value,
                })
              }
            />

            <TextField
              label="Rest"
              value={
                exercise.rest
              }
              placeholder="e.g. 60 sec"
              onChange={(
                value,
              ) =>
                onUpdate({
                  rest: value,
                })
              }
            />
          </div>

          <TextField
            label="Trainer Notes"
            value={
              exercise.notes
            }
            placeholder="Optional instructions for members"
            onChange={(
              value,
            ) =>
              onUpdate({
                notes: value,
              })
            }
          />
        </div>
      )}
    </article>
  )
}

/*
|--------------------------------------------------------------------------
| Field
|--------------------------------------------------------------------------
*/

function Field({
  label,
  value,
  onChange,
  placeholder,
  disabled = false,
}) {
  return (
    <div>
      <label className="mb-2 block text-[10px] font-black uppercase tracking-wider text-gray-600">
        {label}
      </label>

      <input
        value={
          value ?? ""
        }
        disabled={
          disabled
        }
        placeholder={
          placeholder
        }
        onChange={(
          event,
        ) =>
          onChange?.(
            event.target
              .value,
          )
        }
        className={`w-full rounded-2xl border border-white/10 px-4 py-3.5 text-xs font-bold outline-none ${
          disabled
            ? "bg-black/50 text-gray-600"
            : "bg-black text-white focus:border-lime-400"
        }`}
      />
    </div>
  )
}

/*
|--------------------------------------------------------------------------
| Select Field
|--------------------------------------------------------------------------
*/

function SelectField({
  label,
  value,
  options = [],
  onChange,
  placeholder = "Select workout type",
}) {
  return (
    <div>
      <label className="mb-2 block text-[10px] font-black uppercase tracking-wider text-gray-600">
        {label}
      </label>

      <select
        value={value ?? ""}
        onChange={(event) =>
          onChange?.(
            event.target.value,
          )
        }
        className="w-full rounded-2xl border border-white/10 bg-black px-4 py-3.5 text-xs font-bold text-white outline-none focus:border-lime-400"
      >
        {!value ? (
          <option value="">
            {placeholder}
          </option>
        ) : null}

        {options.map(
          (option) => (
            <option
              key={option}
              value={option}
            >
              {option}
            </option>
          ),
        )}
      </select>
    </div>
  )
}

/*
|--------------------------------------------------------------------------
| Text Field
|--------------------------------------------------------------------------
*/

function TextField({
  label,
  value,
  onChange,
  placeholder,
}) {
  return (
    <div className="mt-3">
      <label className="mb-2 block text-[10px] font-black uppercase tracking-wider text-gray-600">
        {label}
      </label>

      <input
        value={
          value || ""
        }
        placeholder={
          placeholder
        }
        onChange={(
          event,
        ) =>
          onChange(
            event.target
              .value,
          )
        }
        className="w-full rounded-2xl border border-white/10 bg-black px-4 py-3 text-xs font-bold text-white outline-none placeholder:text-gray-700 focus:border-lime-400"
      />
    </div>
  )
}

/*
|--------------------------------------------------------------------------
| Number Field
|--------------------------------------------------------------------------
*/

function NumberField({
  label,
  value,
  onChange,
}) {
  return (
    <div>
      <label className="mb-2 block text-[10px] font-black uppercase tracking-wider text-gray-600">
        {label}
      </label>

      <input
        type="number"
        min="0"
        value={
          value ?? ""
        }
        onChange={(
          event,
        ) =>
          onChange(
            event.target
              .value,
          )
        }
        className="w-full rounded-2xl border border-white/10 bg-black px-4 py-3 text-xs font-black text-yellow-400 outline-none focus:border-lime-400"
      />
    </div>
  )
}

/*
|--------------------------------------------------------------------------
| Empty Program
|--------------------------------------------------------------------------
*/

function EmptyProgram() {
  return (
    <div className="rounded-3xl border border-dashed border-white/10 p-10 text-center">
      <Dumbbell
        size={30}
        className="mx-auto text-gray-700"
      />

      <h3 className="mt-4 text-sm font-black">
        No exercises assigned yet
      </h3>

      <p className="mt-2 text-xs text-gray-600">
        Add exercises from the Exercise Library to build this workout.
      </p>
    </div>
  )
}

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

function getProgramId(
  program,
) {
  return (
    program?._id ||
    program?.id ||
    ""
  )
}

function getExerciseId(
  exercise,
) {
  if (
    typeof exercise?.exercise ===
    "object"
  ) {
    return (
      exercise.exercise?._id ||
      exercise.exercise?.id ||
      exercise._id ||
      exercise.id ||
      ""
    )
  }

  return (
    exercise?.exercise ||
    exercise?._id ||
    exercise?.id ||
    ""
  )
}

export default Programs