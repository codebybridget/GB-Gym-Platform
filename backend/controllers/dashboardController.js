import User from "../models/User.js"
import Exercise from "../models/Exercise.js"
import Program from "../models/Program.js"
import ProgramAssignment from "../models/ProgramAssignment.js"

const getDashboardStats = async (req, res) => {
  try {
    const gymId = req.user?.gym
    if (!gymId) {
      return res.status(400).json({
        success: false,
        message: "Gym context is required.",
      })
    }

    const [
      totalMembers,
      activeMembers,
      inactiveMembers,
      totalTrainers,
      totalExercises,
      totalPrograms,
      activeAssignments,
    ] = await Promise.all([
      User.countDocuments({ gym: gymId, role: "member" }),
      User.countDocuments({ gym: gymId, role: "member", isActive: true }),
      User.countDocuments({ gym: gymId, role: "member", isActive: false }),
      User.countDocuments({ gym: gymId, role: "trainer" }),
      Exercise.countDocuments({ gym: gymId, isActive: true }),
      Program.countDocuments({ gym: gymId, isActive: true }),
      ProgramAssignment.countDocuments({ gym: gymId, status: "active" }),
    ])

    return res.status(200).json({
      success: true,
      stats: {
        totalMembers,
        activeMembers,
        inactiveMembers,
        totalTrainers,
        totalExercises,
        totalPrograms,
        activeAssignments,
      },
    })
  } catch (error) {
    console.error("Dashboard stats error:", error)
    return res.status(500).json({
      success: false,
      message: "Unable to retrieve dashboard statistics.",
    })
  }
}

export { getDashboardStats }
