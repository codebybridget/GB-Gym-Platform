import mongoose from "mongoose"
import TrainerAssignment from "../models/TrainerAssignment.js"
import User from "../models/User.js"

/*
|--------------------------------------------------------------------------
| Assign Trainer
|--------------------------------------------------------------------------
*/

const assignTrainer =
  async (req, res) => {
    try {
      const {
        trainerId,
        memberId,
      } = req.body

      if (
        !trainerId ||
        !memberId
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Trainer and member are required.",
        })
      }

      if (
        !mongoose.Types.ObjectId.isValid(
          trainerId,
        ) ||
        !mongoose.Types.ObjectId.isValid(
          memberId,
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid trainer or member ID.",
        })
      }

      const trainer =
        await User.findOne({
          _id: trainerId,
          role: "trainer",
        })

      if (!trainer) {
        return res.status(404).json({
          success: false,
          message:
            "Trainer not found.",
        })
      }

      const member =
        await User.findOne({
          _id: memberId,
          role: "member",
        })

      if (!member) {
        return res.status(404).json({
          success: false,
          message:
            "Member not found.",
        })
      }

      if (
        !trainer.isActive
      ) {
        return res.status(400).json({
          success: false,
          message:
            "This trainer account is inactive.",
        })
      }

      if (
        !member.isActive
      ) {
        return res.status(400).json({
          success: false,
          message:
            "This member account is inactive.",
        })
      }

      const existing =
        await TrainerAssignment.findOne(
          {
            trainer:
              trainerId,

            member:
              memberId,
          },
        )

      if (existing) {
        if (
          existing.status ===
          "active"
        ) {
          return res.status(409).json({
            success: false,
            message:
              "This trainer is already assigned to this member.",
          })
        }

        existing.status =
          "active"

        existing.assignedBy =
          req.user._id

        await existing.save()

        const restored =
          await TrainerAssignment.findById(
            existing._id,
          )
            .populate(
              "trainer",
              "firstName lastName email phone role",
            )
            .populate(
              "member",
              "firstName lastName email phone fitnessGoal",
            )
            .populate(
              "assignedBy",
              "firstName lastName role",
            )

        return res.status(200).json({
          success: true,
          message:
            "Trainer assignment restored.",
          assignment:
            restored,
        })
      }

      const assignment =
        await TrainerAssignment.create({
          trainer:
            trainerId,

          member:
            memberId,

          assignedBy:
            req.user._id,
        })

      const populated =
        await TrainerAssignment.findById(
          assignment._id,
        )
          .populate(
            "trainer",
            "firstName lastName email phone role",
          )
          .populate(
            "member",
            "firstName lastName email phone fitnessGoal",
          )
          .populate(
            "assignedBy",
            "firstName lastName role",
          )

      return res.status(201).json({
        success: true,
        message:
          "Trainer assigned successfully.",
        assignment:
          populated,
      })
    } catch (error) {
      console.error(
        "Assign trainer error:",
        error,
      )

      if (
        error.code === 11000
      ) {
        return res.status(409).json({
          success: false,
          message:
            "This trainer/member assignment already exists.",
        })
      }

      if (
        error.name ===
        "ValidationError"
      ) {
        return res.status(400).json({
          success: false,
          message:
            error.message ||
            "Invalid trainer assignment data.",
        })
      }

      return res.status(500).json({
        success: false,
        message:
          "Unable to assign trainer.",
      })
    }
  }

/*
|--------------------------------------------------------------------------
| Get Trainer Assignments
|--------------------------------------------------------------------------
*/

const getTrainerAssignments =
  async (req, res) => {
    try {
      const {
        trainerId,
      } = req.params

      if (
        !mongoose.Types.ObjectId.isValid(
          trainerId,
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid trainer ID.",
        })
      }

      const trainer =
        await User.findOne({
          _id: trainerId,
          role: "trainer",
        }).select(
          "_id",
        )

      if (!trainer) {
        return res.status(404).json({
          success: false,
          message:
            "Trainer not found.",
        })
      }

      const assignments =
        await TrainerAssignment.find(
          {
            trainer:
              trainerId,

            status:
              "active",
          },
        )
          .populate(
            "trainer",
            "firstName lastName email role",
          )
          .populate(
            "member",
            "firstName lastName email phone fitnessGoal isActive",
          )
          .sort({
            createdAt: -1,
          })

      return res.status(200).json({
        success: true,

        count:
          assignments.length,

        assignments,
      })
    } catch (error) {
      console.error(
        "Get trainer assignments error:",
        error,
      )

      return res.status(500).json({
        success: false,
        message:
          "Unable to retrieve trainer assignments.",
      })
    }
  }

/*
|--------------------------------------------------------------------------
| Get My Trainer Members
|--------------------------------------------------------------------------
*/

const getMyTrainerMembers =
  async (req, res) => {
    try {
      const assignments =
        await TrainerAssignment.find(
          {
            trainer:
              req.user._id,

            status:
              "active",
          },
        )
          .populate(
            "member",
            "firstName lastName email phone fitnessGoal height weight medicalProfile emergencyContacts profilePhoto isActive",
          )
          .sort({
            createdAt: -1,
          })

      const members =
        assignments
          .map(
            (
              assignment,
            ) =>
              assignment.member,
          )
          .filter(
            Boolean,
          )

      return res.status(200).json({
        success: true,

        count:
          members.length,

        members,
      })
    } catch (error) {
      console.error(
        "Get trainer members error:",
        error,
      )

      return res.status(500).json({
        success: false,
        message:
          "Unable to retrieve your assigned members.",
      })
    }
  }

/*
|--------------------------------------------------------------------------
| Remove Trainer Assignment
|--------------------------------------------------------------------------
*/

const removeTrainerAssignment =
  async (req, res) => {
    try {
      const {
        id,
      } = req.params

      if (
        !mongoose.Types.ObjectId.isValid(
          id,
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid trainer assignment ID.",
        })
      }

      const assignment =
        await TrainerAssignment.findById(
          id,
        )

      if (!assignment) {
        return res.status(404).json({
          success: false,
          message:
            "Trainer assignment not found.",
        })
      }

      if (
        assignment.status ===
        "inactive"
      ) {
        return res.status(200).json({
          success: true,
          message:
            "Trainer assignment is already inactive.",
        })
      }

      assignment.status =
        "inactive"

      await assignment.save()

      return res.status(200).json({
        success: true,
        message:
          "Trainer assignment removed.",
      })
    } catch (error) {
      console.error(
        "Remove trainer assignment error:",
        error,
      )

      return res.status(500).json({
        success: false,
        message:
          "Unable to remove trainer assignment.",
      })
    }
  }

export {
  assignTrainer,
  getTrainerAssignments,
  getMyTrainerMembers,
  removeTrainerAssignment,
}