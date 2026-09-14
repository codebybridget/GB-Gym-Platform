import crypto from "crypto"
import mongoose from "mongoose"
import User from "../models/User.js"
import Subscription from "../models/Subscription.js"
import GymSubscription from "../models/GymSubscription.js"

/*
|--------------------------------------------------------------------------
| SaaS Plan Limit Helper
|--------------------------------------------------------------------------
|
| maxMembers and maxTrainers belong to the GB SaaS plan.
|
| null / undefined = unlimited
|
| Only ACTIVE users count toward the limit.
|
|--------------------------------------------------------------------------
*/

const getValidGymSubscription = async (gymId) => {
  const now = new Date()

  const subscription = await GymSubscription.findOne({
    gym: gymId,

    status: {
      $in: ["active", "trial"],
    },

    $or: [
      {
        status: "active",

        paymentStatus: "paid",

        currentPeriodEnd: {
          $gt: now,
        },
      },

      {
        status: "trial",

        trialEndsAt: {
          $gt: now,
        },
      },
    ],
  })
    .populate("plan")
    .sort({
      currentPeriodEnd: -1,
      trialEndsAt: -1,
      createdAt: -1,
    })

  return subscription
}

/*
|--------------------------------------------------------------------------
| Check SaaS Role Limit
|--------------------------------------------------------------------------
*/

const getSaasRoleLimitError = async (gymId, role) => {
  if (role !== "member" && role !== "trainer") {
    return null
  }

  const subscription = await getValidGymSubscription(gymId)

  if (!subscription) {
    return {
      code: "GYM_SUBSCRIPTION_REQUIRED",

      message:
        "This gym's subscription is not active. Complete or renew the gym subscription before adding or activating users.",
    }
  }

  const limitField =
    role === "member"
      ? "maxMembers"
      : "maxTrainers"

  const limit = subscription.plan?.[limitField]

  /*
  |--------------------------------------------------------------------------
  | Unlimited
  |--------------------------------------------------------------------------
  */

  if (limit === null || limit === undefined) {
    return null
  }

  const activeCount = await User.countDocuments({
    gym: gymId,

    role,

    isActive: true,
  })

  if (activeCount >= Number(limit)) {
    return {
      code:
        role === "member"
          ? "SAAS_MEMBER_LIMIT_REACHED"
          : "SAAS_TRAINER_LIMIT_REACHED",

      message:
        `Your ${subscription.plan.name} plan has reached its ${role} limit (${limit}). Please upgrade your plan to add or activate more ${role}s.`,
    }
  }

  return null
}

/*
|--------------------------------------------------------------------------
| Get Members
|--------------------------------------------------------------------------
*/

const getMembers = async (req, res) => {
  try {
    const {
      search,
      active,
    } = req.query

    if (!req.user?.gym) {
      return res.status(400).json({
        success: false,
        message:
          "Your administrator account is not associated with a gym.",
      })
    }

    const filter = {
      gym: req.user.gym,
      role: "member",
    }

    if (active !== undefined) {
      filter.isActive = active === "true"
    }

    if (search?.trim()) {
      const searchValue = search.trim()

      filter.$or = [
        {
          firstName: {
            $regex: searchValue,
            $options: "i",
          },
        },

        {
          lastName: {
            $regex: searchValue,
            $options: "i",
          },
        },

        {
          email: {
            $regex: searchValue,
            $options: "i",
          },
        },

        {
          phone: {
            $regex: searchValue,
            $options: "i",
          },
        },
      ]
    }

    const members = await User.find(filter)
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

            gym: req.user.gym,

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
      const userId = String(subscription.user)

      if (subscription.endDate) {
        const endTime = new Date(
          subscription.endDate,
        ).getTime()

        const startTime = subscription.startDate
          ? new Date(
              subscription.startDate,
            ).getTime()
          : endTime

        const totalDuration = Math.max(
          1,
          endTime - startTime,
        )

        const remainingDuration = Math.max(
          0,
          endTime - now.getTime(),
        )

        const daysRemaining = Math.max(
          0,
          Math.ceil(
            remainingDuration /
              (1000 * 60 * 60 * 24),
          ),
        )

        const percentageRemaining = Math.min(
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

        subscriptionByUser.set(userId, {
          ...subscription.toObject(),

          daysRemaining,

          percentageRemaining,
        })
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

      count: membersWithSubscriptions.length,

      members: membersWithSubscriptions,
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

const getMemberById = async (req, res) => {
  try {
    const { memberId } = req.params

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

    if (!req.user?.gym) {
      return res.status(400).json({
        success: false,

        message:
          "Your administrator account is not associated with a gym.",
      })
    }

    const member = await User.findOne({
      _id: memberId,

      gym: req.user.gym,

      role: "member",
    }).select("-password")

    if (!member) {
      return res.status(404).json({
        success: false,

        message: "Member not found.",
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

const updateMemberStatus = async (
  req,
  res,
) => {
  try {
    const { memberId } = req.params

    const { isActive } = req.body

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

    if (typeof isActive !== "boolean") {
      return res.status(400).json({
        success: false,

        message:
          "isActive must be true or false.",
      })
    }

    if (!req.user?.gym) {
      return res.status(400).json({
        success: false,

        message:
          "Your administrator account is not associated with a gym.",
      })
    }

    /*
    |--------------------------------------------------------------------------
    | Find member inside the current gym only
    |--------------------------------------------------------------------------
    */

    const existingMember =
      await User.findOne({
        _id: memberId,

        gym: req.user.gym,

        role: "member",
      })

    if (!existingMember) {
      return res.status(404).json({
        success: false,

        message: "Member not found.",
      })
    }

    /*
    |--------------------------------------------------------------------------
    | Enforce maxMembers only when activating an inactive member.
    |--------------------------------------------------------------------------
    */

    if (
      isActive &&
      !existingMember.isActive
    ) {
      const limitError =
        await getSaasRoleLimitError(
          req.user.gym,
          "member",
        )

      if (limitError) {
        return res.status(403).json({
          success: false,

          code: limitError.code,

          message: limitError.message,
        })
      }
    }

    existingMember.isActive =
      isActive

    await existingMember.save()

    const member = await User.findById(
      existingMember._id,
    ).select("-password")

    return res.status(200).json({
      success: true,

      message: isActive
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

const getTrainers = async (req, res) => {
  try {
    if (!req.user?.gym) {
      return res.status(400).json({
        success: false,

        message:
          "Your administrator account is not associated with a gym.",
      })
    }

    const trainers = await User.find({
      gym: req.user.gym,

      role: "trainer",
    })
      .select("-password")
      .sort({
        firstName: 1,
        lastName: 1,
      })

    return res.status(200).json({
      success: true,

      count: trainers.length,

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

const createTrainer = async (req, res) => {
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

    if (!req.user?.gym) {
      return res.status(400).json({
        success: false,

        message:
          "Your administrator account is not associated with a gym.",
      })
    }

    const normalizedEmail =
      email.trim().toLowerCase()

    /*
    |--------------------------------------------------------------------------
    | Enforce maxTrainers BEFORE creating the trainer.
    |--------------------------------------------------------------------------
    */

    const limitError =
      await getSaasRoleLimitError(
        req.user.gym,
        "trainer",
      )

    if (limitError) {
      return res.status(403).json({
        success: false,

        code: limitError.code,

        message: limitError.message,
      })
    }

    /*
    |--------------------------------------------------------------------------
    | Tenant-specific trainer email uniqueness
    |--------------------------------------------------------------------------
    */

    const existingUser =
      await User.findOne({
        gym: req.user.gym,

        email: normalizedEmail,
      })

    if (existingUser) {
      return res.status(409).json({
        success: false,

        message:
          "An account with this email already exists at this gym.",
      })
    }

    /*
    |--------------------------------------------------------------------------
    | User.password is required by the existing schema.
    |--------------------------------------------------------------------------
    |
    | Trainers authenticate through the one-time email verification flow.
    |
    |--------------------------------------------------------------------------
    */

    const internalPassword =
      crypto
        .randomBytes(32)
        .toString("hex")

    const trainer =
      await User.create({
        firstName:
          firstName.trim(),

        lastName:
          lastName.trim(),

        email:
          normalizedEmail,

        password:
          internalPassword,

        phone:
          phone?.trim() || "",

        age:
          age === "" ||
          age === null ||
          age === undefined
            ? null
            : Number(age),

        dateOfBirth:
          dateOfBirth || null,

        address:
          address?.trim() || "",

        profilePhoto:
          profilePhoto?.trim() || "",

        gym:
          req.user.gym,

        role: "trainer",

        isActive: true,
      })

    const safeTrainer =
      await User.findById(
        trainer._id,
      ).select("-password")

    return res.status(201).json({
      success: true,

      message:
        "Trainer account created successfully.",

      trainer: safeTrainer,
    })
  } catch (error) {
    console.error(
      "Create trainer error:",
      error,
    )

    if (error?.code === 11000) {
      return res.status(409).json({
        success: false,

        message:
          "An account with this email already exists at this gym.",
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

const updateTrainerStatus = async (
  req,
  res,
) => {
  try {
    const { trainerId } = req.params

    const { isActive } = req.body

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

    if (typeof isActive !== "boolean") {
      return res.status(400).json({
        success: false,

        message:
          "isActive must be true or false.",
      })
    }

    if (!req.user?.gym) {
      return res.status(400).json({
        success: false,

        message:
          "Your administrator account is not associated with a gym.",
      })
    }

    /*
    |--------------------------------------------------------------------------
    | Find trainer inside the current gym only
    |--------------------------------------------------------------------------
    */

    const existingTrainer =
      await User.findOne({
        _id: trainerId,

        gym: req.user.gym,

        role: "trainer",
      })

    if (!existingTrainer) {
      return res.status(404).json({
        success: false,

        message: "Trainer not found.",
      })
    }

    /*
    |--------------------------------------------------------------------------
    | Enforce maxTrainers only when activating an inactive trainer.
    |--------------------------------------------------------------------------
    */

    if (
      isActive &&
      !existingTrainer.isActive
    ) {
      const limitError =
        await getSaasRoleLimitError(
          req.user.gym,
          "trainer",
        )

      if (limitError) {
        return res.status(403).json({
          success: false,

          code: limitError.code,

          message: limitError.message,
        })
      }
    }

    existingTrainer.isActive =
      isActive

    await existingTrainer.save()

    const trainer = await User.findById(
      existingTrainer._id,
    ).select("-password")

    return res.status(200).json({
      success: true,

      message: isActive
        ? "Trainer account activated."
        : "Trainer account deactivated.",

      trainer,
    })
  } catch (error) {
    console.error(
      "Update trainer status error:",
      error,
    )

    return res.status(500).json({
      success: false,

      message:
        "Unable to update trainer status.",
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

const updateUserRole = async (
  req,
  res,
) => {
  try {
    const { userId } = req.params

    const { role } = req.body

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

    if (!validRoles.includes(role)) {
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
    | Administrator must belong to a gym
    |--------------------------------------------------------------------------
    */

    if (!req.user?.gym) {
      return res.status(400).json({
        success: false,

        message:
          "Your administrator account is not associated with a gym.",
      })
    }

    /*
    |--------------------------------------------------------------------------
    | Prevent self-demotion
    |--------------------------------------------------------------------------
    */

    if (
      String(req.user?._id) ===
        String(userId) &&
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
    | Find target user inside the current gym only
    |--------------------------------------------------------------------------
    */

    const targetUser =
      await User.findOne({
        _id: userId,

        gym: req.user.gym,
      })

    if (!targetUser) {
      return res.status(404).json({
        success: false,

        message: "User not found.",
      })
    }

    /*
    |--------------------------------------------------------------------------
    | Prevent changing another admin
    |--------------------------------------------------------------------------
    */

    if (
      targetUser.role === "admin" &&
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
    | No role change
    |--------------------------------------------------------------------------
    */

    if (targetUser.role === role) {
      const safeUser =
        await User.findById(
          targetUser._id,
        ).select("-password")

      return res.status(200).json({
        success: true,

        message:
          `User role is already ${role}.`,

        user: safeUser,
      })
    }

    /*
    |--------------------------------------------------------------------------
    | SaaS limit enforcement for role changes
    |--------------------------------------------------------------------------
    |
    | Only an ACTIVE user consumes a member/trainer seat.
    |
    | Example:
    |
    | Plan:
    |   100 members
    |   3 trainers
    |
    | If the gym already has 3 active trainers, changing an active
    | member into a trainer is blocked.
    |
    | If the target user is inactive, changing their role does not consume
    | a seat until that user is activated.
    |
    |--------------------------------------------------------------------------
    */

    if (
      targetUser.isActive &&
      (role === "member" ||
        role === "trainer")
    ) {
      const limitError =
        await getSaasRoleLimitError(
          targetUser.gym,
          role,
        )

      /*
      |--------------------------------------------------------------------------
      | Important:
      | When changing roles, the target user may already occupy a seat under
      | their current role. We only care about the destination role.
      |
      | Example:
      | Member → Trainer
      | The member seat is released by the role change and a trainer seat
      | is consumed.
      |--------------------------------------------------------------------------
      */

      if (
        limitError &&
        targetUser.role !== role
      ) {
        return res.status(403).json({
          success: false,

          code: limitError.code,

          message: limitError.message,
        })
      }
    }

    /*
    |--------------------------------------------------------------------------
    | Update Role
    |--------------------------------------------------------------------------
    */

    targetUser.role = role

    await targetUser.save()

    const safeUser =
      await User.findById(
        targetUser._id,
      ).select("-password")

    return res.status(200).json({
      success: true,

      message:
        `User role updated to ${role}.`,

      user: safeUser,
    })
  } catch (error) {
    console.error(
      "Update user role error:",
      error,
    )

    if (error?.name === "CastError") {
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

/*
|--------------------------------------------------------------------------
| Exports
|--------------------------------------------------------------------------
*/

export {
  getMembers,
  getMemberById,
  updateMemberStatus,
  getTrainers,
  createTrainer,
  updateTrainerStatus,
  updateUserRole,
}