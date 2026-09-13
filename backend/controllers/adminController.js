import crypto from "crypto"
import mongoose from "mongoose"
import User from "../models/User.js"
import Subscription from "../models/Subscription.js"

/*
|--------------------------------------------------------------------------
| Get Members
|--------------------------------------------------------------------------
*/

const getMembers = async (
  req,
  res,
) => {
  try {
    const {
      search,
      active,
    } = req.query

    const filter = {
      role: "member",
    }

    if (
      active !== undefined
    ) {
      filter.isActive =
        active === "true"
    }

    if (
      search?.trim()
    ) {
      const searchValue =
        search.trim()

      filter.$or = [
        {
          firstName: {
            $regex:
              searchValue,
            $options: "i",
          },
        },

        {
          lastName: {
            $regex:
              searchValue,
            $options: "i",
          },
        },

        {
          email: {
            $regex:
              searchValue,
            $options: "i",
          },
        },

        {
          phone: {
            $regex:
              searchValue,
            $options: "i",
          },
        },
      ]
    }

    const members =
      await User.find(filter)
        .select("-password")
        .sort({
          createdAt: -1,
        })

    const memberIds = members.map(
      (member) => member._id,
    )

    const subscriptions =
      memberIds.length > 0
        ? await Subscription.find({
            user: {
              $in: memberIds,
            },
            paymentStatus: "paid",
          })
            .populate(
              "membershipPlan",
              "name durationDays price currency features",
            )
            .sort({
              endDate: -1,
              createdAt: -1,
            })
        : []

    const now = new Date()
    const subscriptionByUser = new Map()

    for (const subscription of subscriptions) {
      const userId = String(
        subscription.user,
      )

      if (subscription.endDate) {
        const endTime = new Date(
          subscription.endDate,
        ).getTime()

        const startTime = subscription.startDate
          ? new Date(subscription.startDate).getTime()
          : endTime

        const totalDuration = Math.max(
          1,
          endTime - startTime,
        )
        const remainingDuration = Math.max(
          0,
          endTime - now.getTime(),
        )

        const daysRemaining =
          Math.max(
            0,
            Math.ceil(
              remainingDuration /
                (1000 * 60 * 60 * 24),
            ),
          )

        const percentageRemaining =
          Math.min(
            100,
            Math.max(
              0,
              Math.round(
                (remainingDuration /
                  totalDuration) *
                  100,
              ),
            ),
          )

        subscription.status =
          endTime > now.getTime()
            ? "active"
            : "expired"

        subscriptionByUser.set(
          userId,
          {
            ...subscription.toObject(),
            daysRemaining,
            percentageRemaining,
          },
        )
      }
    }

    const membersWithSubscriptions =
      members.map((member) => ({
        ...member.toObject(),
        subscription:
          subscriptionByUser.get(
            String(member._id),
          ) || null,
      }))

    return res.status(200).json({
      success: true,

      count:
        membersWithSubscriptions.length,

      members:
        membersWithSubscriptions,
    })
  } catch (error) {
    console.error(
      "Get members error:",
      error,
    )

    return res.status(500).json({
      success: false,
      message:
        "Unable to retrieve members.",
    })
  }
}

/*
|--------------------------------------------------------------------------
| Get One Member
|--------------------------------------------------------------------------
*/

const getMemberById =
  async (
    req,
    res,
  ) => {
    try {
      const {
        memberId,
      } = req.params

      if (
        !mongoose.Types.ObjectId.isValid(
          memberId,
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid member ID.",
        })
      }

      const member =
        await User.findOne({
          _id:
            memberId,

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

      return res.status(200).json({
        success: true,
        member,
      })
    } catch (error) {
      console.error(
        "Get member error:",
        error,
      )

      return res.status(500).json({
        success: false,
        message:
          "Unable to retrieve member.",
      })
    }
  }

/*
|--------------------------------------------------------------------------
| Update Member Status
|--------------------------------------------------------------------------
*/

const updateMemberStatus =
  async (
    req,
    res,
  ) => {
    try {
      const {
        memberId,
      } = req.params

      const {
        isActive,
      } = req.body

      if (
        !mongoose.Types.ObjectId.isValid(
          memberId,
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid member ID.",
        })
      }

      if (
        typeof isActive !==
        "boolean"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "isActive must be true or false.",
        })
      }

      const member =
        await User.findOneAndUpdate(
          {
            _id:
              memberId,

            role: "member",
          },

          {
            isActive,
          },

          {
            new: true,
            runValidators: true,
          },
        ).select(
          "-password",
        )

      if (!member) {
        return res.status(404).json({
          success: false,
          message:
            "Member not found.",
        })
      }

      return res.status(200).json({
        success: true,

        message:
          isActive
            ? "Member account activated."
            : "Member account deactivated.",

        member,
      })
    } catch (error) {
      console.error(
        "Update member status error:",
        error,
      )

      return res.status(500).json({
        success: false,
        message:
          "Unable to update member status.",
      })
    }
  }

/*
|--------------------------------------------------------------------------
| Get Trainers
|--------------------------------------------------------------------------
*/

const getTrainers =
  async (
    req,
    res,
  ) => {
    try {
      const trainers =
        await User.find({
          role: "trainer",
        })
          .select("-password")
          .sort({
            firstName: 1,
            lastName: 1,
          })

      return res.status(200).json({
        success: true,

        count:
          trainers.length,

        trainers,
      })
    } catch (error) {
      console.error(
        "Get trainers error:",
        error,
      )

      return res.status(500).json({
        success: false,
        message:
          "Unable to retrieve trainers.",
      })
    }
  }

/*
|--------------------------------------------------------------------------
| Create Trainer
|--------------------------------------------------------------------------
*/

const createTrainer =
  async (
    req,
    res,
  ) => {
    try {
      const {
        firstName,
        lastName,
        email,
        phone,
        age,
        dateOfBirth,
        address,
        profilePhoto,
      } = req.body

      if (
        !firstName?.trim() ||
        !lastName?.trim() ||
        !email?.trim()
      ) {
        return res.status(400).json({
          success: false,
          message:
            "First name, last name and email are required.",
        })
      }

      const normalizedEmail =
        email
          .trim()
          .toLowerCase()

      const existingUser =
        await User.findOne({
          email: normalizedEmail,
        })

      if (existingUser) {
        return res.status(409).json({
          success: false,
          message:
            "An account with this email already exists.",
        })
      }

      // User.password is required by the existing schema.
      // Trainers never receive or use this internal random password;
      // they authenticate through the one-time email verification flow.
      const internalPassword =
        crypto.randomBytes(32).toString("hex")

      if (!req.user?.gym) {
        return res.status(400).json({
          success: false,
          message:
            "Your administrator account is not associated with a gym.",
        })
      }

      const trainer =
        await User.create({
          firstName:
            firstName.trim(),

          lastName:
            lastName.trim(),

          email:
            normalizedEmail,

          password: internalPassword,

          phone:
            phone?.trim() || "",

          age:
            age === "" || age === null || age === undefined
              ? null
              : Number(age),

          dateOfBirth:
            dateOfBirth || null,

          address:
            address?.trim() || "",

          profilePhoto:
            profilePhoto?.trim() || "",

          gym: req.user.gym,

          role: "trainer",
          isActive: true,
        })

      const safeTrainer =
        await User.findById(
          trainer._id,
        ).select(
          "-password",
        )

      return res.status(201).json({
        success: true,

        message:
          "Trainer account created successfully.",

        trainer:
          safeTrainer,
      })
    } catch (error) {
      console.error(
        "Create trainer error:",
        error,
      )

      if (
        error.code === 11000
      ) {
        return res.status(409).json({
          success: false,
          message:
            "An account with this email already exists.",
        })
      }

      return res.status(500).json({
        success: false,
        message:
          "Unable to create trainer account.",
      })
    }
  }

/*
|--------------------------------------------------------------------------
| Update Trainer Status
|--------------------------------------------------------------------------
*/

const updateTrainerStatus =
  async (
    req,
    res,
  ) => {
    try {
      const { trainerId } = req.params
      const { isActive } = req.body

      if (!mongoose.Types.ObjectId.isValid(trainerId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid trainer ID.",
        })
      }

      if (typeof isActive !== "boolean") {
        return res.status(400).json({
          success: false,
          message: "isActive must be true or false.",
        })
      }

      const trainer = await User.findOneAndUpdate(
        { _id: trainerId, role: "trainer" },
        { isActive },
        { new: true, runValidators: true },
      ).select("-password")

      if (!trainer) {
        return res.status(404).json({
          success: false,
          message: "Trainer not found.",
        })
      }

      return res.status(200).json({
        success: true,
        message: isActive
          ? "Trainer account activated."
          : "Trainer account deactivated.",
        trainer,
      })
    } catch (error) {
      console.error("Update trainer status error:", error)
      return res.status(500).json({
        success: false,
        message: "Unable to update trainer status.",
      })
    }
  }

/*
|--------------------------------------------------------------------------
| Update User Role
|--------------------------------------------------------------------------
|
| Allowed roles:
|
| member
| trainer
| admin
|
|--------------------------------------------------------------------------
*/

const updateUserRole =
  async (
    req,
    res,
  ) => {
    try {
      const {
        userId,
      } = req.params

      const {
        role,
      } = req.body

      const validRoles = [
        "member",
        "trainer",
        "admin",
      ]

      /*
      |--------------------------------------------------------------------------
      | Validate role
      |--------------------------------------------------------------------------
      */

      if (
        !validRoles.includes(
          role,
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid role. Allowed roles are member, trainer and admin.",
        })
      }

      /*
      |--------------------------------------------------------------------------
      | Validate user ID
      |--------------------------------------------------------------------------
      */

      if (
        !mongoose.Types.ObjectId.isValid(
          userId,
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid user ID.",
        })
      }

      /*
      |--------------------------------------------------------------------------
      | Prevent self-demotion
      |--------------------------------------------------------------------------
      */

      if (
        String(
          req.user?._id,
        ) ===
          String(
            userId,
          ) &&
        role !== "admin"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "You cannot remove your own admin role.",
        })
      }

      /*
      |--------------------------------------------------------------------------
      | Find target user
      |--------------------------------------------------------------------------
      */

      const targetUser =
        await User.findById(
          userId,
        )

      if (!targetUser) {
        return res.status(404).json({
          success: false,
          message:
            "User not found.",
        })
      }

      /*
      |--------------------------------------------------------------------------
      | Prevent changing another admin
      |--------------------------------------------------------------------------
      |
      | Admin accounts should be managed deliberately.
      | This endpoint cannot demote another admin.
      |
      */

      if (
        targetUser.role ===
          "admin" &&
        role !== "admin"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "An administrator cannot be demoted through this endpoint.",
        })
      }

      /*
      |--------------------------------------------------------------------------
      | Update Role
      |--------------------------------------------------------------------------
      */

      targetUser.role =
        role

      await targetUser.save()

      const safeUser =
        await User.findById(
          targetUser._id,
        ).select(
          "-password",
        )

      return res.status(200).json({
        success: true,

        message:
          `User role updated to ${role}.`,

        user:
          safeUser,
      })
    } catch (error) {
      console.error(
        "Update user role error:",
        error,
      )

      if (
        error.name ===
        "CastError"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid user ID.",
        })
      }

      return res.status(500).json({
        success: false,
        message:
          "Unable to update user role.",
      })
    }
  }

export {
  getMembers,
  getMemberById,
  updateMemberStatus,
  getTrainers,
  createTrainer,
  updateTrainerStatus,
  updateUserRole,
}