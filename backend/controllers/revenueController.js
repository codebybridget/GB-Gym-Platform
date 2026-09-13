import Payment from "../models/Payment.js"
import User from "../models/User.js"
import MembershipPlan from "../models/MembershipPlan.js"

const buildDateRange = (period) => {
  const now = new Date()

  if (period === "today") {
    const start = new Date(now)
    start.setHours(0, 0, 0, 0)
    return { start, end: now }
  }

  if (period === "month") {
    return {
      start: new Date(
        now.getFullYear(),
        now.getMonth(),
        1,
      ),
      end: now,
    }
  }

  if (period === "year") {
    return {
      start: new Date(
        now.getFullYear(),
        0,
        1,
      ),
      end: now,
    }
  }

  return null
}

export const getRevenueOverview = async (
  req,
  res,
) => {
  try {
    const successfulFilter = {
      status: "success",
    }

    const ranges = {
      today: buildDateRange("today"),
      month: buildDateRange("month"),
      year: buildDateRange("year"),
    }

    const [
      allRevenue,
      todayRevenue,
      monthRevenue,
      yearRevenue,
    ] = await Promise.all([
      Payment.aggregate([
        {
          $match: successfulFilter,
        },
        {
          $group: {
            _id: "$currency",
            total: {
              $sum: "$amount",
            },
          },
        },
      ]),

      Payment.aggregate([
        {
          $match: {
            ...successfulFilter,
            paidAt: {
              $gte: ranges.today.start,
              $lte: ranges.today.end,
            },
          },
        },
        {
          $group: {
            _id: "$currency",
            total: {
              $sum: "$amount",
            },
          },
        },
      ]),

      Payment.aggregate([
        {
          $match: {
            ...successfulFilter,
            paidAt: {
              $gte: ranges.month.start,
              $lte: ranges.month.end,
            },
          },
        },
        {
          $group: {
            _id: "$currency",
            total: {
              $sum: "$amount",
            },
          },
        },
      ]),

      Payment.aggregate([
        {
          $match: {
            ...successfulFilter,
            paidAt: {
              $gte: ranges.year.start,
              $lte: ranges.year.end,
            },
          },
        },
        {
          $group: {
            _id: "$currency",
            total: {
              $sum: "$amount",
            },
          },
        },
      ]),
    ])

    const successfulPayments =
      await Payment.countDocuments(
        successfulFilter,
      )

    const formatTotals = (items) =>
      items.reduce(
        (result, item) => {
          result[item._id || "NGN"] =
            Number(item.total || 0)

          return result
        },
        {},
      )

    return res.status(200).json({
      success: true,
      data: {
        totalRevenue:
          formatTotals(allRevenue),

        revenueToday:
          formatTotals(todayRevenue),

        revenueThisMonth:
          formatTotals(monthRevenue),

        revenueThisYear:
          formatTotals(yearRevenue),

        successfulPayments,
      },
    })
  } catch (error) {
    console.error(
      "Get revenue overview error:",
      error,
    )

    return res.status(500).json({
      success: false,
      message:
        "Unable to load revenue overview.",
    })
  }
}

export const getRevenueTransactions =
  async (req, res) => {
    try {
      const page = Math.max(
        Number(req.query.page) || 1,
        1,
      )

      const limit = Math.min(
        Math.max(
          Number(req.query.limit) || 20,
          1,
        ),
        100,
      )

      const skip = (page - 1) * limit

      const filter = {
        status: "success",
      }

      if (req.query.startDate) {
        filter.paidAt = {
          ...(filter.paidAt || {}),
          $gte: new Date(
            req.query.startDate,
          ),
        }
      }

      if (req.query.endDate) {
        const endDate = new Date(
          req.query.endDate,
        )

        endDate.setHours(
          23,
          59,
          59,
          999,
        )

        filter.paidAt = {
          ...(filter.paidAt || {}),
          $lte: endDate,
        }
      }

      if (req.query.planId) {
        filter.membershipPlan =
          req.query.planId
      }

      const [
        transactions,
        total,
      ] = await Promise.all([
        Payment.find(filter)
          .populate(
            "user",
            "firstName lastName name email",
          )
          .populate(
            "membershipPlan",
            "name durationDays price currency",
          )
          .sort({
            paidAt: -1,
            createdAt: -1,
          })
          .skip(skip)
          .limit(limit)
          .lean(),

        Payment.countDocuments(filter),
      ])

      return res.status(200).json({
        success: true,
        data: {
          transactions,

          pagination: {
            page,
            limit,
            total,
            totalPages:
              Math.ceil(
                total / limit,
              ),
          },
        },
      })
    } catch (error) {
      console.error(
        "Get revenue transactions error:",
        error,
      )

      return res.status(500).json({
        success: false,
        message:
          "Unable to load revenue transactions.",
      })
    }
  }

export const getRevenueByPlan =
  async (req, res) => {
    try {
      const revenueByPlan =
        await Payment.aggregate([
          {
            $match: {
              status: "success",
            },
          },

          {
            $group: {
              _id: "$membershipPlan",
              revenue: {
                $sum: "$amount",
              },
              payments: {
                $sum: 1,
              },
            },
          },

          {
            $lookup: {
              from:
                MembershipPlan.collection
                  .name,

              localField:
                "_id",

              foreignField:
                "_id",

              as: "plan",
            },
          },

          {
            $unwind: {
              path: "$plan",
              preserveNullAndEmptyArrays:
                true,
            },
          },

          {
            $project: {
              _id: 1,

              planName: {
                $ifNull: [
                  "$plan.name",
                  "Unknown Plan",
                ],
              },

              currency: {
                $ifNull: [
                  "$plan.currency",
                  "NGN",
                ],
              },

              revenue: 1,
              payments: 1,
            },
          },

          {
            $sort: {
              revenue: -1,
            },
          },
        ])

      return res.status(200).json({
        success: true,
        data: revenueByPlan,
      })
    } catch (error) {
      console.error(
        "Get revenue by plan error:",
        error,
      )

      return res.status(500).json({
        success: false,
        message:
          "Unable to load revenue by membership plan.",
      })
    }
  }

export const getRevenueSummary =
  async (req, res) => {
    try {
      const [
        members,
        activeMembers,
      ] = await Promise.all([
        User.countDocuments({
          role: "member",
        }),

        User.countDocuments({
          role: "member",
          isActive: true,
        }),
      ])

      return res.status(200).json({
        success: true,
        data: {
          totalMembers: members,
          activeMembers,
        },
      })
    } catch (error) {
      console.error(
        "Get revenue summary error:",
        error,
      )

      return res.status(500).json({
        success: false,
        message:
          "Unable to load revenue summary.",
      })
    }
  }