import Gym from "../models/Gym.js"

export const getGymEntry = async (req, res) => {
  const gym = await Gym.findOne({ slug: String(req.params.slug || "").trim().toLowerCase(), isActive: true }).select("name slug logoUrl branding email phone address city state country socialMedia").lean()
  if (!gym) return res.status(404).json({ success: false, message: "Gym not found or inactive." })
  return res.json({ success: true, gym })
}
