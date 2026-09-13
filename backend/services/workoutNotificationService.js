import User from "../models/User.js"
import WorkoutLog from "../models/WorkoutLog.js"
import ProgramAssignment from "../models/ProgramAssignment.js"
import Notification from "../models/Notification.js"
import {
  sendEmail,
  workoutCompletedEmail,
  workoutReminderEmail,
} from "./emailService.js"

const TIME_ZONE =
  process.env.GB_TIMEZONE ||
  "Africa/Lagos"

const REMINDER_HOUR = Number(
  process.env.WORKOUT_REMINDER_HOUR ||
    21,
)

const REMINDER_MINUTE = Number(
  process.env.WORKOUT_REMINDER_MINUTE ||
    0,
)

function startOfDay(date) {
  const value = new Date(date)
  value.setHours(
    0,
    0,
    0,
    0,
  )
  return value
}

function endOfDay(date) {
  const value = new Date(date)
  value.setHours(
    23,
    59,
    59,
    999,
  )
  return value
}

function getDateKey(date) {
  const parts =
    new Intl.DateTimeFormat(
      "en-CA",
      {
        timeZone: TIME_ZONE,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      },
    ).formatToParts(
      new Date(date),
    )

  const map = {}
  for (const part of parts) {
    if (part.type !== "literal") {
      map[part.type] = part.value
    }
  }

  return `${map.year}-${map.month}-${map.day}`
}

function getLocalHourMinute(date) {
  const parts =
    new Intl.DateTimeFormat(
      "en-GB",
      {
        timeZone: TIME_ZONE,
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      },
    ).formatToParts(
      new Date(date),
    )

  const hour = Number(
    parts.find(
      (part) =>
        part.type === "hour",
    )?.value || 0,
  )

  const minute = Number(
    parts.find(
      (part) =>
        part.type === "minute",
    )?.value || 0,
  )

  return {
    hour,
    minute,
  }
}

function hasCompletedSets(workoutLog) {
  if (!workoutLog) {
    return false
  }

  return (
    workoutLog.exercises || []
  ).some(
    (exercise) =>
      (exercise.sets || []).some(
        (set) =>
          Boolean(set.completed),
      ),
  )
}

async function createOrGetNotification({
  userId,
  type,
  title,
  message,
  workoutLogId = null,
  workoutDate = null,
}) {
  const dateStart =
    workoutDate
      ? startOfDay(workoutDate)
      : null

  const dateEnd =
    workoutDate
      ? endOfDay(workoutDate)
      : null

  const query = {
    user: userId,
    type,
  }

  if (workoutLogId) {
    query.workoutLog =
      workoutLogId
  } else if (
    dateStart &&
    dateEnd
  ) {
    query.workoutDate = {
      $gte: dateStart,
      $lte: dateEnd,
    }
  }

  let notification =
    await Notification.findOne(
      query,
    )

  if (notification) {
    return {
      notification,
      created: false,
    }
  }

  notification =
    await Notification.create({
      user: userId,
      type,
      title,
      message,
      workoutLog:
        workoutLogId,
      workoutDate:
        workoutDate
          ? startOfDay(
              workoutDate,
            )
          : null,
    })

  return {
    notification,
    created: true,
  }
}

async function sendCompletionNotification(
  workoutLog,
) {
  if (
    !workoutLog?.completed ||
    !workoutLog?.member
  ) {
    return
  }

  const member =
    typeof workoutLog.member ===
    "object"
      ? workoutLog.member
      : await User.findById(
          workoutLog.member,
        )

  if (!member?.email) {
    return
  }

  const program =
    workoutLog.program

  const programName =
    typeof program === "object"
      ? program.name
      : null

  const {
    notification,
    created,
  } =
    await createOrGetNotification({
      userId: member._id,
      type:
        "workout_completed",
      title:
        "Workout Completed 🎉",
      message:
        `Great job! You completed ${
          programName ||
          "today's workout"
        }.`,
      workoutLogId:
        workoutLog._id,
      workoutDate:
        workoutLog.workoutDate,
    })

  if (
    !created ||
    notification.emailSent
  ) {
    return
  }

  try {
    const email =
      workoutCompletedEmail({
        firstName:
          member.firstName,
        programName,
        workoutDate:
          workoutLog.workoutDate,
      })

    const result =
      await sendEmail({
        to: member.email,
        ...email,
      })

    if (result.sent) {
      notification.emailSent =
        true
      notification.emailSentAt =
        new Date()
      await notification.save()
    }
  } catch (error) {
    console.error(
      "GB completion email error:",
      error,
    )
  }
}

async function processCompletedWorkoutNotifications() {
  const logs =
    await WorkoutLog.find({
      completed: true,
      completedAt: {
        $ne: null,
      },
    })
      .sort({
        completedAt: -1,
      })
      .limit(100)
      .populate(
        "member",
        "firstName lastName email",
      )
      .populate(
        "program",
        "name",
      )

  for (const log of logs) {
    await sendCompletionNotification(
      log,
    )
  }
}

async function processWorkoutReminders(
  now = new Date(),
) {
  const {
    hour,
    minute,
  } =
    getLocalHourMinute(now)

  /*
   * The reminder runs only at the configured
   * local time. The job itself can be called
   * every minute.
   */
  if (
    hour !== REMINDER_HOUR ||
    minute !== REMINDER_MINUTE
  ) {
    return
  }

  const dateKey =
    getDateKey(now)

  const [year, month, day] =
    dateKey
      .split("-")
      .map(Number)

  const localDate =
    new Date(
      year,
      month - 1,
      day,
    )

  const dayStart =
    startOfDay(localDate)

  const dayEnd =
    endOfDay(localDate)

  const assignments =
    await ProgramAssignment.find({
      status: "active",
      startDate: {
        $lte: dayEnd,
      },
      $or: [
        {
          endDate: null,
        },
        {
          endDate: {
            $gte: dayStart,
          },
        },
      ],
    })
      .populate(
        "member",
        "firstName lastName email isActive",
      )
      .populate(
        "program",
        "name",
      )

  for (const assignment of assignments) {
    const member =
      assignment.member

    if (
      !member ||
      member.isActive === false
    ) {
      continue
    }

    /*
     * A workout is considered missed only if
     * the member has not completed any set.
     *
     * A partially started workout is not treated
     * as "did not do the workout at all".
     */
    const workoutLog =
      await WorkoutLog.findOne({
        member: member._id,
        program:
          assignment.program._id,
        workoutDate: {
          $gte: dayStart,
          $lte: dayEnd,
        },
      })

    const completed =
      Boolean(
        workoutLog?.completed,
      )

    const started =
      hasCompletedSets(
        workoutLog,
      )

    if (
      completed ||
      started
    ) {
      continue
    }

    const programName =
      assignment.program?.name ||
      "your scheduled workout"

    const {
      notification,
      created,
    } =
      await createOrGetNotification({
        userId: member._id,
        type:
          "workout_reminder",
        title:
          "Workout Reminder",
        message:
          `You did not complete ${programName} today.`,
        workoutDate:
          dayStart,
      })

    if (
      !created ||
      notification.emailSent ||
      !member.email
    ) {
      continue
    }

    try {
      const email =
        workoutReminderEmail({
          firstName:
            member.firstName,
          programName,
          workoutDate:
            dayStart,
        })

      const result =
        await sendEmail({
          to: member.email,
          ...email,
        })

      if (result.sent) {
        notification.emailSent =
          true
        notification.emailSentAt =
          new Date()
        await notification.save()
      }
    } catch (error) {
      console.error(
        "GB workout reminder email error:",
        error,
      )
    }
  }
}

export async function runWorkoutNotificationJobs() {
  try {
    await processCompletedWorkoutNotifications()
  } catch (error) {
    console.error(
      "GB completion notification job error:",
      error,
    )
  }

  try {
    await processWorkoutReminders()
  } catch (error) {
    console.error(
      "GB reminder notification job error:",
      error,
    )
  }
}

export async function startWorkoutNotificationJobs() {
  console.log(
    `GB workout notification jobs enabled. Reminder time: ${String(
      REMINDER_HOUR,
    ).padStart(2, "0")}:${String(
      REMINDER_MINUTE,
    ).padStart(2, "0")} ${TIME_ZONE}`,
  )

  await runWorkoutNotificationJobs()

  return setInterval(
    runWorkoutNotificationJobs,
    60 * 1000,
  )
}
