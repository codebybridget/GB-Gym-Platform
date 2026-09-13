import User from "../models/User.js"
import WorkoutLog from "../models/WorkoutLog.js"

const getTrainerMembers = async (req, res) => {
  try {
    if (!req.user?.gym) {
      return res.status(400).json({
        success: false,
        message: "Trainer is not associated with a gym.",
      })
    }

    const members = await User.find({
      gym: req.user.gym,
      role: "member",
      isActive: true,
    })
      .select(
        "firstName lastName email phone role isActive fitnessGoal profilePhoto gym",
      )
      .sort({
        firstName: 1,
        lastName: 1,
      })

    return res.status(200).json({
      success: true,
      count: members.length,
      members,
    })
  } catch (error) {
    console.error(
      "Get trainer members error:",
      error,
    )

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve trainer members.",
    })
  }
}

const getTrainerMemberById = async (
  req,
  res,
) => {
  try {
    const { memberId } = req.params

    if (!req.user?.gym) {
      return res.status(400).json({
        success: false,
        message: "Trainer is not associated with a gym.",
      })
    }

    if (!memberId) {
      return res.status(400).json({
        success: false,
        message: "Member ID is required.",
      })
    }

    const member = await User.findOne({
      _id: memberId,
      gym: req.user.gym,
      role: "member",
    }).select(
      "firstName lastName email phone role isActive fitnessGoal profilePhoto gym",
    )

    if (!member) {
      return res.status(404).json({
        success: false,
        message: "Member not found in your gym.",
      })
    }

    return res.status(200).json({
      success: true,
      member,
    })
  } catch (error) {
    console.error(
      "Get trainer member error:",
      error,
    )

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve member.",
    })
  }
}

const getTrainerProgress = async (
  req,
  res,
) => {
  try {
    if (!req.user?.gym) {
      return res.status(400).json({
        success: false,
        message: "Trainer is not associated with a gym.",
      })
    }

    const memberIds = await User.find({
      gym: req.user.gym,
      role: "member",
      isActive: true,
    }).distinct("_id")

    const logs = await WorkoutLog.find({
      member: {
        $in: memberIds,
      },
    })
      .populate(
        "member",
        "firstName lastName email",
      )
      .populate(
        "program",
        "name workoutType",
      )
      .sort({
        workoutDate: -1,
        createdAt: -1,
      })
      .limit(500)

    return res.status(200).json({
      success: true,
      count: logs.length,
      progress: logs,
    })
  } catch (error) {
    console.error(
      "Get trainer progress error:",
      error,
    )

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve trainer progress.",
    })
  }
}

const getTrainerMemberProgress = async (
  req,
  res,
) => {
  try {
    const { memberId } = req.params

    if (!req.user?.gym) {
      return res.status(400).json({
        success: false,
        message: "Trainer is not associated with a gym.",
      })
    }

    if (!memberId) {
      return res.status(400).json({
        success: false,
        message: "Member ID is required.",
      })
    }

    const member = await User.findOne({
      _id: memberId,
      gym: req.user.gym,
      role: "member",
    }).select("_id")

    if (!member) {
      return res.status(404).json({
        success: false,
        message: "Member not found in your gym.",
      })
    }

    const logs = await WorkoutLog.find({
      member: memberId,
    })
      .populate(
        "program",
        "name workoutType",
      )
      .sort({
        workoutDate: -1,
        createdAt: -1,
      })
      .limit(500)

    return res.status(200).json({
      success: true,
      count: logs.length,
      progress: logs,
    })
  } catch (error) {
    console.error(
      "Get trainer member progress error:",
      error,
    )

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve member progress.",
    })
  }
}

export {
  getTrainerMembers,
  getTrainerMemberById,
  getTrainerProgress,
  getTrainerMemberProgress,
}