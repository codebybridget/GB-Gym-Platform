import { useEffect, useMemo, useState } from "react"
import {
  Activity,
  AlertCircle,
  CheckCircle2,
  Clock3,
  Dumbbell,
  Edit3,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  X,
} from "lucide-react"

import {
  createProgram,
  deleteProgram,
  getPrograms,
  updateProgram,
} from "../../api/api.js"

import { useGym } from "../../context/GymContext.jsx"

const emptyWorkout = {
  name: "",
  description: "",
  workoutType: "Strength",
  difficulty: "Beginner",
  estimatedDuration: 30,
  trainerNotes: "",
  isActive: true,
}

const workoutTypes = [
  "Strength",
  "Cardio",
  "HIIT",
  "Tabata",
  "Mobility",
  "Flexibility",
  "Full Body",
  "Upper Body",
  "Lower Body",
  "Core",
]

const difficulties = ["Beginner", "Intermediate", "Advanced"]

function getId(item) {
  return item?._id || item?.id || ""
}

function getName(item) {
  return (
    item?.name ||
    item?.title ||
    item?.exerciseName ||
    "Unnamed Workout"
  )
}

function normalizeWorkout(item) {
  return {
    ...item,
    id: getId(item),
    name: getName(item),
    description: item?.description || "",
    workoutType: item?.workoutType || "Strength",
    difficulty: item?.difficulty || "Beginner",
    estimatedDuration:
      Number(item?.estimatedDuration || item?.duration || 30),
    trainerNotes: item?.trainerNotes || "",
    isActive: item?.isActive !== false,
    exercises: Array.isArray(item?.exercises) ? item.exercises : [],
  }
}

function getExerciseName(item) {
  if (!item) return "Exercise"

  if (typeof item === "string") {
    return item
  }

  if (item.exercise) {
    return (
      item.exercise.name ||
      item.exercise.title ||
      "Exercise"
    )
  }

  return item.name || item.title || "Exercise"
}

function Stat({ icon: Icon, label, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#07152f] p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#c7f000]/10">
          <Icon className="h-5 w-5 text-[#c7f000]" />
        </div>

        <div className="min-w-0">
          <p className="text-xs font-medium text-slate-400">{label}</p>
          <p className="mt-1 text-xl font-bold text-white">{value}</p>
        </div>
      </div>
    </div>
  )
}

function Info({ label, value }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-sm text-slate-200">{value}</p>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-200">
        {label}
      </span>
      {children}
    </label>
  )
}

function SelectField({ label, value, onChange, children }) {
  return (
    <Field label={label}>
      <select
        value={value}
        onChange={onChange}
        className="w-full rounded-xl border border-white/10 bg-[#081936] px-4 py-3 text-sm text-white outline-none transition focus:border-[#c7f000]"
      >
        {children}
      </select>
    </Field>
  )
}

function TextAreaField({ label, value, onChange, placeholder }) {
  return (
    <Field label={label}>
      <textarea
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={4}
        className="w-full resize-none rounded-xl border border-white/10 bg-[#081936] px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-[#c7f000]"
      />
    </Field>
  )
}

export default function Workouts() {
  const { gym } = useGym() || {}
  const gymName = gym?.name?.trim() || "Gym"

  const [workouts, setWorkouts] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState("All")
  const [statusFilter, setStatusFilter] = useState("All")

  const [showForm, setShowForm] = useState(false)
  const [editingWorkout, setEditingWorkout] = useState(null)
  const [showDelete, setShowDelete] = useState(false)
  const [deletingWorkout, setDeletingWorkout] = useState(null)

  const [formData, setFormData] = useState(emptyWorkout)

  const loadWorkouts = async () => {
    try {
      setLoading(true)
      setError("")

      const response = await getPrograms({})

      const rows = Array.isArray(response?.programs)
        ? response.programs
        : Array.isArray(response)
          ? response
          : []

      setWorkouts(rows.map(normalizeWorkout))
    } catch (err) {
      console.error("Failed to load workouts:", err)

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to load workouts.",
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadWorkouts()
  }, [])

  useEffect(() => {
    if (!success) return

    const timer = setTimeout(() => {
      setSuccess("")
    }, 3500)

    return () => clearTimeout(timer)
  }, [success])

  const filteredWorkouts = useMemo(() => {
    const query = search.trim().toLowerCase()

    return workouts.filter((workout) => {
      const matchesSearch =
        !query ||
        workout.name.toLowerCase().includes(query) ||
        workout.description.toLowerCase().includes(query) ||
        workout.workoutType.toLowerCase().includes(query)

      const matchesType =
        typeFilter === "All" ||
        workout.workoutType === typeFilter

      const matchesStatus =
        statusFilter === "All" ||
        (statusFilter === "Active" && workout.isActive) ||
        (statusFilter === "Inactive" && !workout.isActive)

      return matchesSearch && matchesType && matchesStatus
    })
  }, [workouts, search, typeFilter, statusFilter])

  const activeCount = workouts.filter(
    (workout) => workout.isActive,
  ).length

  const inactiveCount = workouts.filter(
    (workout) => !workout.isActive,
  ).length

  const totalExercises = workouts.reduce(
    (total, workout) => total + workout.exercises.length,
    0,
  )

  const openCreate = () => {
    setEditingWorkout(null)
    setFormData(emptyWorkout)
    setError("")
    setShowForm(true)
  }

  const openEdit = (workout) => {
    setEditingWorkout(workout)

    setFormData({
      name: workout.name || "",
      description: workout.description || "",
      workoutType: workout.workoutType || "Strength",
      difficulty: workout.difficulty || "Beginner",
      estimatedDuration:
        workout.estimatedDuration || 30,
      trainerNotes: workout.trainerNotes || "",
      isActive: workout.isActive !== false,
    })

    setError("")
    setShowForm(true)
  }

  const closeForm = () => {
    if (saving) return

    setShowForm(false)
    setEditingWorkout(null)
    setFormData(emptyWorkout)
  }

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target

    setFormData((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!formData.name.trim()) {
      setError("Workout name is required.")
      return
    }

    try {
      setSaving(true)
      setError("")
      setSuccess("")

      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        workoutType: formData.workoutType,
        difficulty: formData.difficulty,
        estimatedDuration: Number(
          formData.estimatedDuration || 30,
        ),
        trainerNotes: formData.trainerNotes.trim(),
        isActive: Boolean(formData.isActive),
      }

      /*
       * Existing backend Program create requires at least one
       * exercise. Since this Workouts page does not contain an
       * exercise selector, creation must not send an invalid
       * empty exercises array.
       *
       * Existing programs can be edited because their existing
       * exercise list is preserved.
       */
      if (editingWorkout) {
        payload.exercises = editingWorkout.exercises || []

        const response = await updateProgram(
          editingWorkout.id,
          payload,
        )

        const updatedProgram = normalizeWorkout(
          response?.program || {
            ...editingWorkout,
            ...payload,
          },
        )

        setWorkouts((current) =>
          current.map((item) =>
            item.id === editingWorkout.id
              ? updatedProgram
              : item,
          ),
        )

        setSuccess(
          response?.message ||
            "Workout updated successfully.",
        )

        closeForm()
      } else {
        setError(
          "A workout must contain at least one exercise. Create the workout from Workout Programs where exercises can be assigned.",
        )
        return
      }
    } catch (err) {
      console.error("Failed to save workout:", err)

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to save workout.",
      )
    } finally {
      setSaving(false)
    }
  }

  const handleToggleStatus = async (workout) => {
    try {
      setError("")
      setSuccess("")

      const response = await updateProgram(workout.id, {
        name: workout.name,
        description: workout.description,
        workoutType: workout.workoutType,
        difficulty: workout.difficulty,
        estimatedDuration: workout.estimatedDuration,
        trainerNotes: workout.trainerNotes,
        exercises: workout.exercises || [],
        isActive: !workout.isActive,
      })

      const updated = normalizeWorkout(
        response?.program || {
          ...workout,
          isActive: !workout.isActive,
        },
      )

      setWorkouts((current) =>
        current.map((item) =>
          item.id === workout.id ? updated : item,
        ),
      )

      setSuccess(
        response?.message ||
          `Workout ${
            updated.isActive ? "activated" : "deactivated"
          } successfully.`,
      )
    } catch (err) {
      console.error("Failed to update workout status:", err)

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to update workout status.",
      )
    }
  }

  const openDelete = (workout) => {
    setDeletingWorkout(workout)
    setShowDelete(true)
    setError("")
  }

  const closeDelete = () => {
    setShowDelete(false)
    setDeletingWorkout(null)
  }

  const handleDelete = async () => {
    if (!deletingWorkout) return

    try {
      setSaving(true)
      setError("")
      setSuccess("")

      const response = await deleteProgram(
        deletingWorkout.id,
      )

      /*
       * The backend deleteProgram performs a soft delete by
       * setting isActive to false.
       */
      setWorkouts((current) =>
        current.map((item) =>
          item.id === deletingWorkout.id
            ? {
                ...item,
                isActive: false,
              }
            : item,
        ),
      )

      setSuccess(
        response?.message ||
          "Workout deactivated successfully.",
      )

      closeDelete()
    } catch (err) {
      console.error("Failed to delete workout:", err)

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to delete workout.",
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-full bg-[#020b20] text-white">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold text-[#c7f000]">
              {gymName} Admin
            </p>

            <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
              Workouts
            </h1>

            <p className="mt-2 max-w-2xl text-sm text-slate-400">
              Manage workout programs available to your gym members.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={loadWorkouts}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw
                className={`h-4 w-4 ${
                  loading ? "animate-spin" : ""
                }`}
              />
              Refresh
            </button>

            <button
              type="button"
              onClick={openCreate}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#c7f000] px-4 py-3 text-sm font-bold text-[#041126] transition hover:bg-[#d7ff32]"
            >
              <Plus className="h-4 w-4" />
              Add Workout
            </button>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mt-6 flex items-start gap-3 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {success && (
          <div className="mt-6 flex items-start gap-3 rounded-2xl border border-[#c7f000]/20 bg-[#c7f000]/10 px-4 py-3 text-sm text-[#dfff78]">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
            <p>{success}</p>
          </div>
        )}

        {/* Stats */}
        <section className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
          <Stat
            icon={Dumbbell}
            label="Total Workouts"
            value={workouts.length}
          />

          <Stat
            icon={Activity}
            label="Active"
            value={activeCount}
          />

          <Stat
            icon={Clock3}
            label="Inactive"
            value={inactiveCount}
          />

          <Stat
            icon={CheckCircle2}
            label="Exercises Assigned"
            value={totalExercises}
          />
        </section>

        {/* Filters */}
        <section className="mt-8 rounded-2xl border border-white/10 bg-[#07152f] p-4">
          <div className="grid gap-3 lg:grid-cols-[1fr_200px_180px]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />

              <input
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search workouts..."
                className="w-full rounded-xl border border-white/10 bg-[#081936] py-3 pl-11 pr-4 text-sm text-white placeholder:text-slate-500 outline-none focus:border-[#c7f000]"
              />
            </div>

            <select
              value={typeFilter}
              onChange={(event) =>
                setTypeFilter(event.target.value)
              }
              className="rounded-xl border border-white/10 bg-[#081936] px-4 py-3 text-sm text-white outline-none focus:border-[#c7f000]"
            >
              <option value="All">All workout types</option>

              {workoutTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value)
              }
              className="rounded-xl border border-white/10 bg-[#081936] px-4 py-3 text-sm text-white outline-none focus:border-[#c7f000]"
            >
              <option value="All">All statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </section>

        {/* Workout list */}
        <section className="mt-6">
          {loading ? (
            <div className="flex min-h-[280px] items-center justify-center rounded-2xl border border-white/10 bg-[#07152f]">
              <div className="flex items-center gap-3 text-sm text-slate-400">
                <RefreshCw className="h-5 w-5 animate-spin text-[#c7f000]" />
                Loading workouts...
              </div>
            </div>
          ) : filteredWorkouts.length === 0 ? (
            <div className="flex min-h-[280px] flex-col items-center justify-center rounded-2xl border border-white/10 bg-[#07152f] px-6 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#c7f000]/10">
                <Dumbbell className="h-7 w-7 text-[#c7f000]" />
              </div>

              <h2 className="mt-4 text-lg font-bold text-white">
                No workouts found
              </h2>

              <p className="mt-2 max-w-md text-sm text-slate-400">
                No workout programs match your current filters.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredWorkouts.map((workout) => (
                <article
                  key={workout.id}
                  className="overflow-hidden rounded-2xl border border-white/10 bg-[#07152f]"
                >
                  <div className="border-b border-white/10 p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-[#c7f000]/10 px-2.5 py-1 text-xs font-semibold text-[#dfff78]">
                            {workout.workoutType}
                          </span>

                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                              workout.isActive
                                ? "bg-emerald-500/10 text-emerald-300"
                                : "bg-slate-500/10 text-slate-400"
                            }`}
                          >
                            {workout.isActive
                              ? "Active"
                              : "Inactive"}
                          </span>
                        </div>

                        <h2 className="mt-3 break-words text-lg font-bold text-white">
                          {workout.name}
                        </h2>
                      </div>

                      <div className="flex shrink-0 items-center gap-1">
                        <button
                          type="button"
                          onClick={() => openEdit(workout)}
                          title="Edit workout"
                          className="rounded-lg p-2 text-slate-400 transition hover:bg-white/[0.06] hover:text-[#c7f000]"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => openDelete(workout)}
                          title="Deactivate workout"
                          className="rounded-lg p-2 text-slate-400 transition hover:bg-red-500/10 hover:text-red-300"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <p className="mt-3 break-words text-sm leading-6 text-slate-400">
                      {workout.description ||
                        "No workout description available."}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 p-5">
                    <Info
                      label="Difficulty"
                      value={workout.difficulty}
                    />

                    <Info
                      label="Duration"
                      value={`${workout.estimatedDuration} min`}
                    />

                    <Info
                      label="Exercises"
                      value={workout.exercises.length}
                    />

                    <Info
                      label="Status"
                      value={
                        workout.isActive
                          ? "Available"
                          : "Disabled"
                      }
                    />
                  </div>

                  {workout.exercises.length > 0 && (
                    <div className="border-t border-white/10 px-5 py-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Included Exercises
                      </p>

                      <div className="mt-3 flex flex-wrap gap-2">
                        {workout.exercises
                          .slice(0, 5)
                          .map((item, index) => (
                            <span
                              key={`${getId(item.exercise) || "exercise"}-${index}`}
                              className="rounded-lg bg-white/[0.04] px-3 py-1.5 text-xs text-slate-300"
                            >
                              {getExerciseName(item)}
                            </span>
                          ))}

                        {workout.exercises.length > 5 && (
                          <span className="rounded-lg bg-white/[0.04] px-3 py-1.5 text-xs text-[#c7f000]">
                            +{workout.exercises.length - 5} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between border-t border-white/10 px-5 py-4">
                    <span className="text-xs text-slate-500">
                      Workout status
                    </span>

                    <button
                      type="button"
                      onClick={() =>
                        handleToggleStatus(workout)
                      }
                      className={`rounded-lg px-3 py-2 text-xs font-bold transition ${
                        workout.isActive
                          ? "bg-yellow-400/10 text-yellow-300 hover:bg-yellow-400/20"
                          : "bg-[#c7f000]/10 text-[#dfff78] hover:bg-[#c7f000]/20"
                      }`}
                    >
                      {workout.isActive
                        ? "Deactivate"
                        : "Activate"}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Create / Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-white/10 bg-[#06132d] shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-[#06132d] px-5 py-4">
              <div>
                <h2 className="text-lg font-bold text-white">
                  {editingWorkout
                    ? "Edit Workout"
                    : "Add Workout"}
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  {editingWorkout
                    ? "Update the workout details."
                    : "Workout creation requires exercises to be assigned."}
                </p>
              </div>

              <button
                type="button"
                onClick={closeForm}
                disabled={saving}
                className="rounded-lg p-2 text-slate-400 transition hover:bg-white/[0.06] hover:text-white disabled:opacity-50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="space-y-5 p-5"
            >
              <Field label="Workout Name">
                <input
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. Full Body Strength"
                  className="w-full rounded-xl border border-white/10 bg-[#081936] px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none focus:border-[#c7f000]"
                />
              </Field>

              <TextAreaField
                label="Description"
                value={formData.description}
                onChange={(event) =>
                  setFormData((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
                placeholder="Describe this workout..."
              />

              <div className="grid gap-4 md:grid-cols-2">
                <SelectField
                  label="Workout Type"
                  value={formData.workoutType}
                  onChange={(event) =>
                    setFormData((current) => ({
                      ...current,
                      workoutType: event.target.value,
                    }))
                  }
                >
                  {workoutTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </SelectField>

                <SelectField
                  label="Difficulty"
                  value={formData.difficulty}
                  onChange={(event) =>
                    setFormData((current) => ({
                      ...current,
                      difficulty: event.target.value,
                    }))
                  }
                >
                  {difficulties.map((difficulty) => (
                    <option
                      key={difficulty}
                      value={difficulty}
                    >
                      {difficulty}
                    </option>
                  ))}
                </SelectField>
              </div>

              <Field label="Estimated Duration (minutes)">
                <input
                  name="estimatedDuration"
                  type="number"
                  min="1"
                  max="600"
                  value={formData.estimatedDuration}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-white/10 bg-[#081936] px-4 py-3 text-sm text-white outline-none focus:border-[#c7f000]"
                />
              </Field>

              <TextAreaField
                label="Trainer Notes"
                value={formData.trainerNotes}
                onChange={(event) =>
                  setFormData((current) => ({
                    ...current,
                    trainerNotes: event.target.value,
                  }))
                }
                placeholder="Optional notes for trainers..."
              />

              <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <input
                  name="isActive"
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={handleChange}
                  className="h-4 w-4 accent-[#c7f000]"
                />

                <span>
                  <span className="block text-sm font-semibold text-white">
                    Active workout
                  </span>

                  <span className="mt-1 block text-xs text-slate-500">
                    Active workouts are available for use.
                  </span>
                </span>
              </label>

              {editingWorkout &&
                editingWorkout.exercises.length > 0 && (
                  <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                    <p className="text-sm font-semibold text-white">
                      Assigned Exercises
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      Existing exercises will be preserved when
                      you save changes here.
                    </p>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {editingWorkout.exercises.map(
                        (item, index) => (
                          <span
                            key={`${getId(item.exercise) || "exercise"}-${index}`}
                            className="rounded-lg bg-[#c7f000]/10 px-3 py-1.5 text-xs text-[#dfff78]"
                          >
                            {getExerciseName(item)}
                          </span>
                        ),
                      )}
                    </div>
                  </div>
                )}

              <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeForm}
                  disabled={saving}
                  className="rounded-xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.08] disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#c7f000] px-5 py-3 text-sm font-bold text-[#041126] transition hover:bg-[#d7ff32] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving && (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  )}

                  {editingWorkout
                    ? "Save Changes"
                    : "Create Workout"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDelete && deletingWorkout && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#06132d] p-6 shadow-2xl">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-500/10">
              <Trash2 className="h-6 w-6 text-red-300" />
            </div>

            <h2 className="mt-5 text-xl font-bold text-white">
              Deactivate Workout?
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-400">
              This will deactivate{" "}
              <span className="font-semibold text-white">
                {deletingWorkout.name}
              </span>
              . The existing workout data will remain in the
              system.
            </p>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closeDelete}
                disabled={saving}
                className="rounded-xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.08] disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleDelete}
                disabled={saving}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-500 px-5 py-3 text-sm font-bold text-white transition hover:bg-red-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving && (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                )}
                Deactivate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}