import Gym from "../models/Gym.js"
import User from "../models/User.js"
import SaasPlan from "../models/SaasPlan.js"
import GymSubscription from "../models/GymSubscription.js"
import PlatformTransaction from "../models/PlatformTransaction.js"
import PlatformSetting from "../models/PlatformSetting.js"

const adminOnly = (req) => req.user?.role === "platform_owner"

const syncGymForSubscription = async (subscription) => {
  if (!subscription?.gym) return false

  const now = new Date()
  const valid = (
    subscription.status === "active" &&
    subscription.paymentStatus === "paid" &&
    (!subscription.currentPeriodEnd || new Date(subscription.currentPeriodEnd) > now)
  ) || (
    subscription.status === "trial" &&
    subscription.trialEndsAt && new Date(subscription.trialEndsAt) > now
  )

  await Gym.findByIdAndUpdate(subscription.gym, { isActive: Boolean(valid) })
  if (subscription.owner) {
    await User.findByIdAndUpdate(subscription.owner, { isActive: Boolean(valid) })
  }
  return Boolean(valid)
}

export const getDashboard = async (req, res) => {
  const [gyms, active, subs, revenue] = await Promise.all([
    Gym.countDocuments(),
    Gym.countDocuments({ isActive: true }),
    GymSubscription.countDocuments({ status: { $in: ["active", "trial"] } }),
    PlatformTransaction.aggregate([
      { $match: { status: "success" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
  ])

  res.json({
    success: true,
    stats: {
      gyms,
      activeGyms: active,
      activeSubscriptions: subs,
      totalRevenue: revenue[0]?.total || 0,
    },
  })
}

export const listGyms = async (req, res) => {
  const gyms = await Gym.find().sort({ createdAt: -1 }).lean()
  const ids = gyms.map(g => g._id)
  const owners = await User.find({ gym: { $in: ids }, role: "admin" }).select("-password").lean()
  const subs = await GymSubscription.find({ gym: { $in: ids } }).populate("plan", "name").sort({ createdAt: -1 }).lean()

  const ownerMap = new Map(owners.map(x => [String(x.gym), x]))
  const subMap = new Map()
  for (const s of subs) {
    const key = String(s.gym)
    if (!subMap.has(key)) subMap.set(key, s)
  }

  res.json({
    success: true,
    gyms: gyms.map(g => ({
      ...g,
      owner: ownerMap.get(String(g._id)) || null,
      subscription: subMap.get(String(g._id)) || null,
    })),
  })
}

export const updateGym = async (req, res) => {
  const allowed = ["name", "email", "phone", "address", "city", "state", "country", "logoUrl", "socialMedia", "branding", "settings", "isActive"]
  const patch = {}
  for (const key of allowed) if (req.body[key] !== undefined) patch[key] = req.body[key]

  const gym = await Gym.findByIdAndUpdate(req.params.id, { $set: patch }, { new: true, runValidators: true })
  if (!gym) return res.status(404).json({ success: false, message: "Gym not found." })
  res.json({ success: true, gym })
}

export const listPlans = async (req, res) => res.json({ success: true, plans: await SaasPlan.find().sort({ displayOrder: 1, createdAt: -1 }) })

export const createPlan = async (req, res) => {
  const body = { ...req.body }
  body.price = Number(body.price || 0)
  body.trialDays = Number(body.trialDays || 0)
  body.maxMembers = body.maxMembers === "" || body.maxMembers == null ? null : Number(body.maxMembers)
  body.maxTrainers = body.maxTrainers === "" || body.maxTrainers == null ? null : Number(body.maxTrainers)
  res.status(201).json({ success: true, plan: await SaasPlan.create(body) })
}

export const updatePlan = async (req, res) => {
  const body = { ...req.body }
  if (body.price !== undefined) body.price = Number(body.price)
  if (body.trialDays !== undefined) body.trialDays = Number(body.trialDays)
  if (body.maxMembers === "") body.maxMembers = null
  if (body.maxTrainers === "") body.maxTrainers = null

  const plan = await SaasPlan.findByIdAndUpdate(req.params.id, { $set: body }, { new: true, runValidators: true })
  if (!plan) return res.status(404).json({ success: false, message: "Plan not found." })
  res.json({ success: true, plan })
}

export const deletePlan = async (req, res) => {
  const plan = await SaasPlan.findByIdAndUpdate(req.params.id, { active: false }, { new: true })
  if (!plan) return res.status(404).json({ success: false, message: "Plan not found." })
  res.json({ success: true, plan })
}

export const listSubscriptions = async (req, res) => {
  const subscriptions = await GymSubscription.find()
    .populate("gym", "name slug isActive")
    .populate("plan", "name")
    .sort({ createdAt: -1 })

  // The newest subscription is the source of truth for each gym. This prevents an
  // expired/cancelled current subscription from leaving an old gym access flag active.
  const latestByGym = new Map()
  for (const s of subscriptions) {
    const key = String(s.gym?._id || s.gym || "")
    if (key && !latestByGym.has(key)) latestByGym.set(key, s)
  }
  for (const s of latestByGym.values()) await syncGymForSubscription(s)

  res.json({ success: true, subscriptions })
}

export const updateSubscription = async (req, res) => {
  const allowed = [
    "status",
    "paymentStatus",
    "amount",
    "currency",
    "billingCycle",
    "startDate",
    "trialEndsAt",
    "currentPeriodStart",
    "currentPeriodEnd",
    "nextBillingDate",
    "transactionReference",
    "notes",
  ]
  const patch = {}
  for (const key of allowed) if (req.body[key] !== undefined) patch[key] = req.body[key]

  const s = await GymSubscription.findByIdAndUpdate(req.params.id, { $set: patch }, { new: true, runValidators: true })
  if (!s) return res.status(404).json({ success: false, message: "Subscription not found." })

  await syncGymForSubscription(s)
  res.json({ success: true, subscription: s })
}

export const cancelSubscription = async (req, res) => {
  const s = await GymSubscription.findByIdAndUpdate(
    req.params.id,
    { status: "cancelled", cancelledAt: new Date() },
    { new: true },
  )
  if (!s) return res.status(404).json({ success: false, message: "Subscription not found." })

  await Gym.findByIdAndUpdate(s.gym, { isActive: false })
  if (s.owner) await User.findByIdAndUpdate(s.owner, { isActive: false })
  res.json({ success: true, subscription: s })
}

export const reactivateSubscription = async (req, res) => {
  const s = await GymSubscription.findById(req.params.id)
  if (!s) return res.status(404).json({ success: false, message: "Subscription not found." })

  const now = new Date()
  const end = s.currentPeriodEnd ? new Date(s.currentPeriodEnd) : null
  if (s.paymentStatus !== "paid" || (end && end <= now)) {
    return res.status(400).json({ success: false, message: "This subscription cannot be reactivated because it is not currently paid and valid. Renew the subscription instead." })
  }

  await GymSubscription.updateMany(
    { gym: s.gym, _id: { $ne: s._id }, status: { $in: ["active", "trial"] } },
    { status: "cancelled", cancelledAt: now },
  )

  s.status = "active"
  s.cancelledAt = null
  s.suspendedAt = null
  await s.save()
  await Gym.findByIdAndUpdate(s.gym, { isActive: true })
  if (s.owner) await User.findByIdAndUpdate(s.owner, { isActive: true })

  res.json({ success: true, subscription: s })
}

export const platformRevenue = async (req, res) => {
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1)

  const [agg, monthly, byPlan, transactions] = await Promise.all([
    PlatformTransaction.aggregate([
      { $match: { status: "success" } },
      { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } },
    ]),
    PlatformTransaction.aggregate([
      { $match: { status: "success", createdAt: { $gte: monthStart } } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
    PlatformTransaction.aggregate([
      { $match: { status: "success" } },
      { $group: { _id: "$plan", total: { $sum: "$amount" }, count: { $sum: 1 } } },
      { $lookup: { from: "saasplans", localField: "_id", foreignField: "_id", as: "plan" } },
      { $project: { total: 1, count: 1, plan: { $arrayElemAt: ["$plan.name", 0] } } },
    ]),
    PlatformTransaction.find()
      .populate("gym", "name")
      .populate("plan", "name")
      .sort({ createdAt: -1 })
      .limit(200)
      .lean(),
  ])

  res.json({
    success: true,
    summary: {
      total: agg[0]?.total || 0,
      count: agg[0]?.count || 0,
      monthly: monthly[0]?.total || 0,
      byPlan,
    },
    transactions,
  })
}

export const settings = async (req, res) => {
  const rows = await PlatformSetting.find().lean()
  const values = Object.fromEntries(rows.map(x => [x.key, x.value]))
  res.json({
    success: true,
    settings: {
      platformName: values.platformName || process.env.PLATFORM_NAME || "GB",
      supportEmail: values.supportEmail || process.env.SUPPORT_EMAIL || "",
      currency: values.currency || process.env.DEFAULT_CURRENCY || "NGN",
    },
  })
}

export const updateSettings = async (req, res) => {
  for (const [key, value] of Object.entries(req.body || {})) {
    await PlatformSetting.findOneAndUpdate({ key }, { value }, { upsert: true, new: true })
  }
  res.json({ success: true, settings: req.body })
}
