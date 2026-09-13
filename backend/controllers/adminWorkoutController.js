import WorkoutLog from "../models/WorkoutLog.js"
import ProgramAssignment from "../models/ProgramAssignment.js"
import User from "../models/User.js"
import TrainerAssignment from "../models/TrainerAssignment.js"

/*
|--------------------------------------------------------------------------
| Date helpers
|--------------------------------------------------------------------------
*/

const getStartOfDay = (date) => {
  const result = new Date(date)

  result.setHours(
    0,
    0,
    0,
    0,
  )

  return result
}

const getEndOfDay = (date) => {
  const result = new Date(date)

  result.setHours(
    23,
    59,
    59,
    999,
  )

  return result
}

const getTrainerAssignedMemberIds = async (trainerId) => {
  const assignments = await TrainerAssignment.find({
    trainer: trainerId,
    status: "active",
  }).select("member")

  return assignments.map((assignment) => assignment.member)
}

const ensureTrainerMemberAccess = async (req, memberId) => {
  if (req.user?.role !== "trainer") {
    return true
  }

  const assignment = await TrainerAssignment.findOne({
    trainer: req.user._id,
    member: memberId,
    status: "active",
  }).select("_id")

  return Boolean(assignment)
}

/*
|--------------------------------------------------------------------------
| Get all member workout progress
|--------------------------------------------------------------------------
*/

const getMemberWorkoutProgress =
  async (req, res) => {
    try {
      const {
        date,
        memberId,
        status,
      } = req.query

      const workoutDate =
        date
          ? new Date(date)
          : new Date()

      if (
        Number.isNaN(
          workoutDate.getTime(),
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid workout date.",
        })
      }

      const startOfDay =
        getStartOfDay(
          workoutDate,
        )

      const endOfDay =
        getEndOfDay(
          workoutDate,
        )

      /*
      |--------------------------------------------------------------------------
      | Find active assignments for members
      |--------------------------------------------------------------------------
      */

      const assignmentFilter = {
        status: "active",

        startDate: {
          $lte: endOfDay,
        },

        $or: [
          {
            endDate: null,
          },
          {
            endDate: {
              $gte: startOfDay,
            },
          },
        ],
      }

      if (req.user?.role === "trainer") {
        const assignedMemberIds =
          await getTrainerAssignedMemberIds(
            req.user._id,
          )

        if (memberId) {
          const allowed = assignedMemberIds.some(
            (id) => String(id) === String(memberId),
          )

          if (!allowed) {
            return res.status(403).json({
              success: false,
              message:
                "You are not assigned to this member.",
            })
          }

          assignmentFilter.member = memberId
        } else {
          assignmentFilter.member = {
            $in: assignedMemberIds,
          }
        }
      } else if (memberId) {
        assignmentFilter.member =
          memberId
      }

      const assignments =
        await ProgramAssignment.find(
          assignmentFilter,
        )
          .populate({
            path: "member",
            select:
              "firstName lastName email phone fitnessGoal isActive profilePhoto",
          })
          .populate({
            path: "program",
            populate: {
              path:
                "exercises.exercise",
            },
          })
          .sort({
            startDate: -1,
          })

      /*
      |--------------------------------------------------------------------------
      | If no assignments exist
      |--------------------------------------------------------------------------
      */

      if (!assignments.length) {
        return res.status(200).json({
          success: true,
          count: 0,
          progress: [],
        })
      }

      /*
      |--------------------------------------------------------------------------
      | Get workout logs
      |--------------------------------------------------------------------------
      */

      const memberIds =
        assignments.map(
          (assignment) =>
            assignment.member._id,
        )

      const programIds =
        assignments.map(
          (assignment) =>
            assignment.program._id,
        )

      const workoutLogs =
        await WorkoutLog.find({
          member: {
            $in: memberIds,
          },

          program: {
            $in: programIds,
          },

          workoutDate: {
            $gte: startOfDay,
            $lte: endOfDay,
          },
        }).populate({
          path:
            "exercises.exercise",
        })

      /*
      |--------------------------------------------------------------------------
      | Build progress response
      |--------------------------------------------------------------------------
      */

      const progress =
        assignments.map(
          (assignment) => {
            const log =
              workoutLogs.find(
                (workoutLog) =>
                  workoutLog.member
                    .toString() ===
                    assignment.member._id.toString() &&
                  workoutLog.program
                    .toString() ===
                    assignment.program._id.toString(),
              )

            const assignedExercises =
              assignment.program
                .exercises || []

            let totalSets = 0
            let completedSets = 0

            assignedExercises.forEach(
              (programExercise) => {
                const requiredSets =
                  Number(
                    programExercise.sets,
                  ) || 1

                totalSets +=
                  requiredSets

                const exerciseId =
                  programExercise.exercise
                    ?._id
                    ? programExercise
                        .exercise._id.toString()
                    : programExercise.exercise.toString()

                const loggedExercise =
                  log?.exercises?.find(
                    (item) =>
                      item.exercise
                        .toString() ===
                      exerciseId,
                  )

                if (
                  loggedExercise
                ) {
                  completedSets +=
                    loggedExercise.sets.filter(
                      (set) =>
                        set.completed,
                    ).length
                }
              },
            )

            let workoutStatus =
              "not_started"

            if (
              log?.completed
            ) {
              workoutStatus =
                "completed"
            } else if (
              completedSets > 0
            ) {
              workoutStatus =
                "in_progress"
            }

            return {
              member:
                assignment.member,

              program:
                assignment.program,

              assignment: {
                id:
                  assignment._id,

                startDate:
                  assignment.startDate,

                endDate:
                  assignment.endDate,

                status:
                  assignment.status,
              },

              workout: {
                date:
                  workoutDate,

                status:
                  workoutStatus,

                totalSets,

                completedSets,

                progressPercent:
                  totalSets > 0
                    ? Math.round(
                        (completedSets /
                          totalSets) *
                          100,
                      )
                    : 0,

                completed:
                  Boolean(
                    log?.completed,
                  ),

                completedAt:
                  log?.completedAt ||
                  null,

                caloriesBurned:
                  log?.caloriesBurned ||
                  0,

                exercises:
                  log?.exercises ||
                  [],
              },
            }
          },
        )

      /*
      |--------------------------------------------------------------------------
      | Optional status filtering
      |--------------------------------------------------------------------------
      */

      let filteredProgress =
        progress

      if (status) {
        filteredProgress =
          progress.filter(
            (item) =>
              item.workout.status ===
              status,
          )
      }

      return res.status(200).json({
        success: true,
        count:
          filteredProgress.length,
        progress:
          filteredProgress,
      })
    } catch (error) {
      console.error(
        "Get member workout progress error:",
        error,
      )

      return res.status(500).json({
        success: false,
        message:
          "Unable to retrieve member workout progress.",
      })
    }
  }

/*
|--------------------------------------------------------------------------
| Get one member's workout progress
|--------------------------------------------------------------------------
*/

const getMemberWorkoutProgressById =
  async (req, res) => {
    try {
      const {
        memberId,
      } = req.params

      const {
        date,
      } = req.query

      const workoutDate =
        date
          ? new Date(date)
          : new Date()

      if (
        Number.isNaN(
          workoutDate.getTime(),
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid workout date.",
        })
      }

      if (!(await ensureTrainerMemberAccess(req, memberId))) {
        return res.status(403).json({
          success: false,
          message:
            "You are not assigned to this member.",
        })
      }

      const member =
        await User.findOne({
          _id: memberId,
          role: "member",
        }).select(
          "-password",
        )

      if (!member) {
        return res.status(404).json({
          success: false,
          message:
            "Member not found.",
        })
      }

      const startOfDay =
        getStartOfDay(
          workoutDate,
        )

      const endOfDay =
        getEndOfDay(
          workoutDate,
        )

      const assignment =
        await ProgramAssignment.findOne(
          {
            member: memberId,

            status: "active",

            startDate: {
              $lte: endOfDay,
            },

            $or: [
              {
                endDate: null,
              },
              {
                endDate: {
                  $gte: startOfDay,
                },
              },
            ],
          },
        )
          .sort({
            startDate: -1,
          })
          .populate({
            path: "program",
            populate: {
              path:
                "exercises.exercise",
            },
          })

      if (!assignment) {
        return res.status(404).json({
          success: false,
          message:
            "No active program is assigned to this member for this date.",
        })
      }

      const workoutLog =
        await WorkoutLog.findOne({
          member: memberId,

          program:
            assignment.program._id,

          workoutDate: {
            $gte: startOfDay,
            $lte: endOfDay,
          },
        }).populate({
          path:
            "exercises.exercise",
        })

      return res.status(200).json({
        success: true,

        member,

        program:
          assignment.program,

        assignment: {
          id:
            assignment._id,

          startDate:
            assignment.startDate,

          endDate:
            assignment.endDate,

          status:
            assignment.status,
        },

        workout: {
          date: workoutDate,

          status:
            workoutLog?.completed
              ? "completed"
              : workoutLog?.exercises
                    ?.some(
                      (exercise) =>
                        exercise.sets.some(
                          (set) =>
                            set.completed,
                        ),
                    )
                ? "in_progress"
                : "not_started",

          completed:
            Boolean(
              workoutLog?.completed,
            ),

          completedAt:
            workoutLog?.completedAt ||
            null,

          caloriesBurned:
            workoutLog?.caloriesBurned ||
            0,

          exercises:
            workoutLog?.exercises ||
            [],
        },
      })
    } catch (error) {
      console.error(
        "Get member workout progress by ID error:",
        error,
      )

      return res.status(500).json({
        success: false,
        message:
          "Unable to retrieve member workout details.",
      })
    }
  }

export {
  getMemberWorkoutProgress,
  getMemberWorkoutProgressById,
}