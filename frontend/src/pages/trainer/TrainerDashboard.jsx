import { useEffect, useMemo, useState } from "react"
import { motion } from "framer-motion"
import {
  BarChart3,
  CalendarDays,
  CheckCircle2,
  Dumbbell,
  Loader2,
  Users,
  ArrowRight,
  Activity,
  Clock3,
  Search,
  UserRound,
  Sparkles,
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

const pageVariants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.45,
      staggerChildren: 0.07,
    },
  },
}

const itemVariants = {
  hidden: {
    opacity: 0,
    y: 18,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: "easeOut",
    },
  },
}

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
        memberName(member).toLowerCase().includes(value) ||
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

    const response = await getProgramAssignments({
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

    const response = await getTrainerMemberProgress(
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

        const [memberResponse] = await Promise.all([
          getTrainerMember(selectedMemberId),
          loadAssignments(selectedMemberId),
          loadProgress(selectedMemberId, date),
        ])

        setSelectedMember(
          memberResponse?.member || null,
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
      loadAssignments(selectedMemberId),
      loadProgress(selectedMemberId, date),
    ])
  }

  const handleAssign = async (event) => {
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
        reminderEnabled: Boolean(startTime),
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

  const handleCancel = async (assignmentId) => {
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

  const completedToday = selectedProgress.filter(
    (item) => item?.workout?.completed,
  ).length

  const currentProgress = selectedProgress.length
    ? Math.max(
        ...selectedProgress.map(
          (item) =>
            Number(
              item?.workout?.progressPercent,
            ) || 0,
        ),
      )
    : 0

  if (loading) {
    return (
      <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#040912] text-white">
        <div className="trainer-background trainer-background-one" />
        <div className="trainer-background trainer-background-two" />

        <motion.div
          initial={{
            opacity: 0,
            scale: 0.9,
          }}
          animate={{
            opacity: 1,
            scale: 1,
          }}
          className="relative z-10 flex flex-col items-center"
        >
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-lime-400/20 bg-lime-400/10">
            <Loader2
              className="animate-spin text-lime-400"
              size={27}
            />
          </div>

          <p className="text-sm font-black">
            Loading trainer workspace
          </p>

          <p className="mt-1 text-xs text-gray-500">
            Preparing your gym dashboard...
          </p>
        </motion.div>

        <style>{trainerStyles}</style>
      </main>
    )
  }

  return (
    <motion.main
      variants={pageVariants}
      initial="hidden"
      animate="visible"
      className="relative min-h-screen overflow-hidden bg-[#040912] text-white"
    >
      <div className="trainer-background trainer-background-one" />
      <div className="trainer-background trainer-background-two" />

      {/* Header */}
      <motion.header
        variants={itemVariants}
        className="relative z-10 border-b border-white/10 bg-[#07111f]/90 backdrop-blur-xl"
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-5 sm:px-5 lg:px-7">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <motion.div
                animate={{
                  scale: [1, 1.08, 1],
                }}
                transition={{
                  duration: 2.8,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-lime-400/20 bg-lime-400/10"
              >
                <Dumbbell
                  size={15}
                  className="text-lime-400"
                />
              </motion.div>

              <p className="truncate text-[10px] font-black uppercase tracking-[0.18em] text-lime-400">
                {gymName}
              </p>
            </div>

            <h1 className="mt-2 text-xl font-black tracking-tight sm:text-2xl">
              Trainer Workspace
            </h1>

            <p className="mt-1 truncate text-xs text-gray-500">
              Welcome, {memberName(user)}
            </p>
          </div>

          <motion.div
            animate={{
              y: [0, -3, 0],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="hidden rounded-2xl border border-yellow-400/10 bg-yellow-400/5 p-3 sm:block"
          >
            <Sparkles
              size={18}
              className="text-yellow-400"
            />
          </motion.div>
        </div>
      </motion.header>

      <div className="relative z-10 mx-auto max-w-7xl px-4 py-5 sm:px-5 sm:py-7 lg:px-7">
        {/* Messages */}
        {error && (
          <motion.div
            initial={{
              opacity: 0,
              y: -10,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            className="mb-4 flex items-start gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300"
          >
            <span className="mt-0.5 shrink-0">!</span>
            <span>{error}</span>
          </motion.div>
        )}

        {success && (
          <motion.div
            initial={{
              opacity: 0,
              y: -10,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            className="mb-4 flex items-start gap-3 rounded-2xl border border-lime-400/20 bg-lime-400/10 px-4 py-3 text-sm text-lime-300"
          >
            <CheckCircle2
              size={17}
              className="mt-0.5 shrink-0"
            />
            <span>{success}</span>
          </motion.div>
        )}

        {/* Top stats */}
        <motion.section
          variants={itemVariants}
          className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4"
        >
          <TrainerStat
            icon={Users}
            label="My Members"
            value={members.length}
            description="Assigned to you"
            accent="lime"
            delay={0}
          />

          <TrainerStat
            icon={Dumbbell}
            label="Programs"
            value={programs.length}
            description="Active programs"
            accent="yellow"
            delay={0.06}
          />

          <TrainerStat
            icon={CalendarDays}
            label="Assignments"
            value={assignments.length}
            description="Active workouts"
            accent="white"
            delay={0.12}
          />

          <TrainerStat
            icon={BarChart3}
            label="Progress"
            value={`${currentProgress}%`}
            description="Selected member"
            accent="lime"
            delay={0.18}
          />
        </motion.section>

        <section className="grid gap-5 lg:grid-cols-[300px_1fr]">
          {/* Members */}
          <motion.aside
            variants={itemVariants}
            className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#07111f]/95 p-4 shadow-2xl shadow-black/10 backdrop-blur-xl sm:p-5"
          >
            <div className="absolute -right-16 -top-16 h-32 w-32 rounded-full bg-lime-400/5 blur-2xl" />

            <div className="relative">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Users
                    size={18}
                    className="text-lime-400"
                  />

                  <h2 className="font-black">
                    My Members
                  </h2>
                </div>

                <span className="rounded-full bg-white/5 px-2.5 py-1 text-[10px] font-black text-gray-500">
                  {members.length}
                </span>
              </div>

              <div className="relative mt-5">
                <Search
                  size={15}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-600"
                />

                <input
                  value={search}
                  onChange={(event) =>
                    setSearch(
                      event.target.value,
                    )
                  }
                  placeholder="Search member..."
                  className="w-full rounded-2xl border border-white/10 bg-[#040912] py-3 pl-10 pr-4 text-sm outline-none transition placeholder:text-gray-600 focus:border-lime-400/40"
                />
              </div>

              <div className="mt-4 max-h-[520px] space-y-2 overflow-y-auto pr-1">
                {filteredMembers.length ===
                0 ? (
                  <motion.div
                    initial={{
                      opacity: 0,
                    }}
                    animate={{
                      opacity: 1,
                    }}
                    className="rounded-2xl border border-dashed border-white/10 p-6 text-center"
                  >
                    <Users
                      size={22}
                      className="mx-auto text-gray-700"
                    />

                    <p className="mt-3 text-xs text-gray-500">
                      No members found in your
                      gym.
                    </p>
                  </motion.div>
                ) : (
                  filteredMembers.map(
                    (member, index) => {
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
                        <motion.button
                          key={id}
                          type="button"
                          onClick={() =>
                            setSelectedMemberId(
                              id,
                            )
                          }
                          initial={{
                            opacity: 0,
                            x: -10,
                          }}
                          animate={{
                            opacity: 1,
                            x: 0,
                          }}
                          transition={{
                            delay:
                              index * 0.025,
                          }}
                          whileHover={{
                            x: 3,
                          }}
                          whileTap={{
                            scale: 0.985,
                          }}
                          className={`group w-full rounded-2xl border p-3 text-left transition ${
                            selected
                              ? "border-lime-400/30 bg-lime-400/[0.08] shadow-lg shadow-lime-950/10"
                              : "border-white/10 bg-[#040912] hover:border-white/15"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xs font-black ${
                                selected
                                  ? "bg-lime-400 text-black"
                                  : "bg-white/5 text-gray-400"
                              }`}
                            >
                              {getInitials(
                                memberName(
                                  member,
                                ),
                              )}
                            </div>

                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-black">
                                {memberName(
                                  member,
                                )}
                              </p>

                              <p className="mt-1 truncate text-[10px] text-gray-600">
                                {member.email}
                              </p>
                            </div>

                            <ArrowRight
                              size={14}
                              className={`shrink-0 transition ${
                                selected
                                  ? "text-lime-400"
                                  : "text-gray-700 group-hover:text-gray-400"
                              }`}
                            />
                          </div>
                        </motion.button>
                      )
                    },
                  )
                )}
              </div>
            </div>
          </motion.aside>

          {/* Main workspace */}
          <div className="min-w-0 space-y-5">
            {/* Selected member */}
            <motion.section
              variants={itemVariants}
              className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#07111f]/95 p-5 shadow-2xl shadow-black/10 backdrop-blur-xl sm:p-6"
            >
              <div className="absolute -right-20 -top-20 h-44 w-44 rounded-full bg-lime-400/5 blur-3xl" />

              <div className="relative flex flex-col gap-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <motion.div
                      initial={{
                        scale: 0.8,
                        opacity: 0,
                      }}
                      animate={{
                        scale: 1,
                        opacity: 1,
                      }}
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-lime-400 text-sm font-black text-black shadow-lg shadow-lime-400/10"
                    >
                      {getInitials(
                        memberName(
                          selectedMember,
                        ),
                      )}
                    </motion.div>

                    <div className="min-w-0">
                      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-gray-600">
                        Selected Member
                      </p>

                      <h2 className="mt-1 truncate text-xl font-black sm:text-2xl">
                        {memberName(
                          selectedMember,
                        )}
                      </h2>

                      <p className="mt-1 truncate text-xs text-gray-500">
                        {selectedMember?.fitnessGoal ||
                          "Fitness goal not set"}
                      </p>
                    </div>
                  </div>

                  <motion.div
                    animate={{
                      rotate: [0, 3, -3, 0],
                    }}
                    transition={{
                      duration: 4,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                    className="hidden rounded-2xl border border-yellow-400/10 bg-yellow-400/5 p-3 sm:block"
                  >
                    <Dumbbell
                      size={19}
                      className="text-yellow-400"
                    />
                  </motion.div>
                </div>

                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                  <MemberMetric
                    label="Assigned"
                    value={assignments.length}
                    icon={CalendarDays}
                  />

                  <MemberMetric
                    label="Completed"
                    value={completedToday}
                    icon={CheckCircle2}
                    accent="lime"
                  />

                  <MemberMetric
                    label="Progress"
                    value={`${currentProgress}%`}
                    icon={BarChart3}
                    accent="yellow"
                  />
                </div>
              </div>
            </motion.section>

            {/* Progress */}
            <motion.section
              variants={itemVariants}
              className="rounded-3xl border border-white/10 bg-[#07111f]/95 p-5 shadow-2xl shadow-black/10 backdrop-blur-xl sm:p-6"
            >
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.14em] text-gray-600">
                    Workout progress
                  </p>

                  <h2 className="mt-1 text-xl font-black">
                    Daily Progress
                  </h2>
                </div>

                <label className="relative">
                  <Clock3
                    size={14}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-600"
                  />

                  <input
                    type="date"
                    value={date}
                    onChange={(event) =>
                      setDate(
                        event.target.value,
                      )
                    }
                    className="rounded-xl border border-white/10 bg-[#040912] py-2.5 pl-9 pr-3 text-xs text-white outline-none focus:border-lime-400/30"
                  />
                </label>
              </div>

              <div className="mt-5 space-y-3">
                {selectedProgress.length ===
                0 ? (
                  <motion.div
                    initial={{
                      opacity: 0,
                    }}
                    animate={{
                      opacity: 1,
                    }}
                    className="rounded-2xl border border-dashed border-white/10 p-7 text-center"
                  >
                    <Activity
                      size={24}
                      className="mx-auto text-gray-700"
                    />

                    <p className="mt-3 text-xs text-gray-500">
                      No workout assignment for
                      this date.
                    </p>
                  </motion.div>
                ) : (
                  selectedProgress.map(
                    (item, index) => {
                      const progressPercent =
                        Math.min(
                          100,
                          Number(
                            item
                              ?.workout
                              ?.progressPercent,
                          ) || 0,
                        )

                      return (
                        <motion.div
                          key={String(
                            item
                              .assignment
                              ?._id ||
                              index,
                          )}
                          initial={{
                            opacity: 0,
                            y: 12,
                          }}
                          animate={{
                            opacity: 1,
                            y: 0,
                          }}
                          transition={{
                            delay:
                              index * 0.06,
                          }}
                          className="rounded-2xl border border-white/10 bg-[#040912] p-4"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-black">
                                {item.program
                                  ?.name ||
                                  "Workout"}
                              </p>

                              <p className="mt-1 text-[10px] font-black uppercase tracking-wider text-gray-600">
                                {item.workout
                                  ?.status ||
                                  "not_started"}
                              </p>
                            </div>

                            <motion.p
                              key={
                                progressPercent
                              }
                              initial={{
                                opacity: 0,
                                scale: 0.75,
                              }}
                              animate={{
                                opacity: 1,
                                scale: 1,
                              }}
                              className="text-xl font-black text-lime-400"
                            >
                              {progressPercent}%
                            </motion.p>
                          </div>

                          <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
                            <motion.div
                              initial={{
                                width: 0,
                              }}
                              animate={{
                                width: `${progressPercent}%`,
                              }}
                              transition={{
                                duration: 0.9,
                                ease: "easeOut",
                              }}
                              className="h-full rounded-full bg-lime-400 shadow-[0_0_14px_rgba(215,255,53,.25)]"
                            />
                          </div>

                          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-gray-600">
                            <span>
                              {item.workout
                                ?.completedSets ||
                                0}{" "}
                              of{" "}
                              {item.workout
                                ?.totalSets ||
                                0}{" "}
                              sets
                            </span>

                            <span>
                              {item.workout
                                ?.caloriesBurned ||
                                0}{" "}
                              kcal
                            </span>
                          </div>
                        </motion.div>
                      )
                    },
                  )
                )}
              </div>
            </motion.section>

            {/* Assign workout */}
            <motion.section
              variants={itemVariants}
              className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#07111f]/95 p-5 shadow-2xl shadow-black/10 backdrop-blur-xl sm:p-6"
            >
              <div className="absolute -bottom-20 -right-20 h-40 w-40 rounded-full bg-yellow-400/5 blur-3xl" />

              <div className="relative">
                <div className="flex items-start gap-3">
                  <motion.div
                    animate={{
                      y: [0, -3, 0],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-lime-400/15 bg-lime-400/10"
                  >
                    <Dumbbell
                      size={17}
                      className="text-lime-400"
                    />
                  </motion.div>

                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.14em] text-gray-600">
                      Assign workout
                    </p>

                    <h2 className="mt-1 text-xl font-black">
                      Schedule a Program
                    </h2>
                  </div>
                </div>

                <form
                  onSubmit={handleAssign}
                  className="relative mt-5 grid gap-4 md:grid-cols-2"
                >
                  <FormField label="Program">
                    <select
                      value={programId}
                      onChange={(event) =>
                        setProgramId(
                          event.target.value,
                        )
                      }
                      className="trainer-input"
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
                  </FormField>

                  <FormField label="Workout date">
                    <input
                      type="date"
                      value={workoutDate}
                      onChange={(event) =>
                        setWorkoutDate(
                          event.target.value,
                        )
                      }
                      className="trainer-input"
                    />
                  </FormField>

                  <FormField label="Start time">
                    <input
                      type="time"
                      value={startTime}
                      onChange={(event) =>
                        setStartTime(
                          event.target.value,
                        )
                      }
                      className="trainer-input"
                    />
                  </FormField>

                  <FormField label="End time">
                    <input
                      type="time"
                      value={endTime}
                      onChange={(event) =>
                        setEndTime(
                          event.target.value,
                        )
                      }
                      className="trainer-input"
                    />
                  </FormField>

                  <FormField
                    label="Trainer notes"
                    full
                  >
                    <textarea
                      value={notes}
                      onChange={(event) =>
                        setNotes(
                          event.target.value,
                        )
                      }
                      rows={3}
                      className="trainer-input resize-none"
                      placeholder="Optional notes for this workout..."
                    />
                  </FormField>

                  <motion.button
                    type="submit"
                    disabled={
                      saving ||
                      !selectedMemberId
                    }
                    whileHover={
                      saving ||
                      !selectedMemberId
                        ? {}
                        : {
                            y: -2,
                            scale: 1.01,
                          }
                    }
                    whileTap={
                      saving ||
                      !selectedMemberId
                        ? {}
                        : {
                            scale: 0.98,
                          }
                    }
                    className="flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-lime-400 px-5 text-xs font-black text-black shadow-lg shadow-lime-400/10 transition hover:bg-lime-300 disabled:cursor-not-allowed disabled:opacity-40 md:col-span-2"
                  >
                    {saving ? (
                      <>
                        <Loader2
                          size={15}
                          className="animate-spin"
                        />
                        SAVING...
                      </>
                    ) : (
                      <>
                        ASSIGN WORKOUT
                        <ArrowRight
                          size={15}
                        />
                      </>
                    )}
                  </motion.button>
                </form>
              </div>
            </motion.section>

            {/* Upcoming assignments */}
            <motion.section
              variants={itemVariants}
              className="rounded-3xl border border-white/10 bg-[#07111f]/95 p-5 shadow-2xl shadow-black/10 backdrop-blur-xl sm:p-6"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.14em] text-gray-600">
                    Scheduled
                  </p>

                  <h2 className="mt-1 text-xl font-black">
                    Upcoming Assignments
                  </h2>
                </div>

                <CalendarDays
                  size={18}
                  className="text-yellow-400"
                />
              </div>

              <div className="mt-4 space-y-2">
                {assignments.length ===
                0 ? (
                  <div className="rounded-2xl border border-dashed border-white/10 p-7 text-center">
                    <CalendarDays
                      size={24}
                      className="mx-auto text-gray-700"
                    />

                    <p className="mt-3 text-xs text-gray-500">
                      No active workout
                      assignments.
                    </p>
                  </div>
                ) : (
                  assignments.map(
                    (assignment, index) => (
                      <motion.div
                        key={String(
                          assignment._id,
                        )}
                        initial={{
                          opacity: 0,
                          y: 10,
                        }}
                        animate={{
                          opacity: 1,
                          y: 0,
                        }}
                        transition={{
                          delay:
                            index * 0.05,
                        }}
                        whileHover={{
                          y: -2,
                        }}
                        className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-[#040912] p-4 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-yellow-400/10 text-yellow-400">
                            <CalendarDays
                              size={16}
                            />
                          </div>

                          <div className="min-w-0">
                            <p className="truncate text-sm font-black">
                              {assignment
                                .program
                                ?.name ||
                                "Workout"}
                            </p>

                            <p className="mt-1 text-[10px] text-gray-600">
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
                        </div>

                        <motion.button
                          type="button"
                          disabled={saving}
                          onClick={() =>
                            handleCancel(
                              assignment._id,
                            )
                          }
                          whileHover={{
                            scale: 1.03,
                          }}
                          whileTap={{
                            scale: 0.97,
                          }}
                          className="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-2.5 text-[10px] font-black text-red-300 transition hover:bg-red-500/10 disabled:opacity-40"
                        >
                          CANCEL
                        </motion.button>
                      </motion.div>
                    ),
                  )
                )}
              </div>
            </motion.section>
          </div>
        </section>
      </div>

      <style>{trainerStyles}</style>
    </motion.main>
  )
}

/* -------------------------------------------------------------------------- */
/* Components                                                                 */
/* -------------------------------------------------------------------------- */

function TrainerStat({
  icon: Icon,
  label,
  value,
  description,
  accent = "lime",
  delay = 0,
}) {
  const accentMap = {
    lime: {
      text: "var(--gb-lime)",
      bg: "rgba(215,255,53,.09)",
      border: "rgba(215,255,53,.15)",
    },
    yellow: {
      text: "var(--gb-yellow)",
      bg: "rgba(255,225,59,.08)",
      border: "rgba(255,225,59,.14)",
    },
    white: {
      text: "#e8ebef",
      bg: "rgba(255,255,255,.06)",
      border: "rgba(255,255,255,.09)",
    },
  }

  const theme =
    accentMap[accent] ||
    accentMap.lime

  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 18,
        scale: 0.97,
      }}
      animate={{
        opacity: 1,
        y: 0,
        scale: 1,
      }}
      transition={{
        duration: 0.4,
        delay,
      }}
      whileHover={{
        y: -4,
        scale: 1.01,
      }}
      className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#07111f]/95 p-4 shadow-xl shadow-black/10 backdrop-blur-xl"
    >
      <div
        className="absolute -right-8 -top-8 h-20 w-20 rounded-full blur-2xl"
        style={{
          background: theme.bg,
        }}
      />

      <div className="relative">
        <div
          className="flex h-9 w-9 items-center justify-center rounded-xl border"
          style={{
            background: theme.bg,
            borderColor: theme.border,
            color: theme.text,
          }}
        >
          <Icon size={16} />
        </div>

        <p className="mt-4 text-[9px] font-black uppercase tracking-[0.12em] text-gray-600">
          {label}
        </p>

        <motion.p
          key={String(value)}
          initial={{
            opacity: 0,
            y: 6,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          className="mt-1 text-2xl font-black tracking-tight"
        >
          {value}
        </motion.p>

        <p className="mt-1 truncate text-[10px] text-gray-600">
          {description}
        </p>
      </div>
    </motion.div>
  )
}

function MemberMetric({
  label,
  value,
  icon: Icon,
  accent = "white",
}) {
  const iconColor =
    accent === "lime"
      ? "text-lime-400"
      : accent === "yellow"
        ? "text-yellow-400"
        : "text-gray-400"

  return (
    <motion.div
      whileHover={{
        y: -2,
      }}
      className="rounded-2xl border border-white/10 bg-[#040912] p-3 sm:p-4"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[9px] font-black uppercase tracking-wider text-gray-600">
          {label}
        </span>

        <Icon
          size={14}
          className={iconColor}
        />
      </div>

      <motion.p
        key={String(value)}
        initial={{
          opacity: 0,
          scale: 0.8,
        }}
        animate={{
          opacity: 1,
          scale: 1,
        }}
        className={`mt-2 text-xl font-black sm:text-2xl ${
          accent === "lime"
            ? "text-lime-400"
            : accent === "yellow"
              ? "text-yellow-400"
              : "text-white"
        }`}
      >
        {value}
      </motion.p>
    </motion.div>
  )
}

function FormField({
  label,
  children,
  full = false,
}) {
  return (
    <label
      className={
        full
          ? "text-[10px] font-black text-gray-500 md:col-span-2"
          : "text-[10px] font-black text-gray-500"
      }
    >
      {label}
      <div className="mt-2">
        {children}
      </div>
    </label>
  )
}

function getInitials(name) {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)

  if (!parts.length) {
    return "M"
  }

  if (parts.length === 1) {
    return parts[0]
      .slice(0, 2)
      .toUpperCase()
  }

  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
}

const trainerStyles = `
  :root {
    --gb-lime: #d7ff35;
    --gb-yellow: #ffe13b;
  }

  .trainer-background {
    position: absolute;
    pointer-events: none;
    border-radius: 999px;
    filter: blur(80px);
    z-index: 0;
  }

  .trainer-background-one {
    width: 260px;
    height: 260px;
    right: -100px;
    top: 120px;
    background: rgba(215,255,53,.07);
  }

  .trainer-background-two {
    width: 220px;
    height: 220px;
    left: -100px;
    bottom: 160px;
    background: rgba(255,225,59,.045);
  }

  .trainer-input {
    width: 100%;
    min-height: 46px;
    border-radius: 15px;
    border: 1px solid rgba(255,255,255,.10);
    background: #040912;
    padding: 0 14px;
    color: #fff;
    font-size: 12px;
    font-weight: 500;
    outline: none;
    transition:
      border-color .2s ease,
      box-shadow .2s ease,
      background .2s ease;
  }

  .trainer-input::placeholder {
    color: #4d5662;
  }

  .trainer-input:focus {
    border-color: rgba(215,255,53,.40);
    box-shadow: 0 0 0 3px rgba(215,255,53,.045);
    background: #050a11;
  }

  .trainer-input:disabled {
    opacity: .5;
    cursor: not-allowed;
  }

  textarea.trainer-input {
    padding-top: 13px;
    padding-bottom: 13px;
  }

  select.trainer-input {
    cursor: pointer;
  }

  @media (max-width: 640px) {
    .trainer-input {
      min-height: 48px;
      border-radius: 14px;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .trainer-background {
      display: none;
    }
  }
`

export default TrainerDashboard