import {
  CalendarDays,
  Check,
  ChevronDown,
  Dumbbell,
  Loader2,
  Search,
  UserCheck,
  Users,
} from "lucide-react"

import {
  useEffect,
  useMemo,
  useState,
} from "react"

import {
  useLocation,
  useNavigate,
} from "react-router-dom"

import {
  cancelProgramAssignment,
  createProgramAssignment,
  getMembers,
  getProgramAssignments,
  getPrograms,
} from "../../api/api.js"

import { useGym } from "../../context/GymContext"

/*
|--------------------------------------------------------------------------
| Normalize workout type
|--------------------------------------------------------------------------
*/

const normalizeWorkoutType = (
  value,
) => {
  const normalized =
    String(value || "")
      .trim()
      .toLowerCase()
      .replace(
        /[_-]+/g,
        " ",
      )

  if (
    normalized ===
    "lower body"
  ) {
    return "Lower Body"
  }

  if (
    normalized ===
    "upper body"
  ) {
    return "Upper Body"
  }

  if (
    normalized ===
    "crossfit"
  ) {
    return "CrossFit"
  }

  if (
    normalized ===
    "tabata"
  ) {
    return "Tabata"
  }

  return String(
    value || "",
  ).trim()
}

const workoutTypes = [
  {
    value: "",
    label: "All Workout Types",
  },
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
]

function Assignments() {
  const navigate = useNavigate()
  const location = useLocation()

  const { gym } = useGym() || {}

  const gymName =
    gym?.name?.trim() || "Gym"

  const isTrainerPage =
    location.pathname.startsWith(
      "/trainer",
    )

  const [members, setMembers] =
    useState([])

  const [programs, setPrograms] =
    useState([])

  const [assignments, setAssignments] =
    useState([])

  const [memberSearch, setMemberSearch] =
    useState("")

  const [selectedMemberId, setSelectedMemberId] =
    useState("")

  const [selectedProgramId, setSelectedProgramId] =
    useState("")

  const [workoutType, setWorkoutType] =
    useState("")

  const [workoutDate, setWorkoutDate] =
    useState(getLocalDateKey())

  const [startTime, setStartTime] =
    useState("18:00")

  const [endTime, setEndTime] =
    useState("19:00")

  const [reminderEnabled, setReminderEnabled] =
    useState(true)

  const [reminderMinutesBefore, setReminderMinutesBefore] =
    useState(5)

  const [notes, setNotes] =
    useState("")

  const [loading, setLoading] =
    useState(true)

  const [assigning, setAssigning] =
    useState(false)

  const [deletingId, setDeletingId] =
    useState("")

  const [error, setError] =
    useState("")

  const [success, setSuccess] =
    useState("")

  /*
  |--------------------------------------------------------------------------
  | Load members, programs and assignments
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      setError("")

      /*
      |--------------------------------------------------------------------------
      | Members from MongoDB
      |--------------------------------------------------------------------------
      */

      const memberResponse =
        await getMembers({
          active: true,
        })

      setMembers(
        Array.isArray(
          memberResponse?.members,
        )
          ? memberResponse.members
          : [],
      )

      /*
      |--------------------------------------------------------------------------
      | Programs from MongoDB
      |--------------------------------------------------------------------------
      */

      const programResponse =
        await getPrograms()

      console.log(
        "PROGRAM API RESPONSE:",
        programResponse,
      )

      let loadedPrograms = []

      if (
        Array.isArray(
          programResponse,
        )
      ) {
        loadedPrograms =
          programResponse
      } else if (
        Array.isArray(
          programResponse?.programs,
        )
      ) {
        loadedPrograms =
          programResponse.programs
      } else if (
        Array.isArray(
          programResponse?.data?.programs,
        )
      ) {
        loadedPrograms =
          programResponse.data.programs
      } else if (
        Array.isArray(
          programResponse?.data,
        )
      ) {
        loadedPrograms =
          programResponse.data
      }

      console.log(
        "LOADED PROGRAMS:",
        loadedPrograms,
      )

      setPrograms(
        loadedPrograms.filter(
          (program) =>
            program?.isActive !== false,
        ),
      )

      /*
      |--------------------------------------------------------------------------
      | Assignments from MongoDB
      |--------------------------------------------------------------------------
      */

      const assignmentResponse =
        await getProgramAssignments({
          status: "active",
        })

      setAssignments(
        Array.isArray(
          assignmentResponse?.assignments,
        )
          ? assignmentResponse.assignments
          : [],
      )
    } catch (err) {
      console.error(
        "Unable to load assignment data:",
        err,
      )

      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to load assignment data.",
      )
    } finally {
      setLoading(false)
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Filter members
  |--------------------------------------------------------------------------
  */

  const filteredMembers =
    useMemo(() => {
      const query =
        memberSearch
          .trim()
          .toLowerCase()

      if (!query) {
        return members
      }

      return members.filter(
        (member) => {
          const name =
            member.fullName ||
            `${member.firstName || ""} ${member.lastName || ""}`.trim()

          return (
            name
              .toLowerCase()
              .includes(query) ||
            String(
              member.email || "",
            )
              .toLowerCase()
              .includes(query)
          )
        },
      )
    }, [
      members,
      memberSearch,
    ])

  /*
  |--------------------------------------------------------------------------
  | Filter programs
  |--------------------------------------------------------------------------
  */

  const filteredPrograms =
    useMemo(() => {
      if (!workoutType) {
        return programs
      }

      const selectedType =
        normalizeWorkoutType(
          workoutType,
        )

      return programs.filter(
        (program) => {
          const programType =
            normalizeWorkoutType(
              program?.workoutType ||
                program?.type ||
                program?.category,
            )

          return (
            programType ===
            selectedType
          )
        },
      )
    }, [
      programs,
      workoutType,
    ])

  /*
  |--------------------------------------------------------------------------
  | Selected member
  |--------------------------------------------------------------------------
  */

  const selectedMember =
    members.find(
      (member) =>
        String(
          member._id ||
            member.id,
        ) ===
        String(
          selectedMemberId,
        ),
    )

  /*
  |--------------------------------------------------------------------------
  | Selected MongoDB program
  |--------------------------------------------------------------------------
  */

  const selectedProgram =
    programs.find(
      (program) =>
        String(
          program._id,
        ) ===
        String(
          selectedProgramId,
        ),
    )

  /*
  |--------------------------------------------------------------------------
  | Select workout type
  |--------------------------------------------------------------------------
  */

  const handleWorkoutTypeChange =
    (event) => {
      const value =
        event.target.value

      setWorkoutType(value)
      setSelectedProgramId("")
    }

  /*
  |--------------------------------------------------------------------------
  | Assign program
  |--------------------------------------------------------------------------
  */

  const handleAssign = async (
    event,
  ) => {
    event.preventDefault()

    setError("")
    setSuccess("")

    if (!selectedMemberId) {
      setError(
        "Please select a member.",
      )

      return
    }

    if (!selectedProgramId) {
      setError(
        "Please select a workout program.",
      )

      return
    }

    if (!workoutDate) {
      setError(
        "Please select a workout date.",
      )

      return
    }

    if (!startTime || !endTime) {
      setError(
        "Please select both a start time and an end time.",
      )

      return
    }

    if (endTime <= startTime) {
      setError(
        "End time must be later than start time.",
      )

      return
    }

    try {
      setAssigning(true)

      const response =
        await createProgramAssignment(
          {
            memberId:
              selectedMemberId,

            programId:
              selectedProgramId,

            workoutDate,

            startTime,

            endTime,

            reminderEnabled,

            reminderMinutesBefore:
              Number(reminderMinutesBefore),

            notes:
              notes.trim(),
          },
        )

      if (!response?.success) {
        throw new Error(
          response?.message ||
            "Unable to assign program.",
        )
      }

      setSuccess(
        response.message ||
          "Program assigned successfully.",
      )

      setAssignments(
        (current) => [
          response.assignment,
          ...current,
        ],
      )

      setSelectedMemberId("")
      setSelectedProgramId("")
      setNotes("")
      setWorkoutDate(getLocalDateKey())
      setStartTime("18:00")
      setEndTime("19:00")
      setReminderEnabled(true)
      setReminderMinutesBefore(5)
    } catch (err) {
      console.error(
        "Assignment error:",
        err,
      )

      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to assign program.",
      )
    } finally {
      setAssigning(false)
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Delete / cancel assignment
  |--------------------------------------------------------------------------
  */

  const handleDeleteAssignment =
    async (
      assignment,
    ) => {
      const assignmentId =
        assignment?._id

      if (!assignmentId) {
        setError(
          "Unable to identify this workout assignment.",
        )

        return
      }

      const member =
        assignment.member

      const program =
        assignment.program

      const memberName =
        member
          ? `${member.firstName || ""} ${member.lastName || ""}`.trim()
          : "this member"

      const programName =
        program?.name ||
        "this workout"

      const confirmed =
        window.confirm(
          `Delete the "${programName}" assignment for ${memberName}? This will remove the active assignment from the member.`,
        )

      if (!confirmed) {
        return
      }

      try {
        setError("")
        setSuccess("")
        setDeletingId(
          assignmentId,
        )

        const response =
          await cancelProgramAssignment(
            assignmentId,
          )

        if (
          response?.success ===
          false
        ) {
          throw new Error(
            response?.message ||
              "Unable to delete assignment.",
          )
        }

        /*
        |--------------------------------------------------------------------------
        | Remove the assignment immediately
        |--------------------------------------------------------------------------
        */

        setAssignments(
          (current) =>
            current.filter(
              (item) =>
                String(
                  item._id,
                ) !==
                String(
                  assignmentId,
                ),
            ),
        )

        setSuccess(
          response?.message ||
            "Workout assignment deleted successfully.",
        )
      } catch (err) {
        console.error(
          "Delete assignment error:",
          err,
        )

        setError(
          err.response?.data?.message ||
            err.message ||
            "Unable to delete workout assignment.",
        )
      } finally {
        setDeletingId("")
      }
    }

  /*
  |--------------------------------------------------------------------------
  | Loading
  |--------------------------------------------------------------------------
  */

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white">
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <Loader2
              size={30}
              className="mx-auto animate-spin text-lime-400"
            />

            <p className="mt-4 text-sm font-bold text-gray-500">
              Loading assignments...
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <main className="mx-auto max-w-7xl px-5 py-8">
        <header>
          <div className="flex items-center gap-2 text-lime-400">
            <UserCheck size={18} />

            <span className="text-xs font-black uppercase tracking-widest">
              Trainer Control
            </span>
          </div>

          <h1 className="mt-2 text-3xl font-black">
            Assign Workouts
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">
            Assign a real {gymName} workout
            program stored in MongoDB to a
            member.
          </p>
        </header>

        {error && (
          <div className="mt-6 rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-4 text-sm font-bold text-red-300">
            {error}
          </div>
        )}

        {success && (
          <div className="mt-6 flex items-center gap-2 rounded-2xl border border-lime-400/20 bg-lime-400/10 px-5 py-4 text-sm font-bold text-lime-400">
            <Check size={18} />
            {success}
          </div>
        )}

        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_420px]">

          {/* MEMBERS */}

          <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-gray-600">
                Step 1
              </p>

              <h2 className="mt-1 text-xl font-black">
                Select Member
              </h2>
            </div>

            <div className="relative mt-5">
              <Search
                size={16}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-700"
              />

              <input
                value={memberSearch}
                onChange={(event) =>
                  setMemberSearch(
                    event.target.value,
                  )
                }
                placeholder="Search member..."
                className="w-full rounded-2xl border border-white/10 bg-black py-3.5 pl-10 pr-4 text-sm font-bold text-white outline-none placeholder:text-gray-700 focus:border-lime-400"
              />
            </div>

            <div className="mt-4 space-y-2">
              {filteredMembers.length ===
              0 ? (
                <EmptyState
                  icon={
                    <Users
                      size={25}
                    />
                  }
                  text="No members found."
                />
              ) : (
                filteredMembers.map(
                  (member) => {
                    const id =
                      member._id ||
                      member.id

                    const name =
                      member.fullName ||
                      `${member.firstName || ""} ${member.lastName || ""}`.trim() ||
                      "Member"

                    const selected =
                      String(
                        selectedMemberId,
                      ) ===
                      String(id)

                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() =>
                          setSelectedMemberId(
                            id,
                          )
                        }
                        className={`flex w-full items-center justify-between rounded-2xl border p-4 text-left ${
                          selected
                            ? "border-lime-400/30 bg-lime-400/10"
                            : "border-white/10 bg-black"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-400 text-black">
                            <span className="text-xs font-black">
                              {name
                                .split(" ")
                                .map(
                                  (
                                    part,
                                  ) =>
                                    part[0] ||
                                    "",
                                )
                                .join("")
                                .slice(
                                  0,
                                  2,
                                )
                                .toUpperCase()}
                            </span>
                          </div>

                          <div>
                            <p className="text-sm font-black">
                              {name}
                            </p>

                            <p className="mt-1 text-[10px] text-gray-600">
                              {
                                member.email
                              }
                            </p>
                          </div>
                        </div>

                        {selected && (
                          <Check
                            size={18}
                            className="text-lime-400"
                          />
                        )}
                      </button>
                    )
                  },
                )
              )}
            </div>
          </section>

          {/* PROGRAM */}

          <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-gray-600">
                Step 2
              </p>

              <h2 className="mt-1 text-xl font-black">
                Choose Program
              </h2>
            </div>

            <div className="mt-5">
              <label className="mb-2 block text-xs font-black uppercase tracking-wider text-gray-500">
                Workout Type
              </label>

              <div className="relative">
                <select
                  value={workoutType}
                  onChange={
                    handleWorkoutTypeChange
                  }
                  className="w-full appearance-none rounded-2xl border border-white/10 bg-black px-4 py-3.5 text-sm font-bold text-white outline-none focus:border-lime-400"
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
                        {type.label}
                      </option>
                    ),
                  )}
                </select>

                <ChevronDown
                  size={17}
                  className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-600"
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="mb-2 block text-xs font-black uppercase tracking-wider text-gray-500">
                Program
              </label>

              <div className="relative">
                <select
                  value={
                    selectedProgramId
                  }
                  onChange={(event) =>
                    setSelectedProgramId(
                      event.target.value,
                    )
                  }
                  className="w-full appearance-none rounded-2xl border border-white/10 bg-black px-4 py-3.5 text-sm font-bold text-white outline-none focus:border-lime-400"
                >
                  <option value="">
                    Select a program
                  </option>

                  {filteredPrograms.map(
                    (program) => (
                      <option
                        key={
                          program._id
                        }
                        value={
                          program._id
                        }
                      >
                        {program.name}
                      </option>
                    ),
                  )}
                </select>

                <ChevronDown
                  size={17}
                  className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-600"
                />
              </div>
            </div>

            {selectedProgram && (
              <div className="mt-5 rounded-2xl border border-yellow-400/20 bg-yellow-400/5 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-400 text-black">
                    <Dumbbell
                      size={18}
                    />
                  </div>

                  <div>
                    <p className="text-sm font-black">
                      {
                        selectedProgram.name
                      }
                    </p>

                    <p className="mt-1 text-[10px] text-gray-600">
                      {
                        selectedProgram
                          .exercises
                          ?.length ||
                        0
                      }{" "}
                      exercises
                    </p>
                  </div>
                </div>

                {selectedProgram
                  .description && (
                  <p className="mt-3 text-xs leading-5 text-gray-500">
                    {
                      selectedProgram.description
                    }
                  </p>
                )}

                {selectedProgram
                  .exercises
                  ?.length >
                  0 && (
                  <div className="mt-4 space-y-2">
                    {selectedProgram.exercises.map(
                      (
                        item,
                        index,
                      ) => {
                        const exercise =
                          item.exercise ||
                          item

                        return (
                          <div
                            key={`${exercise._id || exercise.id}-${index}`}
                            className="rounded-xl bg-black px-3 py-2.5"
                          >
                            <p className="text-xs font-bold">
                              {index +
                                1}
                              .{" "}
                              {
                                exercise.name
                              }
                            </p>

                            <p className="mt-1 text-[9px] text-gray-600">
                              {
                                item.sets
                              }{" "}
                              sets
                              {item.reps
                                ? ` × ${item.reps} reps`
                                : ""}
                              {item.rest !==
                              undefined
                                ? ` · ${item.rest}s rest`
                                : ""}
                            </p>
                          </div>
                        )
                      },
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="mt-5">
              <DateField
                label="Workout Date"
                value={workoutDate}
                onChange={
                  setWorkoutDate
                }
              />

              {workoutDate && (
                <div className="mt-3 rounded-2xl border border-lime-400/20 bg-lime-400/5 px-4 py-3">
                  <p className="text-[10px] font-black uppercase tracking-wider text-gray-600">
                    Scheduled Workout Day
                  </p>

                  <p className="mt-1 text-sm font-black text-lime-400">
                    {formatDayAndDate(
                      workoutDate,
                    )}
                  </p>
                </div>
              )}
            </div>

            <div className="mt-5">
              <label className="mb-2 block text-xs font-black uppercase tracking-wider text-gray-500">
                Workout Time
              </label>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-2 block text-[10px] font-black uppercase tracking-wider text-gray-600">
                    Start Time
                  </label>

                  <input
                    type="time"
                    value={startTime}
                    onChange={(event) =>
                      setStartTime(
                        event.target.value,
                      )
                    }
                    className="w-full rounded-2xl border border-white/10 bg-black px-3 py-3 text-xs font-bold text-white outline-none focus:border-lime-400"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-[10px] font-black uppercase tracking-wider text-gray-600">
                    End Time
                  </label>

                  <input
                    type="time"
                    value={endTime}
                    onChange={(event) =>
                      setEndTime(
                        event.target.value,
                      )
                    }
                    className="w-full rounded-2xl border border-white/10 bg-black px-3 py-3 text-xs font-bold text-white outline-none focus:border-lime-400"
                  />
                </div>
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-white/10 bg-black p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-black text-white">
                    Workout Reminder
                  </p>

                  <p className="mt-1 text-[10px] leading-4 text-gray-600">
                    Remind the member before the scheduled workout.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setReminderEnabled(
                      (current) =>
                        !current,
                    )
                  }
                  aria-pressed={
                    reminderEnabled
                  }
                  className={`relative h-7 w-12 shrink-0 rounded-full transition ${
                    reminderEnabled
                      ? "bg-lime-400"
                      : "bg-white/10"
                  }`}
                >
                  <span
                    className={`absolute top-1 h-5 w-5 rounded-full bg-black transition ${
                      reminderEnabled
                        ? "left-6"
                        : "left-1"
                    }`}
                  />
                </button>
              </div>

              {reminderEnabled && (
                <div className="mt-4">
                  <label className="mb-2 block text-[10px] font-black uppercase tracking-wider text-gray-600">
                    Reminder
                  </label>

                  <select
                    value={
                      reminderMinutesBefore
                    }
                    onChange={(event) =>
                      setReminderMinutesBefore(
                        Number(
                          event.target
                            .value,
                        ),
                      )
                    }
                    className="w-full rounded-2xl border border-white/10 bg-black px-4 py-3 text-xs font-bold text-white outline-none focus:border-lime-400"
                  >
                    <option value={0}>
                      At workout start time
                    </option>

                    <option value={5}>
                      5 minutes before
                    </option>

                    <option value={10}>
                      10 minutes before
                    </option>

                    <option value={15}>
                      15 minutes before
                    </option>

                    <option value={30}>
                      30 minutes before
                    </option>

                    <option value={60}>
                      1 hour before
                    </option>
                  </select>
                </div>
              )}
            </div>

            <div className="mt-4">
              <label className="mb-2 block text-xs font-black uppercase tracking-wider text-gray-500">
                Notes
              </label>

              <textarea
                value={notes}
                onChange={(event) =>
                  setNotes(
                    event.target.value,
                  )
                }
                rows={3}
                placeholder="Optional trainer notes..."
                className="w-full resize-none rounded-2xl border border-white/10 bg-black px-4 py-3 text-xs text-white outline-none placeholder:text-gray-700 focus:border-lime-400"
              />
            </div>

            {/* ASSIGN BUTTON */}

            <button
              type="button"
              onClick={
                handleAssign
              }
              disabled={assigning}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-lime-400 px-5 py-4 text-sm font-black text-black transition hover:bg-lime-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {assigning ? (
                <>
                  <Loader2
                    size={18}
                    className="animate-spin"
                  />

                  ASSIGNING...
                </>
              ) : (
                <>
                  <UserCheck
                    size={18}
                  />

                  ASSIGN TO MEMBER
                </>
              )}
            </button>
          </section>
        </div>

        <AssignmentHistory
          assignments={
            assignments
          }
          navigate={navigate}
          isTrainerPage={
            isTrainerPage
          }
          deletingId={
            deletingId
          }
          onDelete={
            handleDeleteAssignment
          }
        />
      </main>
    </div>
  )
}

function DateField({
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
        type="date"
        value={value}
        onChange={(event) =>
          onChange(
            event.target.value,
          )
        }
        className="w-full rounded-2xl border border-white/10 bg-black px-3 py-3 text-xs font-bold text-white outline-none focus:border-lime-400"
      />
    </div>
  )
}

function AssignmentHistory({
  assignments,
  navigate,
  isTrainerPage,
}) {
  const groupedMembers =
    assignments.reduce(
      (groups, assignment) => {
        const member =
          assignment?.member

        const memberId =
          member?._id ||
          member?.id

        if (!memberId) {
          return groups
        }

        const key =
          String(memberId)

        if (!groups[key]) {
          groups[key] = {
            member,
            assignments: [],
          }
        }

        groups[
          key
        ].assignments.push(
          assignment,
        )

        return groups
      },
      {},
    )

  const memberGroups =
    Object.values(
      groupedMembers,
    ).sort(
      (a, b) => {
        const nameA =
          `${a.member?.firstName || ""} ${a.member?.lastName || ""}`
            .trim()
            .toLowerCase()

        const nameB =
          `${b.member?.firstName || ""} ${b.member?.lastName || ""}`
            .trim()
            .toLowerCase()

        return nameA.localeCompare(
          nameB,
        )
      },
    )

  return (
    <section className="mt-8">
      <div className="flex items-center gap-2">
        <CalendarDays
          size={17}
          className="text-yellow-400"
        />

        <div>
          <p className="text-xs font-black uppercase tracking-wider text-gray-600">
            MongoDB Assignments
          </p>

          <h2 className="mt-1 text-xl font-black">
            Members & Weekly Workouts
          </h2>
        </div>
      </div>

      {memberGroups.length ===
      0 ? (
        <div className="mt-5 rounded-3xl border border-dashed border-white/10 p-8 text-center">
          <Users
            size={28}
            className="mx-auto text-gray-700"
          />

          <p className="mt-3 text-xs font-bold text-gray-600">
            No active workout assignments.
          </p>
        </div>
      ) : (
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          {memberGroups.map(
            ({
              member,
              assignments:
                memberAssignments,
            }) => {
              const memberId =
                member?._id ||
                member?.id

              const memberName =
                member?.fullName ||
                `${member?.firstName || ""} ${member?.lastName || ""}`.trim() ||
                "Member"

              const sortedAssignments =
                [
                  ...memberAssignments,
                ].sort(
                  (a, b) => {
                    return String(
                      a?.workoutDate ||
                        "",
                    ).localeCompare(
                      String(
                        b?.workoutDate ||
                          "",
                      ),
                    )
                  },
                )

              return (
                <button
                  key={memberId}
                  type="button"
                  onClick={() =>
                    navigate(
                      `${
                        isTrainerPage
                          ? "/trainer"
                          : "/admin"
                      }/assignments/member/${memberId}`,
                    )
                  }
                  className="group rounded-3xl border border-white/10 bg-white/5 p-5 text-left transition hover:border-lime-400/30 hover:bg-white/[0.07]"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-yellow-400 text-sm font-black text-black">
                        {memberName
                          .split(" ")
                          .filter(Boolean)
                          .map(
                            (part) =>
                              part[0] ||
                              "",
                          )
                          .join("")
                          .slice(
                            0,
                            2,
                          )
                          .toUpperCase()}
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-base font-black text-white group-hover:text-lime-400">
                          {memberName}
                        </p>

                        <p className="mt-1 truncate text-xs text-gray-600">
                          {member?.email ||
                            "Member"}
                        </p>
                      </div>
                    </div>

                    <ChevronDown
                      size={18}
                      className="mt-1 shrink-0 -rotate-90 text-gray-700 transition group-hover:text-lime-400"
                    />
                  </div>

                  <div className="mt-5 flex items-center justify-between border-t border-white/5 pt-4">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-wider text-gray-600">
                        Assigned workouts
                      </p>

                      <p className="mt-1 text-lg font-black">
                        {
                          memberAssignments.length
                        }
                      </p>
                    </div>

                    <span className="rounded-full bg-lime-400/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-wider text-lime-400">
                      View 7-day schedule
                    </span>
                  </div>

                  <div className="mt-4 space-y-2">
                    {sortedAssignments
                      .slice(0, 3)
                      .map(
                        (
                          assignment,
                        ) => (
                          <div
                            key={
                              assignment._id
                            }
                            className="flex items-center justify-between gap-3 rounded-xl bg-black px-3 py-2.5"
                          >
                            <div className="min-w-0">
                              <p className="truncate text-xs font-bold text-gray-300">
                                {assignment
                                  .program
                                  ?.name ||
                                  "Workout Program"}
                              </p>

                              <p className="mt-1 text-[9px] text-gray-600">
                                {formatDayAndDate(
                                  assignment.workoutDate,
                                )}

                                {assignment.startTime
                                  ? ` · ${assignment.startTime}${
                                      assignment.endTime
                                        ? ` – ${assignment.endTime}`
                                        : ""
                                    }`
                                  : ""}
                              </p>
                            </div>

                            <span className="shrink-0 text-[9px] font-black uppercase text-gray-600">
                              {assignment
                                .program
                                ?.workoutType ||
                                "Training"}
                            </span>
                          </div>
                        ),
                      )}

                    {memberAssignments.length >
                    3 ? (
                      <p className="pt-1 text-center text-[9px] font-bold text-gray-700">
                        +{" "}
                        {memberAssignments.length -
                          3}{" "}
                        more workout
                        {memberAssignments.length -
                          3 ===
                        1
                          ? ""
                          : "s"}
                      </p>
                    ) : null}
                  </div>
                </button>
              )
            },
          )}
        </div>
      )}
    </section>
  )
}

function EmptyState({
  icon,
  text,
}) {
  return (
    <div className="rounded-2xl border border-dashed border-white/10 p-7 text-center">
      <div className="mx-auto w-fit text-gray-700">
        {icon}
      </div>

      <p className="mt-3 text-xs font-bold text-gray-600">
        {text}
      </p>
    </div>
  )
}

function getLocalDateKey() {
  const now = new Date()

  const year =
    now.getFullYear()

  const month = String(
    now.getMonth() + 1,
  ).padStart(2, "0")

  const day = String(
    now.getDate(),
  ).padStart(2, "0")

  return `${year}-${month}-${day}`
}

function parseCalendarDate(
  value,
) {
  if (!value) {
    return null
  }

  const valueString =
    String(value)

  // IMPORTANT:
  // YYYY-MM-DD is a calendar date, not a UTC timestamp.
  // Construct it with local date components so the browser timezone
  // cannot shift it to the previous day.
  const match =
    valueString.match(
      /^(\d{4})-(\d{2})-(\d{2})/,
    )

  if (match) {
    const year =
      Number(match[1])

    const month =
      Number(match[2])

    const day =
      Number(match[3])

    const date = new Date(
      year,
      month - 1,
      day,
    )

    if (
      date.getFullYear() ===
        year &&
      date.getMonth() ===
        month - 1 &&
      date.getDate() ===
        day
    ) {
      return date
    }
  }

  const date =
    new Date(valueString)

  return Number.isNaN(
    date.getTime(),
  )
    ? null
    : date
}

function formatDayAndDate(
  value,
) {
  if (!value) {
    return "No date"
  }

  const date =
    parseCalendarDate(value)

  if (!date) {
    return String(value)
  }

  return date.toLocaleDateString(
    undefined,
    {
      weekday: "long",
      year: "numeric",
      month: "short",
      day: "numeric",
    },
  )
}

function formatDate(
  value,
) {
  if (!value) {
    return "No date"
  }

  const date =
    parseCalendarDate(value)

  if (!date) {
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

export default Assignments