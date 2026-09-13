import User from "../models/User.js"
import ProgramAssignment from "../models/ProgramAssignment.js"
import WorkoutLog from "../models/WorkoutLog.js"

const normalizeDate = (value) => {
  const source = value ? String(value) : ""
  const match = source.match(/^(\d{4})-(\d{2})-(\d{2})$/)

  if (match) {
    const date = new Date(
      Date.UTC(
        Number(match[1]),
        Number(match[2]) - 1,
        Number(match[3]),
      ),
    )

    return Number.isNaN(date.getTime())
      ? null
      : date
  }

  const date = new Date()

  date.setUTCHours(
    0,
    0,
    0,
    0,
  )

  return date
}

const getDayRange = (date) => {
  const start = new Date(date)

  start.setUTCHours(
    0,
    0,
    0,
    0,
  )

  const end = new Date(start)

  end.setUTCHours(
    23,
    59,
    59,
    999,
  )

  return {
    start,
    end,
  }
}

/*
|--------------------------------------------------------------------------
| Build trainer workout progress
|--------------------------------------------------------------------------
|
| Trainers can access every active member belonging to their own gym.
| TrainerAssignment is NOT required for member visibility.
|
*/

const buildProgress = async (
  trainer,
  requestedMemberId,
  dateValue,
) => {
  if (!trainer?.gym) {
    return {
      gymMissing: true,
      memberNotFound: false,
      progress: [],
    }
  }

  const date = normalizeDate(
    dateValue,
  )

  const {
    start,
    end,
  } = getDayRange(date)

  /*
  |--------------------------------------------------------------------------
  | Member filter
  |--------------------------------------------------------------------------
  |
  | If a specific member was requested, make sure that member belongs
  | to the trainer's gym.
  |
  | If no member was requested, return all active members in the gym.
  |
  */

  const memberFilter = {
    gym: trainer.gym,
    role: "member",
    isActive: true,
  }

  if (requestedMemberId) {
    memberFilter._id =
      requestedMemberId
  }

  const members =
    await User.find(
      memberFilter,
    )
      .select(
        "firstName lastName email phone fitnessGoal weight isActive profilePhoto gym",
      )
      .sort({
        firstName: 1,
        lastName: 1,
      })

  if (
    requestedMemberId &&
    members.length === 0
  ) {
    return {
      gymMissing: false,
      memberNotFound: true,
      progress: [],
    }
  }

  const progress = []

  for (const member of members) {
    const assignments =
      await ProgramAssignment.find({
        member: member._id,
        status: "active",
        workoutDate: {
          $gte: start,
          $lte: end,
        },
      })
        .populate("program")
        .sort({
          createdAt: -1,
        })

    if (!assignments.length) {
      progress.push({
        member,
        assignments: [],
      })

      continue
    }

    const assignmentResults = []

    for (
      const assignment of assignments
    ) {
      const workoutLog =
        await WorkoutLog.findOne({
          member: member._id,
          program:
            assignment.program?._id ||
            assignment.program,
          workoutDate: {
            $gte: start,
            $lte: end,
          },
        })

      const totalSets =
        Array.isArray(
          workoutLog?.exercises,
        )
          ? workoutLog.exercises.reduce(
              (
                total,
                exercise,
              ) =>
                total +
                (Array.isArray(
                  exercise?.sets,
                )
                  ? exercise.sets
                      .length
                  : 0),
              0,
            )
          : 0

      const completedSets =
        Array.isArray(
          workoutLog?.exercises,
        )
          ? workoutLog.exercises.reduce(
              (
                total,
                exercise,
              ) =>
                total +
                (Array.isArray(
                  exercise?.sets,
                )
                  ? exercise.sets.filter(
                      (set) =>
                        set?.completed,
                    ).length
                  : 0),
              0,
            )
          : 0

      const progressPercent =
        totalSets > 0
          ? Math.min(
              Math.round(
                (completedSets /
                  totalSets) *
                  100,
              ),
              100,
            )
          : workoutLog?.completed
            ? 100
            : 0

      assignmentResults.push({
        assignment,
        program:
          assignment.program,

        workout: {
          status: workoutLog
            ? workoutLog.completed
              ? "completed"
              : completedSets > 0
                ? "in_progress"
                : "not_started"
            : "not_started",

          date,

          completed:
            Boolean(
              workoutLog?.completed,
            ),

          completedAt:
            workoutLog?.completedAt ||
            null,

          caloriesBurned:
            Number(
              workoutLog?.caloriesBurned,
            ) || 0,

          totalSets,

          completedSets,

          progressPercent,

          exercises:
            workoutLog?.exercises ||
            [],
        },
      })
    }

    progress.push({
      member,
      assignments:
        assignmentResults,
    })
  }

  return {
    gymMissing: false,
    memberNotFound: false,
    progress,
    date: date
      .toISOString()
      .split("T")[0],
  }
}

/*
|--------------------------------------------------------------------------
| All trainer workout progress
|--------------------------------------------------------------------------
*/

export const getTrainerWorkoutProgress =
  async (
    req,
    res,
  ) => {
    try {
      const result =
        await buildProgress(
          req.user,
          req.query.memberId,
          req.query.date,
        )

      if (result.gymMissing) {
        return res.status(400).json({
          success: false,
          message:
            "Trainer is not associated with a gym.",
        })
      }

      if (
        result.memberNotFound
      ) {
        return res.status(404).json({
          success: false,
          message:
            "Member not found in your gym.",
        })
      }

      return res.status(200).json({
        success: true,
        date: result.date,
        count:
          result.progress.length,
        progress:
          result.progress,
      })
    } catch (error) {
      console.error(
        "Get trainer workout progress error:",
        error,
      )

      return res.status(500).json({
        success: false,
        message:
          "Unable to retrieve trainer workout progress.",
      })
    }
  }

/*
|--------------------------------------------------------------------------
| Specific member workout progress
|--------------------------------------------------------------------------
*/

export const getTrainerMemberWorkoutProgress =
  async (
    req,
    res,
  ) => {
    try {
      const result =
        await buildProgress(
          req.user,
          req.params.memberId,
          req.query.date,
        )

      if (result.gymMissing) {
        return res.status(400).json({
          success: false,
          message:
            "Trainer is not associated with a gym.",
        })
      }

      if (
        result.memberNotFound ||
        !result.progress.length
      ) {
        return res.status(404).json({
          success: false,
          message:
            "Member not found in your gym.",
        })
      }

      return res.status(200).json({
        success: true,
        date: result.date,
        member:
          result.progress[0]
            .member,
        assignments:
          result.progress[0]
            .assignments,
      })
    } catch (error) {
      console.error(
        "Get trainer member workout progress error:",
        error,
      )

      return res.status(500).json({
        success: false,
        message:
          "Unable to retrieve member workout progress.",
      })
    }
  }