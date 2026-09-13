import mongoose from "mongoose"

export const requireGym = (req, res, next) => {
  const gymId = req.user?.gym

  if (!gymId || !mongoose.Types.ObjectId.isValid(gymId)) {
    return res.status(403).json({
      success: false,
      message: "This account is not assigned to a gym.",
    })
  }

  req.gymId = gymId.toString()
  next()
}

export const getGymFilter = (req) => {
  const gymId = req.gymId || req.user?.gym
  return gymId ? { gym: gymId } : {}
}
