import { useEffect, useMemo, useState } from "react"
import {
  BarChart3,
  CalendarDays,
  CheckCircle2,
  Dumbbell,
  Loader2,
  Users,
} from "lucide-react"

import {
  cancelProgramAssignment,
  createProgramAssignment,
  getProgramAssignments,
  getPrograms,
  getTrainerMember,
  getTrainerMemberProgress,
  getTrainerMembers,
} from "../../api/api.js"

import { useAuth } from "../../context/AuthContext.jsx"
import { useGym } from "../../context/GymContext.jsx"

const todayKey = () => {
  const date = new Date()
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")

  return `${y}-${m}-${d}`
}

const memberName = (member) =>
  `${member?.firstName || ""} ${member?.lastName || ""}`.trim() ||
  member?.email ||
  "Member"

function TrainerDashboard() {
  const { user } = useAuth() || {}
  const { gym } = useGym() || {}

  const gymName =
    gym?.name?.trim() ||
    user?.gym?.name?.trim() ||
    "Gym"

  const [members, setMembers] = useState([])
  const [programs, setPrograms] = useState([])
  const [assignments, setAssignments] = useState([])
  const [selectedMemberId, setSelectedMemberId] = useState("")
  const [selectedMember, setSelectedMember] = useState(null)
  const [progress, setProgress] = useState([])

  const [date, setDate] = useState(todayKey())
  const [programId, setProgramId] = useState("")
  const [workoutDate, setWorkoutDate] = useState(todayKey())
  const [startTime, setStartTime] = useState("")
  const [endTime, setEndTime] = useState("")
  const [notes, setNotes] = useState("")
  const [search, setSearch] = useState("")

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const selectedProgress = progress?.[0]?.assignments || []

  const filteredMembers = useMemo(() => {
    const value = search.trim().toLowerCase()

    if (!value) {
      return members
    }

    return members.filter(
      (member) =>
        memberName(member)
          .toLowerCase()
          .includes(value) ||
        String(member.email || "")
          .toLowerCase()
          .includes(value),
    )
  }, [members, search])

  const loadMembers = async () => {
    const response = await getTrainerMembers()

    const list = Array.isArray(response?.members)
      ? response.members
      : []

    setMembers(list)

    if (!selectedMemberId && list.length) {
      setSelectedMemberId(String(list[0]._id))
    }
  }

  const loadPrograms = async () => {
    const response = await getPrograms({
      active: true,
    })

    setPrograms(
      Array.isArray(response?.programs)
        ? response.programs
        : [],
    )
  }

  const loadAssignments = async (memberId) => {
    if (!memberId) {
      setAssignments([])
      return
    }

    const response =
      await getProgramAssignments({
        member: memberId,
        status: "active",
      })

    setAssignments(
      Array.isArray(response?.assignments)
        ? response.assignments
        : [],
    )
  }

  const loadProgress = async (
    memberId,
    selectedDate,
  ) => {
    if (!memberId) {
      setProgress([])
      return
    }

    const response =
      await getTrainerMemberProgress(
        memberId,
        {
          date: selectedDate,
        },
      )

    setProgress(
      response?.member
        ? [
            {
              member: response.member,
              assignments:
                response.assignments || [],
            },
          ]
        : [],
    )
  }

  useEffect(() => {
    let mounted = true

    const load = async () => {
      try {
        setLoading(true)
        setError("")

        await Promise.all([
          loadMembers(),
          loadPrograms(),
        ])
      } catch (err) {
        if (mounted) {
          setError(
            err?.response?.data?.message ||
              err?.message ||
              "Unable to load trainer workspace.",
          )
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    load()

    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    if (!selectedMemberId) {
      return
    }

    const loadSelected = async () => {
      try {
        setError("")

        const [memberResponse] =
          await Promise.all([
            getTrainerMember(
              selectedMemberId,
            ),
            loadAssignments(
              selectedMemberId,
            ),
            loadProgress(
              selectedMemberId,
              date,
            ),
          ])

        setSelectedMember(
          memberResponse?.member ||
            null,
        )
      } catch (err) {
        setError(
          err?.response?.data?.message ||
            err?.message ||
            "Unable to load member information.",
        )
      }
    }

    loadSelected()
  }, [selectedMemberId, date])

  const refreshSelected = async () => {
    await Promise.all([
      loadAssignments(
        selectedMemberId,
      ),
      loadProgress(
        selectedMemberId,
        date,
      ),
    ])
  }

  const handleAssign = async (
    event,
  ) => {
    event.preventDefault()

    if (
      !selectedMemberId ||
      !programId ||
      !workoutDate
    ) {
      setError(
        "Member, program and workout date are required.",
      )
      return
    }

    try {
      setSaving(true)
      setError("")
      setSuccess("")

      await createProgramAssignment({
        memberId: selectedMemberId,
        programId,
        workoutDate,
        startTime,
        endTime,
        reminderEnabled:
          Boolean(startTime),
        reminderMinutesBefore: 5,
        notes,
      })

      setSuccess(
        "Workout assigned successfully.",
      )

      setProgramId("")
      setNotes("")

      await refreshSelected()
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to assign workout.",
      )
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = async (
    assignmentId,
  ) => {
    try {
      setSaving(true)
      setError("")
      setSuccess("")

      await cancelProgramAssignment(
        assignmentId,
      )

      setSuccess(
        "Workout assignment cancelled.",
      )

      await refreshSelected()
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to cancel workout assignment.",
      )
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#06111f] text-white">
        <Loader2
          className="animate-spin text-lime-400"
          size={30}
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#06111f] text-white">
      <header className="border-b border-white/10 bg-[#081525]">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-lime-400">
              {gymName}
            </p>

            <h1 className="mt-1 text-2xl font-black">
              Trainer Workspace
            </h1>

            <p className="mt-1 text-xs text-gray-400">
              Welcome, {memberName(user)}
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-5 py-7">
        {error && (
          <div className="mb-5 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-5 rounded-2xl border border-lime-400/20 bg-lime-400/10 px-4 py-3 text-sm text-lime-300">
            {success}
          </div>
        )}

        <section className="grid gap-5 lg:grid-cols-[320px_1fr]">
          <aside className="rounded-3xl border border-white/10 bg-[#081525] p-5">
            <div className="flex items-center gap-2">
              <Users
                size={18}
                className="text-lime-400"
              />

              <h2 className="font-black">
                My Members
              </h2>
            </div>

            <input
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value,
                )
              }
              placeholder="Search member..."
              className="mt-5 w-full rounded-2xl border border-white/10 bg-[#06111f] px-4 py-3 text-sm outline-none focus:border-lime-400/40"
            />

            <div className="mt-4 space-y-2">
              {filteredMembers.length ===
              0 ? (
                <p className="rounded-2xl border border-dashed border-white/10 p-5 text-center text-xs text-gray-500">
                  No members found in your gym.
                </p>
              ) : (
                filteredMembers.map(
                  (member) => {
                    const id =
                      String(
                        member._id,
                      )

                    const selected =
                      id ===
                      String(
                        selectedMemberId,
                      )

                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() =>
                          setSelectedMemberId(
                            id,
                          )
                        }
                        className={`w-full rounded-2xl border p-4 text-left ${
                          selected
                            ? "border-lime-400/40 bg-lime-400/10"
                            : "border-white/10 bg-[#06111f]"
                        }`}
                      >
                        <p className="text-sm font-black">
                          {memberName(
                            member,
                          )}
                        </p>

                        <p className="mt-1 text-[11px] text-gray-500">
                          {member.email}
                        </p>
                      </button>
                    )
                  },
                )
              )}
            </div>
          </aside>

          <div className="space-y-5">
            <section className="rounded-3xl border border-white/10 bg-[#081525] p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-wider text-gray-500">
                    Member
                  </p>

                  <h2 className="mt-1 text-2xl font-black">
                    {memberName(
                      selectedMember,
                    )}
                  </h2>

                  <p className="mt-1 text-xs text-gray-400">
                    {selectedMember?.fitnessGoal ||
                      "Fitness goal not set"}
                  </p>
                </div>

                <Dumbbell className="text-yellow-400" />
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <Stat
                  label="Assigned Workouts"
                  value={
                    assignments.length
                  }
                  icon={CalendarDays}
                />

                <Stat
                  label="Completed Today"
                  value={
                    selectedProgress.filter(
                      (item) =>
                        item?.workout
                          ?.completed,
                    ).length
                  }
                  icon={
                    CheckCircle2
                  }
                />

                <Stat
                  label="Progress"
                  value={
                    selectedProgress.length
                      ? `${Math.max(
                          ...selectedProgress.map(
                            (item) =>
                              Number(
                                item
                                  ?.workout
                                  ?.progressPercent,
                              ) || 0,
                          ),
                        )}%`
                      : "0%"
                  }
                  icon={BarChart3}
                />
              </div>
            </section>

            <section className="rounded-3xl border border-white/10 bg-[#081525] p-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-wider text-gray-500">
                    Workout progress
                  </p>

                  <h2 className="mt-1 text-xl font-black">
                    Daily Progress
                  </h2>
                </div>

                <input
                  type="date"
                  value={date}
                  onChange={(event) =>
                    setDate(
                      event.target.value,
                    )
                  }
                  className="rounded-xl border border-white/10 bg-[#06111f] px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="mt-5 space-y-3">
                {selectedProgress.length ===
                0 ? (
                  <p className="rounded-2xl border border-dashed border-white/10 p-6 text-center text-xs text-gray-500">
                    No workout assignment for this date.
                  </p>
                ) : (
                  selectedProgress.map(
                    (item) => (
                      <div
                        key={String(
                          item
                            .assignment
                            ?._id,
                        )}
                        className="rounded-2xl border border-white/10 bg-[#06111f] p-4"
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <p className="text-sm font-black">
                              {item
                                .program
                                ?.name ||
                                "Workout"}
                            </p>

                            <p className="mt-1 text-[11px] uppercase tracking-wider text-gray-500">
                              {item
                                .workout
                                ?.status ||
                                "not_started"}
                            </p>
                          </div>

                          <p className="text-xl font-black text-lime-400">
                            {item
                              .workout
                              ?.progressPercent ||
                              0}
                            %
                          </p>
                        </div>

                        <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                          <div
                            className="h-full rounded-full bg-lime-400"
                            style={{
                              width: `${Math.min(
                                100,
                                Number(
                                  item
                                    .workout
                                    ?.progressPercent,
                                ) || 0,
                              )}%`,
                            }}
                          />
                        </div>

                        <p className="mt-3 text-xs text-gray-500">
                          {item
                            .workout
                            ?.completedSets ||
                            0}{" "}
                          of{" "}
                          {item
                            .workout
                            ?.totalSets ||
                            0}{" "}
                          sets completed ·{" "}
                          {item
                            .workout
                            ?.caloriesBurned ||
                            0}{" "}
                          kcal
                        </p>
                      </div>
                    ),
                  )
                )}
              </div>
            </section>

            <section className="rounded-3xl border border-white/10 bg-[#081525] p-6">
              <p className="text-[11px] font-black uppercase tracking-wider text-gray-500">
                Assign workout
              </p>

              <h2 className="mt-1 text-xl font-black">
                Schedule a Program
              </h2>

              <form
                onSubmit={handleAssign}
                className="mt-5 grid gap-4 md:grid-cols-2"
              >
                <label className="text-xs font-black text-gray-400">
                  Program

                  <select
                    value={programId}
                    onChange={(event) =>
                      setProgramId(
                        event.target.value,
                      )
                    }
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-[#06111f] px-4 py-3 text-sm font-normal text-white"
                  >
                    <option value="">
                      Select program
                    </option>

                    {programs.map(
                      (program) => (
                        <option
                          key={String(
                            program._id,
                          )}
                          value={String(
                            program._id,
                          )}
                        >
                          {program.name}
                        </option>
                      ),
                    )}
                  </select>
                </label>

                <label className="text-xs font-black text-gray-400">
                  Workout date

                  <input
                    type="date"
                    value={workoutDate}
                    onChange={(event) =>
                      setWorkoutDate(
                        event.target.value,
                      )
                    }
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-[#06111f] px-4 py-3 text-sm font-normal text-white"
                  />
                </label>

                <label className="text-xs font-black text-gray-400">
                  Start time

                  <input
                    type="time"
                    value={startTime}
                    onChange={(event) =>
                      setStartTime(
                        event.target.value,
                      )
                    }
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-[#06111f] px-4 py-3 text-sm font-normal text-white"
                  />
                </label>

                <label className="text-xs font-black text-gray-400">
                  End time

                  <input
                    type="time"
                    value={endTime}
                    onChange={(event) =>
                      setEndTime(
                        event.target.value,
                      )
                    }
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-[#06111f] px-4 py-3 text-sm font-normal text-white"
                  />
                </label>

                <label className="text-xs font-black text-gray-400 md:col-span-2">
                  Trainer notes

                  <textarea
                    value={notes}
                    onChange={(event) =>
                      setNotes(
                        event.target.value,
                      )
                    }
                    rows={3}
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-[#06111f] px-4 py-3 text-sm font-normal text-white"
                    placeholder="Optional notes for this workout..."
                  />
                </label>

                <button
                  type="submit"
                  disabled={
                    saving ||
                    !selectedMemberId
                  }
                  className="rounded-2xl bg-lime-400 px-5 py-3 text-xs font-black text-black disabled:opacity-50 md:col-span-2"
                >
                  {saving
                    ? "SAVING..."
                    : "ASSIGN WORKOUT"}
                </button>
              </form>
            </section>

            <section className="rounded-3xl border border-white/10 bg-[#081525] p-6">
              <h2 className="text-xl font-black">
                Upcoming Assignments
              </h2>

              <div className="mt-4 space-y-2">
                {assignments.map(
                  (assignment) => (
                    <div
                      key={String(
                        assignment._id,
                      )}
                      className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-[#06111f] p-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <p className="text-sm font-black">
                          {assignment
                            .program
                            ?.name ||
                            "Workout"}
                        </p>

                        <p className="mt-1 text-xs text-gray-500">
                          {String(
                            assignment.workoutDate,
                          ).slice(
                            0,
                            10,
                          )}{" "}
                          ·{" "}
                          {assignment.startTime ||
                            "No start time"}
                        </p>
                      </div>

                      <button
                        type="button"
                        disabled={
                          saving
                        }
                        onClick={() =>
                          handleCancel(
                            assignment._id,
                          )
                        }
                        className="rounded-xl border border-red-500/20 px-3 py-2 text-[10px] font-black text-red-300"
                      >
                        CANCEL
                      </button>
                    </div>
                  ),
                )}
              </div>
            </section>
          </div>
        </section>
      </main>
    </div>
  )
}

function Stat({
  label,
  value,
  icon: Icon,
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#06111f] p-4">
      <Icon
        size={16}
        className="text-lime-400"
      />

      <p className="mt-3 text-[10px] font-black uppercase tracking-wider text-gray-500">
        {label}
      </p>

      <p className="mt-1 text-xl font-black">
        {value}
      </p>
    </div>
  )
}

export default TrainerDashboard