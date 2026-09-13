import mongoose from "mongoose"

import ProgramAssignment from "../models/ProgramAssignment.js"
import Program from "../models/Program.js"
import User from "../models/User.js"

const VALID_DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
]

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

const isValidObjectId = (value) => {
  return mongoose.Types.ObjectId.isValid(value)
}

const normalizeTime = (value) => {
  if (
    value === undefined ||
    value === null ||
    String(value).trim() === ""
  ) {
    return ""
  }

  const normalized = String(value).trim()

  if (!/^([01]\\d|2[0-3]):([0-5]\\d)$/.test(normalized)) {
    return null
  }

  return normalized
}

/*
 * Normalize a calendar date to midnight UTC.
 *
 * The application treats workoutDate as a calendar date, not a timestamp.
 * Using UTC here prevents the Render/server timezone from moving a workout
 * onto the previous or next day.
 */
const normalizeDate = (value) => {
  if (!value) {
    return null
  }

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) {
      return null
    }

    const date = new Date(value)
    date.setUTCHours(0, 0, 0, 0)
    return date
  }

  const stringValue = String(value).trim()

  if (!stringValue) {
    return null
  }

  // Date inputs send YYYY-MM-DD. Build the UTC date explicitly.
  const dateOnlyMatch = stringValue.match(/^(\d{4})-(\d{2})-(\d{2})$/)

  if (dateOnlyMatch) {
    const [, year, month, day] = dateOnlyMatch
    const date = new Date(
      Date.UTC(
        Number(year),
        Number(month) - 1,
        Number(day),
      ),
    )

    if (Number.isNaN(date.getTime())) {
      return null
    }

    return date
  }

  const date = new Date(stringValue)

  if (Number.isNaN(date.getTime())) {
    return null
  }

  date.setUTCHours(0, 0, 0, 0)
  return date
}

const getDayName = (date) => {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    timeZone: "UTC",
  })
}

const getDateRange = (date) => {
  const start = normalizeDate(date)

  if (!start) {
    return null
  }

  const end = new Date(start)
  end.setUTCHours(23, 59, 59, 999)

  return { start, end }
}

/*
|--------------------------------------------------------------------------
| Populate assignment
|--------------------------------------------------------------------------
*/

const populateAssignment = (query) => {
  return query
    .populate({
      path: "member",
      select:
        "firstName lastName email phone role isActive fitnessGoal profilePhoto",
    })
    .populate({
      path: "assignedBy",
      select: "firstName lastName email role",
    })
    .populate({
      path: "program",
      populate: {
        path: "exercises.exercise",
        select:
          "name category description muscleGroup equipment difficulty defaultSets defaultReps defaultDuration defaultRest caloriesEstimate imageUrl videoUrl",
      },
    })
}

/*
|--------------------------------------------------------------------------
| CREATE PROGRAM ASSIGNMENT
|--------------------------------------------------------------------------
|
| One assignment represents one workout on one specific calendar date.
| dayOfWeek is always derived from workoutDate.
|--------------------------------------------------------------------------
*/

const createProgramAssignment = async (req, res) => {
  try {
    const {
      memberId,
      programId,
      member: legacyMember,
      program: legacyProgram,
      workoutDate,
      startTime,
      endTime,
      reminderEnabled,
      reminderMinutesBefore,
      notes,
    } = req.body

    const member = memberId || legacyMember
    const program = programId || legacyProgram

    if (!member || !program || !workoutDate) {
      return res.status(400).json({
        success: false,
        message:
          "Member, program and workout date are required.",
      })
    }

    if (!isValidObjectId(member)) {
      return res.status(400).json({
        success: false,
        message: "Invalid member ID.",
      })
    }

    if (!isValidObjectId(program)) {
      return res.status(400).json({
        success: false,
        message: "Invalid program ID.",
      })
    }

    const normalizedWorkoutDate = normalizeDate(workoutDate)

    if (!normalizedWorkoutDate) {
      return res.status(400).json({
        success: false,
        message: "Invalid workout date.",
      })
    }

    const normalizedDay = getDayName(normalizedWorkoutDate)

    const normalizedStartTime = normalizeTime(startTime)
    const normalizedEndTime = normalizeTime(endTime)

    if (normalizedStartTime === null || normalizedEndTime === null) {
      return res.status(400).json({
        success: false,
        message: "Workout start and end time must use HH:MM format.",
      })
    }

    if (
      normalizedStartTime &&
      normalizedEndTime &&
      normalizedEndTime <= normalizedStartTime
    ) {
      return res.status(400).json({
        success: false,
        message: "Workout end time must be later than start time.",
      })
    }

    const normalizedReminderEnabled =
      reminderEnabled === undefined
        ? Boolean(normalizedStartTime)
        : Boolean(reminderEnabled)

    let normalizedReminderMinutesBefore =
      reminderMinutesBefore === undefined ||
      reminderMinutesBefore === null ||
      String(reminderMinutesBefore).trim() === ""
        ? 5
        : Number(reminderMinutesBefore)

    if (
      !Number.isFinite(normalizedReminderMinutesBefore) ||
      normalizedReminderMinutesBefore < 0 ||
      normalizedReminderMinutesBefore > 60
    ) {
      return res.status(400).json({
        success: false,
        message: "Reminder minutes must be between 0 and 60.",
      })
    }

    normalizedReminderMinutesBefore = Math.round(
      normalizedReminderMinutesBefore,
    )

    if (!VALID_DAYS.includes(normalizedDay)) {
      return res.status(400).json({
        success: false,
        message: "Invalid workout day.",
      })
    }

    const memberUser = await User.findOne({
      _id: member,
      role: "member",
    })

    if (!memberUser) {
      return res.status(404).json({
        success: false,
        message: "Member not found.",
      })
    }

    if (!memberUser.isActive) {
      return res.status(400).json({
        success: false,
        message: "Cannot assign a workout to an inactive member.",
      })
    }

    const programDocument = await Program.findOne({
      _id: program,
      $or: [
        { isActive: true },
        { isActive: { $exists: false } },
      ],
    })

    if (!programDocument) {
      return res.status(404).json({
        success: false,
        message: "Active program not found.",
      })
    }

    const existingAssignment = await ProgramAssignment.findOne({
      member,
      workoutDate: normalizedWorkoutDate,
      status: "active",
    })

    if (existingAssignment) {
      return res.status(409).json({
        success: false,
        message:
          `This member already has an active workout assigned for ${normalizedDay}, ${normalizedWorkoutDate.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" })}.`,
      })
    }

    const assignment = await ProgramAssignment.create({
      member,
      program,
      assignedBy: req.user._id,
      workoutDate: normalizedWorkoutDate,
      dayOfWeek: normalizedDay,
      startTime: normalizedStartTime,
      endTime: normalizedEndTime,
      reminderEnabled: normalizedReminderEnabled,
      reminderMinutesBefore: normalizedReminderMinutesBefore,
      status: "active",
      notes: notes?.trim() || "",
    })

    const populatedAssignment = await populateAssignment(
      ProgramAssignment.findById(assignment._id),
    )

    return res.status(201).json({
      success: true,
      message: "Program assigned successfully.",
      assignment: populatedAssignment,
    })
  } catch (error) {
    console.error("Create program assignment error:", error)

    return res.status(500).json({
      success: false,
      message:
        error?.message || "Unable to create program assignment.",
    })
  }
}

/*
|--------------------------------------------------------------------------
| GET ALL PROGRAM ASSIGNMENTS
|--------------------------------------------------------------------------
*/

const getProgramAssignments = async (req, res) => {
  try {
    const {
      member,
      program,
      status,
      dayOfWeek,
      workoutDate,
    } = req.query

    const filter = {}

    if (member) {
      if (!isValidObjectId(member)) {
        return res.status(400).json({
          success: false,
          message: "Invalid member ID.",
        })
      }

      filter.member = member
    }

    if (program) {
      if (!isValidObjectId(program)) {
        return res.status(400).json({
          success: false,
          message: "Invalid program ID.",
        })
      }

      filter.program = program
    }

    if (status) {
      filter.status = status
    }

    if (dayOfWeek) {
      if (!VALID_DAYS.includes(dayOfWeek)) {
        return res.status(400).json({
          success: false,
          message: "Invalid workout day.",
        })
      }

      filter.dayOfWeek = dayOfWeek
    }

    if (workoutDate) {
      const normalizedWorkoutDate = normalizeDate(workoutDate)

      if (!normalizedWorkoutDate) {
        return res.status(400).json({
          success: false,
          message: "Invalid workout date.",
        })
      }

      filter.workoutDate = normalizedWorkoutDate
    }

    const assignments = await populateAssignment(
      ProgramAssignment.find(filter).sort({
        workoutDate: 1,
        dayOfWeek: 1,
        createdAt: -1,
      }),
    )

    return res.status(200).json({
      success: true,
      count: assignments.length,
      assignments,
    })
  } catch (error) {
    console.error("Get program assignments error:", error)

    return res.status(500).json({
      success: false,
      message:
        error?.message || "Unable to retrieve program assignments.",
    })
  }
}

/*
|--------------------------------------------------------------------------
| GET ASSIGNMENT BY ID
|--------------------------------------------------------------------------
*/

const getProgramAssignmentById = async (req, res) => {
  try {
    const { id } = req.params

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid assignment ID.",
      })
    }

    const assignment = await populateAssignment(
      ProgramAssignment.findById(id),
    )

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: "Program assignment not found.",
      })
    }

    return res.status(200).json({
      success: true,
      assignment,
    })
  } catch (error) {
    console.error("Get program assignment error:", error)

    return res.status(500).json({
      success: false,
      message:
        error?.message || "Unable to retrieve program assignment.",
    })
  }
}

/*
|--------------------------------------------------------------------------
| UPDATE PROGRAM ASSIGNMENT
|--------------------------------------------------------------------------
|
| workoutDate may be changed. dayOfWeek is recalculated automatically.
| endDate/startDate are intentionally no longer supported.
|--------------------------------------------------------------------------
*/

const updateProgramAssignment = async (req, res) => {
  try {
    const { id } = req.params

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid assignment ID.",
      })
    }

    const assignment = await ProgramAssignment.findById(id)

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: "Program assignment not found.",
      })
    }

    const {
      memberId,
      programId,
      member: legacyMember,
      program: legacyProgram,
      workoutDate,
      startTime,
      endTime,
      reminderEnabled,
      reminderMinutesBefore,
      status,
      notes,
      startDate,
      endDate,
    } = req.body

    if (startDate !== undefined || endDate !== undefined) {
      return res.status(400).json({
        success: false,
        message:
          "Start date and end date are no longer supported. Use workoutDate.",
      })
    }

    const member = memberId || legacyMember
    const program = programId || legacyProgram

    if (member !== undefined) {
      if (!isValidObjectId(member)) {
        return res.status(400).json({
          success: false,
          message: "Invalid member ID.",
        })
      }

      const memberUser = await User.findOne({
        _id: member,
        role: "member",
      })

      if (!memberUser) {
        return res.status(404).json({
          success: false,
          message: "Member not found.",
        })
      }

      if (!memberUser.isActive) {
        return res.status(400).json({
          success: false,
          message: "Cannot assign a workout to an inactive member.",
        })
      }

      assignment.member = member
    }

    if (program !== undefined) {
      if (!isValidObjectId(program)) {
        return res.status(400).json({
          success: false,
          message: "Invalid program ID.",
        })
      }

      /*
       * If the assignment already uses this same program, allow the edit
       * to continue even if that program was later deactivated. Editing
       * the date or notes should not fail because of the program status.
       *
       * Only require an active program when the administrator is actually
       * changing the assignment to a different program.
       */
      const currentProgramId = String(
        assignment.program?._id || assignment.program || "",
      )
      const requestedProgramId = String(program)

      if (currentProgramId !== requestedProgramId) {
        const programDocument = await Program.findOne({
          _id: program,
          $or: [
            { isActive: true },
            { isActive: { $exists: false } },
          ],
        })

        if (!programDocument) {
          return res.status(404).json({
            success: false,
            message: "Active program not found.",
          })
        }
      }

      assignment.program = program
    }

    if (workoutDate !== undefined) {
      const parsedWorkoutDate = normalizeDate(workoutDate)

      if (!parsedWorkoutDate) {
        return res.status(400).json({
          success: false,
          message: "Invalid workout date.",
        })
      }

      assignment.workoutDate = parsedWorkoutDate
      assignment.dayOfWeek = getDayName(parsedWorkoutDate)
    }

    if (!assignment.workoutDate) {
      return res.status(400).json({
        success: false,
        message: "Workout date is required.",
      })
    }

    assignment.dayOfWeek = getDayName(
      normalizeDate(assignment.workoutDate),
    )

    if (
      startTime !== undefined ||
      endTime !== undefined
    ) {
      const requestedStartTime =
        startTime !== undefined
          ? normalizeTime(startTime)
          : assignment.startTime || ""

      const requestedEndTime =
        endTime !== undefined
          ? normalizeTime(endTime)
          : assignment.endTime || ""

      if (
        requestedStartTime === null ||
        requestedEndTime === null
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Workout start and end time must use HH:MM format.",
        })
      }

      if (
        requestedStartTime &&
        requestedEndTime &&
        requestedEndTime <= requestedStartTime
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Workout end time must be later than start time.",
        })
      }

      assignment.startTime = requestedStartTime
      assignment.endTime = requestedEndTime
    }

    if (reminderEnabled !== undefined) {
      assignment.reminderEnabled =
        typeof reminderEnabled === "string"
          ? reminderEnabled.toLowerCase() === "true"
          : Boolean(reminderEnabled)
    }

    if (reminderMinutesBefore !== undefined) {
      const normalizedReminderMinutesBefore =
        Number(reminderMinutesBefore)

      if (
        !Number.isFinite(
          normalizedReminderMinutesBefore,
        ) ||
        normalizedReminderMinutesBefore < 0 ||
        normalizedReminderMinutesBefore > 60
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Reminder minutes must be between 0 and 60.",
        })
      }

      assignment.reminderMinutesBefore =
        Math.round(
          normalizedReminderMinutesBefore,
        )
    }

    if (status !== undefined) {
      const validStatuses = [
        "active",
        "completed",
        "cancelled",
      ]

      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid assignment status.",
        })
      }

      assignment.status = status
    }

    if (notes !== undefined) {
      assignment.notes = String(notes).trim()
    }

    if (assignment.status === "active") {
      const duplicate = await ProgramAssignment.findOne({
        _id: { $ne: assignment._id },
        member: assignment.member,
        workoutDate: normalizeDate(assignment.workoutDate),
        status: "active",
      })

      if (duplicate) {
        return res.status(409).json({
          success: false,
          message:
            `This member already has an active workout assigned for ${assignment.dayOfWeek} on ${normalizeDate(assignment.workoutDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" })}.`,
        })
      }
    }

    await assignment.save()

    const updatedAssignment = await populateAssignment(
      ProgramAssignment.findById(assignment._id),
    )

    return res.status(200).json({
      success: true,
      message: "Program assignment updated successfully.",
      assignment: updatedAssignment,
    })
  } catch (error) {
    console.error("Update program assignment error:", error)

    return res.status(500).json({
      success: false,
      message:
        error?.message || "Unable to update program assignment.",
    })
  }
}

/*
|--------------------------------------------------------------------------
| CANCEL PROGRAM ASSIGNMENT
|--------------------------------------------------------------------------
*/

const cancelProgramAssignment = async (req, res) => {
  try {
    const { id } = req.params

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid assignment ID.",
      })
    }

    const assignment = await ProgramAssignment.findByIdAndUpdate(
      id,
      {
        $set: {
          status: "cancelled",
        },
      },
      {
        new: true,
        runValidators: false,
      },
    )

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: "Program assignment not found.",
      })
    }

    return res.status(200).json({
      success: true,
      message: "Program assignment cancelled successfully.",
      assignment,
    })
  } catch (error) {
    console.error("Cancel program assignment error:", error)

    return res.status(500).json({
      success: false,
      message:
        error?.message || "Unable to cancel program assignment.",
    })
  }
}

/*
|--------------------------------------------------------------------------
| GET MEMBER'S TODAY WORKOUT
|--------------------------------------------------------------------------
|
| The member receives a workout only when workoutDate is exactly today.
|--------------------------------------------------------------------------
*/

const getMyTodayWorkout = async (req, res) => {
  try {
    const today = normalizeDate(new Date())

    const assignment = await populateAssignment(
      ProgramAssignment.findOne({
        member: req.user._id,
        workoutDate: today,
        status: "active",
      }).sort({
        createdAt: -1,
      }),
    )

    if (!assignment) {
      return res.status(200).json({
        success: true,
        assigned: false,
        assignment: null,
        workout: null,
        date: today,
        day: getDayName(today),
        message: "No workout assigned for today.",
      })
    }

    return res.status(200).json({
      success: true,
      assigned: true,
      assignment,
      workout: assignment.program,
      date: assignment.workoutDate,
      day: assignment.dayOfWeek,
    })
  } catch (error) {
    console.error("Get today's workout error:", error)

    return res.status(500).json({
      success: false,
      message:
        error?.message || "Unable to retrieve today's workout.",
    })
  }
}

/*
|--------------------------------------------------------------------------
| GET ALL MEMBER PROGRAM ASSIGNMENTS
|--------------------------------------------------------------------------
*/

const getMyProgramAssignments = async (req, res) => {
  try {
    const assignments = await populateAssignment(
      ProgramAssignment.find({
        member: req.user._id,
      }).sort({
        workoutDate: 1,
        dayOfWeek: 1,
        createdAt: -1,
      }),
    )

    const today = normalizeDate(new Date())
    const todayTime = today.getTime()

    const formattedAssignments = assignments.map((assignment) => {
      const workoutDate = normalizeDate(assignment.workoutDate)
      const workoutDateTime = workoutDate?.getTime()

      return {
        ...assignment.toObject(),
        workoutDate,
        isCurrent:
          assignment.status === "active" &&
          workoutDateTime === todayTime,
        workoutDay: assignment.dayOfWeek,
        workoutType: assignment.program?.workoutType || "",
        programName: assignment.program?.name || "",
      }
    })

    return res.status(200).json({
      success: true,
      count: formattedAssignments.length,
      assignments: formattedAssignments,
    })
  } catch (error) {
    console.error("Get member program assignments error:", error)

    return res.status(500).json({
      success: false,
      message:
        error?.message || "Unable to retrieve your assigned programs.",
    })
  }
}

export {
  createProgramAssignment,
  getProgramAssignments,
  getProgramAssignmentById,
  updateProgramAssignment,
  cancelProgramAssignment,
  getMyTodayWorkout,
  getMyProgramAssignments,
}
