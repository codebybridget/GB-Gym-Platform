import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Dumbbell,
  Loader2,
  Trash2,
  User,
} from "lucide-react"

import {
  useEffect,
  useMemo,
  useState,
} from "react"

import {
  cancelProgramAssignment,
  getProgramAssignments,
} from "../api/api.js"

function formatDate(value) {
  if (!value) {
    return "No date"
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return date.toLocaleDateString(
    undefined,
    {
      year: "numeric",
      month: "short",
      day: "numeric",
    },
  )
}

function normalizeWorkoutType(value) {
  const normalized =
    String(value || "")
      .trim()
      .toLowerCase()
      .replace(/[_-]+/g, " ")

  if (normalized === "lower body") {
    return "Lower Body"
  }

  if (normalized === "upper body") {
    return "Upper Body"
  }

  if (normalized === "crossfit") {
    return "CrossFit"
  }

  if (normalized === "tabata") {
    return "Tabata"
  }

  return value || "Workout"
}

function getMemberName(member) {
  if (!member) {
    return "Member"
  }

  return (
    `${member.firstName || ""} ${
      member.lastName || ""
    }`.trim() || "Member"
  )
}

function EmptyState() {
  return (
    <div className="rounded-3xl border border-dashed border-white/10 bg white/[0.02] p-10 text-center">
      <Dumbbell
        size={32}
        className="mx-auto text-gray-700"
      />

      <p className="mt-4 text-sm font-black text-gray-400">
        No active workout assignments
      </p>

      <p className="mt-2 text-xs font-medium text-gray-600">
        This member currently has no active programs assigned.
      </p>
    </div>
  )
}

function AssignmentCard({
  assignment,
  onCancel,
  cancellingId,
}) {
  const program =
    assignment?.program || {}

  const workoutType =
    normalizeWorkoutType(
      program?.workoutType,
    )

  const isCancelling =
    cancellingId === assignment?._id

  return (
    <div className="rounded-3xl border border-white/10 bg white/[0.03] p-5 transition hover:border-white/20">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        {/* Program information */}
        <div className="min-w-0">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-lime-400/10 text-lime-400">
              <Dumbbell size={22} />
            </div>

            <div className="min-w-0">
              <h3 className="truncate text-base font-black text-white">
                {program?.name ||
                  "Workout Program"}
              </h3>

              <p className="mt-1 text-xs font-bold text-gray-500">
                {workoutType}
              </p>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <div className="flex items-center gap-2 rounded-full bg-white/5 px-3 py-2">
              <CalendarDays
                size={13}
                className="text-gray-500"
              />

              <span className="text-[10px] font-bold text-gray-400">
                Start:{" "}
                {formatDate(
                  assignment?.startDate,
                )}
              </span>
            </div>

            <div className="flex items-center gap-2 rounded-full bg-lime-400/10 px-3 py-2">
              <CheckCircle2
                size={13}
                className="text-lime-400"
              />

              <span className="text-[10px] font-black uppercase text-lime-400">
                {assignment?.status ||
                  "active"}
              </span>
            </div>

            {assignment?.endDate && (
              <div className="flex items-center gap-2 rounded-full bg-white/5 px-3 py-2">
                <CalendarDays
                  size={13}
                  className="text-gray-500"
                />

                <span className="text-[10px] font-bold text-gray-400">
                  End:{" "}
                  {formatDate(
                    assignment.endDate,
                  )}
                </span>
              </div>
            )}
          </div>

          {assignment?.notes && (
            <div className="mt-4 rounded-2xl border border-white/5 bg-black/20 p-3">
              <p className="text-[9px] font-black uppercase tracking-wider text-gray-600">
                Notes
              </p>

              <p className="mt-1 text-xs font-medium leading-5 text-gray-400">
                {assignment.notes}
              </p>
            </div>
          )}
        </div>

        {/* Cancel button */}
        <button
          type="button"
          onClick={() =>
            onCancel(assignment)
          }
          disabled={isCancelling}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-[10px] font-black uppercase tracking-wider text-red-400 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isCancelling ? (
            <Loader2
              size={15}
              className="animate-spin"
            />
          ) : (
            <Trash2 size={15} />
          )}

          {isCancelling
            ? "Cancelling..."
            : "Cancel Assignment"}
        </button>
      </div>
    </div>
  )
}

export default function MemberAssignments({
  memberId,
  onBack,
}) {
  const [assignments, setAssignments] =
    useState([])

  const [loading, setLoading] =
    useState(true)

  const [error, setError] =
    useState("")

  const [success, setSuccess] =
    useState("")

  const [cancellingId, setCancellingId] =
    useState("")

  const loadAssignments =
    async () => {
      try {
        setLoading(true)
        setError("")

        const response =
          await getProgramAssignments({
            memberId,
            status: "active",
          })

        const loadedAssignments =
          Array.isArray(
            response?.assignments,
          )
            ? response.assignments
            : []

        setAssignments(
          loadedAssignments,
        )
      } catch (err) {
        console.error(
          "Unable to load member assignments:",
          err,
        )

        setError(
          err.response?.data?.message ||
            err.message ||
            "Unable to load member assignments.",
        )
      } finally {
        setLoading(false)
      }
    }

  useEffect(() => {
    if (memberId) {
      loadAssignments()
    }
  }, [memberId])

  const member =
    assignments?.[0]?.member || null

  const memberName =
    getMemberName(member)

  const memberEmail =
    member?.email || ""

  const assignmentCount =
    assignments.length

  const workoutTypes =
    useMemo(() => {
      return [
        ...new Set(
          assignments
            .map(
              (assignment) =>
                normalizeWorkoutType(
                  assignment?.program
                    ?.workoutType,
                ),
            )
            .filter(Boolean),
        ),
      ]
    }, [assignments])

  const handleCancel =
    async (assignment) => {
      if (!assignment?._id) {
        return
      }

      const programName =
        assignment?.program?.name ||
        "this workout"

      const confirmed =
        window.confirm(
          `Are you sure you want to cancel "${programName}" for ${memberName}?`,
        )

      if (!confirmed) {
        return
      }

      try {
        setCancellingId(
          assignment._id,
        )

        setError("")
        setSuccess("")

        const response =
          await cancelProgramAssignment(
            assignment._id,
          )

        if (!response?.success) {
          throw new Error(
            response?.message ||
              "Unable to cancel assignment.",
          )
        }

        setAssignments(
          (current) =>
            current.filter(
              (item) =>
                item._id !==
                assignment._id,
            ),
        )

        setSuccess(
          response.message ||
            "Program assignment cancelled.",
        )
      } catch (err) {
        console.error(
          "Unable to cancel assignment:",
          err,
        )

        setError(
          err.response?.data?.message ||
            err.message ||
            "Unable to cancel assignment.",
        )
      } finally {
        setCancellingId("")
      }
    }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-black text-white">
        <div className="text-center">
          <Loader2
            size={30}
            className="mx-auto animate-spin text-lime-400"
          />

          <p className="mt-4 text-xs font-black uppercase tracking-wider text-gray-600">
            Loading member assignments...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black px-4 py-6 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        {/* Back button */}
        <button
          type="button"
          onClick={onBack}
          className="mb-6 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-[10px] font-black uppercase tracking-wider text-gray-400 transition hover:border-white/20 hover:text-white"
        >
          <ArrowLeft size={15} />
          Back to Assignments
        </button>

        {/* Header */}
        <div className="rounded-3xl border border-white/10 bg -white/[0.03] p-6 sm:p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-lime-400/10 text-lime-400">
                <User size={25} />
              </div>

              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-600">
                  Member Assignments
                </p>

                <h1 className="mt-1 text-2xl font-black tracking-tight text-white sm:text-3xl">
                  {memberName}
                </h1>

                {memberEmail && (
                  <p className="mt-1 text-xs font-medium text-gray-500">
                    {memberEmail}
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <div className="rounded-2xl border border-white/10 bg-black/20 px-5 py-4">
                <p className="text-[9px] font-black uppercase tracking-wider text-gray-600">
                  Active Programs
                </p>

                <p className="mt-1 text-2xl font-black text-lime-400">
                  {assignmentCount}
                </p>
              </div>

              {workoutTypes.length > 0 && (
                <div className="rounded-2xl border border-white/10 bg-black/20 px-5 py-4">
                  <p className="text-[9px] font-black uppercase tracking-wider text-gray-600">
                    Workout Types
                  </p>

                  <p className="mt-1 text-sm font-black text-white">
                    {workoutTypes.join(
                      " • ",
                    )}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="mt-5 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-xs font-bold text-red-400">
            {error}
          </div>
        )}

        {success && (
          <div className="mt-5 rounded-2xl border border-lime-400/20 bg-lime-400/10 px-4 py-3 text-xs font-bold text-lime-400">
            {success}
          </div>
        )}

        {/* Assignments */}
        <section className="mt-8">
          <div className="flex items-center gap-3">
            <Dumbbell
              size={18}
              className="text-yellow-400"
            />

            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-gray-600">
                MongoDB Assignments
              </p>

              <h2 className="mt-1 text-xl font-black text-white">
                Active Programs
              </h2>
            </div>
          </div>

          <div className="mt-5">
            {assignments.length ===
            0 ? (
              <EmptyState />
            ) : (
              <div className="space-y-4">
                {assignments.map(
                  (assignment) => (
                    <AssignmentCard
                      key={
                        assignment._id
                      }
                      assignment={
                        assignment
                      }
                      onCancel={
                        handleCancel
                      }
                      cancellingId={
                        cancellingId
                      }
                    />
                  ),
                )}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
