import Gym from "../models/Gym.js"
import User from "../models/User.js"
import SaasPlan from "../models/SaasPlan.js"
import GymSubscription from "../models/GymSubscription.js"
import PlatformTransaction from "../models/PlatformTransaction.js"
import PlatformSetting from "../models/PlatformSetting.js"


/*
|--------------------------------------------------------------------------
| Subscription validity
|--------------------------------------------------------------------------
*/

const isSubscriptionCurrentlyValid = (
  subscription,
) => {
  if (!subscription) {
    return false
  }

  const now = new Date()

  const status =
    String(
      subscription.status || "",
    ).toLowerCase()

  if (status === "trial") {
    return Boolean(
      subscription.trialEndsAt &&
        new Date(
          subscription.trialEndsAt,
        ) > now,
    )
  }

  if (status !== "active") {
    return false
  }

  if (
    String(
      subscription.paymentStatus || "",
    ).toLowerCase() !== "paid"
  ) {
    return false
  }

  if (
    subscription.currentPeriodEnd &&
    new Date(
      subscription.currentPeriodEnd,
    ) <= now
  ) {
    return false
  }

  return true
}


/*
|--------------------------------------------------------------------------
| Synchronize gym and owner access
|--------------------------------------------------------------------------
*/

const syncGymForSubscription =
  async (
    subscription,
  ) => {
    if (!subscription?.gym) {
      return false
    }

    const valid =
      isSubscriptionCurrentlyValid(
        subscription,
      )

    await Gym.findByIdAndUpdate(
      subscription.gym,
      {
        isActive: Boolean(valid),
      },
    )

    if (subscription.owner) {
      await User.findByIdAndUpdate(
        subscription.owner,
        {
          isActive: Boolean(valid),
        },
      )
    }

    return Boolean(valid)
  }


/*
|--------------------------------------------------------------------------
| Synchronize newest remaining subscription
|--------------------------------------------------------------------------
*/

const syncLatestSubscriptionForGym =
  async (
    gymId,
  ) => {
    if (!gymId) {
      return false
    }

    const latest =
      await GymSubscription.findOne({
        gym: gymId,
      }).sort({
        createdAt: -1,
      })

    if (!latest) {
      await Gym.findByIdAndUpdate(
        gymId,
        {
          isActive: false,
        },
      )

      return false
    }

    return syncGymForSubscription(
      latest,
    )
  }


/*
|--------------------------------------------------------------------------
| Platform dashboard
|--------------------------------------------------------------------------
*/

export const getDashboard =
  async (
    req,
    res,
  ) => {
    try {
      const [
        gyms,
        active,
        subs,
        revenue,
      ] =
        await Promise.all([
          Gym.countDocuments(),

          Gym.countDocuments({
            isActive: true,
          }),

          GymSubscription.countDocuments({
            status: {
              $in: [
                "active",
                "trial",
              ],
            },
          }),

          PlatformTransaction.aggregate([
            {
              $match: {
                status: "success",
              },
            },

            {
              $group: {
                _id: null,

                total: {
                  $sum: "$amount",
                },
              },
            },
          ]),
        ])

      return res.json({
        success: true,

        stats: {
          gyms,

          activeGyms:
            active,

          activeSubscriptions:
            subs,

          totalRevenue:
            revenue[0]?.total || 0,
        },
      })
    } catch (error) {
      console.error(
        "Platform Dashboard Error:",
        error,
      )

      return res.status(500).json({
        success: false,

        message:
          error.message ||
          "Unable to load platform dashboard.",
      })
    }
  }


/*
|--------------------------------------------------------------------------
| List gyms
|--------------------------------------------------------------------------
*/

export const listGyms =
  async (
    req,
    res,
  ) => {
    try {
      const gyms =
        await Gym.find()
          .sort({
            createdAt: -1,
          })
          .lean()

      const ids =
        gyms.map(
          (gym) => gym._id,
        )

      const owners =
        await User.find({
          gym: {
            $in: ids,
          },

          role: "admin",
        })
          .select("-password")
          .lean()

      const subs =
        await GymSubscription.find({
          gym: {
            $in: ids,
          },
        })
          .populate(
            "plan",
            "name",
          )
          .sort({
            createdAt: -1,
          })
          .lean()

      const ownerMap =
        new Map(
          owners.map(
            (owner) => [
              String(owner.gym),
              owner,
            ],
          ),
        )

      const subMap =
        new Map()

      for (
        const subscription of subs
      ) {
        const key =
          String(
            subscription.gym,
          )

        if (
          !subMap.has(key)
        ) {
          subMap.set(
            key,
            subscription,
          )
        }
      }

      return res.json({
        success: true,

        gyms: gyms.map(
          (gym) => ({
            ...gym,

            owner:
              ownerMap.get(
                String(
                  gym._id,
                ),
              ) || null,

            subscription:
              subMap.get(
                String(
                  gym._id,
                ),
              ) || null,
          }),
        ),
      })
    } catch (error) {
      console.error(
        "List Gyms Error:",
        error,
      )

      return res.status(500).json({
        success: false,

        message:
          error.message ||
          "Unable to load gyms.",
      })
    }
  }


/*
|--------------------------------------------------------------------------
| Update gym
|--------------------------------------------------------------------------
*/

export const updateGym =
  async (
    req,
    res,
  ) => {
    try {
      const allowed = [
        "name",
        "email",
        "phone",
        "address",
        "city",
        "state",
        "country",
        "logoUrl",
        "socialMedia",
        "branding",
        "settings",
        "isActive",
      ]

      const patch = {}

      for (
        const key of allowed
      ) {
        if (
          req.body[key] !==
          undefined
        ) {
          patch[key] =
            req.body[key]
        }
      }

      const gym =
        await Gym.findByIdAndUpdate(
          req.params.id,
          {
            $set: patch,
          },
          {
            new: true,
            runValidators: true,
          },
        )

      if (!gym) {
        return res.status(404).json({
          success: false,
          message: "Gym not found.",
        })
      }

      return res.json({
        success: true,
        gym,
      })
    } catch (error) {
      console.error(
        "Update Gym Error:",
        error,
      )

      return res.status(500).json({
        success: false,

        message:
          error.message ||
          "Unable to update gym.",
      })
    }
  }


/*
|--------------------------------------------------------------------------
| Delete gym
|--------------------------------------------------------------------------
|
| Permanently removes the gym tenant and its gym users/subscriptions.
|
| Platform financial transactions are intentionally NOT deleted so that
| payment and billing history remains available for audit purposes.
|
|--------------------------------------------------------------------------
*/

export const deleteGym =
  async (
    req,
    res,
  ) => {
    try {
      const id =
        String(
          req.params.id || "",
        ).trim()

      if (!id) {
        return res.status(400).json({
          success: false,
          message:
            "Gym ID is required.",
        })
      }

      const gym =
        await Gym.findById(id)

      if (!gym) {
        return res.status(404).json({
          success: false,
          message:
            "Gym not found.",
        })
      }

      /*
      |--------------------------------------------------------------------------
      | Delete all users belonging to this gym
      |--------------------------------------------------------------------------
      */

      const usersResult =
        await User.deleteMany({
          gym: gym._id,
        })

      /*
      |--------------------------------------------------------------------------
      | Delete all SaaS subscriptions belonging to this gym
      |--------------------------------------------------------------------------
      */

      const subscriptionsResult =
        await GymSubscription.deleteMany({
          gym: gym._id,
        })

      /*
      |--------------------------------------------------------------------------
      | Keep PlatformTransaction records.
      |
      | They are financial/audit records and should not be destroyed when
      | a tenant is deleted.
      |--------------------------------------------------------------------------
      */

      await Gym.findByIdAndDelete(
        gym._id,
      )

      console.log(
        "Gym deleted successfully:",
        {
          gymId: String(gym._id),
          gymName: gym.name,
          usersDeleted:
            usersResult.deletedCount || 0,
          subscriptionsDeleted:
            subscriptionsResult.deletedCount || 0,
        },
      )

      return res.json({
        success: true,

        message:
          "Gym deleted successfully.",

        gymId:
          gym._id,

        usersDeleted:
          usersResult.deletedCount || 0,

        subscriptionsDeleted:
          subscriptionsResult.deletedCount || 0,
      })
    } catch (error) {
      console.error(
        "Delete Gym Error:",
        error,
      )

      return res.status(500).json({
        success: false,

        message:
          error.message ||
          "Unable to delete gym.",
      })
    }
  }


/*
|--------------------------------------------------------------------------
| SaaS plans
|--------------------------------------------------------------------------
*/

export const listPlans =
  async (
    req,
    res,
  ) => {
    try {
      return res.json({
        success: true,

        plans:
          await SaasPlan.find()
            .sort({
              displayOrder: 1,
              createdAt: -1,
            }),
      })
    } catch (error) {
      console.error(
        "List Plans Error:",
        error,
      )

      return res.status(500).json({
        success: false,

        message:
          error.message ||
          "Unable to load plans.",
      })
    }
  }


/*
|--------------------------------------------------------------------------
| Create SaaS plan
|--------------------------------------------------------------------------
*/

export const createPlan =
  async (
    req,
    res,
  ) => {
    try {
      const body = {
        ...req.body,
      }

      body.price =
        Number(
          body.price || 0,
        )

      body.trialDays =
        Number(
          body.trialDays || 0,
        )

      body.maxMembers =
        body.maxMembers === "" ||
        body.maxMembers == null
          ? null
          : Number(
              body.maxMembers,
            )

      body.maxTrainers =
        body.maxTrainers === "" ||
        body.maxTrainers == null
          ? null
          : Number(
              body.maxTrainers,
            )

      const plan =
        await SaasPlan.create(
          body,
        )

      return res.status(201).json({
        success: true,
        plan,
      })
    } catch (error) {
      console.error(
        "Create Plan Error:",
        error,
      )

      return res.status(500).json({
        success: false,

        message:
          error.message ||
          "Unable to create plan.",
      })
    }
  }


/*
|--------------------------------------------------------------------------
| Update SaaS plan
|--------------------------------------------------------------------------
*/

export const updatePlan =
  async (
    req,
    res,
  ) => {
    try {
      const body = {
        ...req.body,
      }

      if (
        body.price !==
        undefined
      ) {
        body.price =
          Number(
            body.price,
          )
      }

      if (
        body.trialDays !==
        undefined
      ) {
        body.trialDays =
          Number(
            body.trialDays,
          )
      }

      if (
        body.maxMembers === ""
      ) {
        body.maxMembers = null
      }

      if (
        body.maxTrainers === ""
      ) {
        body.maxTrainers = null
      }

      const plan =
        await SaasPlan.findByIdAndUpdate(
          req.params.id,
          {
            $set: body,
          },
          {
            new: true,
            runValidators: true,
          },
        )

      if (!plan) {
        return res.status(404).json({
          success: false,
          message: "Plan not found.",
        })
      }

      return res.json({
        success: true,
        plan,
      })
    } catch (error) {
      console.error(
        "Update Plan Error:",
        error,
      )

      return res.status(500).json({
        success: false,

        message:
          error.message ||
          "Unable to update plan.",
      })
    }
  }


/*
|--------------------------------------------------------------------------
| Delete/deactivate SaaS plan
|--------------------------------------------------------------------------
*/

export const deletePlan =
  async (
    req,
    res,
  ) => {
    try {
      const plan =
        await SaasPlan.findByIdAndUpdate(
          req.params.id,
          {
            active: false,
          },
          {
            new: true,
          },
        )

      if (!plan) {
        return res.status(404).json({
          success: false,
          message: "Plan not found.",
        })
      }

      return res.json({
        success: true,
        plan,
      })
    } catch (error) {
      console.error(
        "Delete Plan Error:",
        error,
      )

      return res.status(500).json({
        success: false,

        message:
          error.message ||
          "Unable to deactivate plan.",
      })
    }
  }


/*
|--------------------------------------------------------------------------
| List platform subscriptions
|--------------------------------------------------------------------------
*/

export const listSubscriptions =
  async (
    req,
    res,
  ) => {
    try {
      const subscriptions =
        await GymSubscription.find()
          .populate(
            "gym",
            "name slug isActive",
          )
          .populate(
            "plan",
            "name",
          )
          .sort({
            createdAt: -1,
          })

      const latestByGym =
        new Map()

      for (
        const subscription of
          subscriptions
      ) {
        const gymId =
          String(
            subscription.gym?._id ||
              subscription.gym ||
              "",
          )

        if (
          gymId &&
          !latestByGym.has(
            gymId,
          )
        ) {
          latestByGym.set(
            gymId,
            subscription,
          )
        }
      }

      for (
        const subscription of
          latestByGym.values()
      ) {
        await syncGymForSubscription(
          subscription,
        )
      }

      return res.json({
        success: true,
        subscriptions,
      })
    } catch (error) {
      console.error(
        "List Subscriptions Error:",
        error,
      )

      return res.status(500).json({
        success: false,

        message:
          error.message ||
          "Unable to load subscriptions.",
      })
    }
  }


/*
|--------------------------------------------------------------------------
| Update subscription
|--------------------------------------------------------------------------
*/

export const updateSubscription =
  async (
    req,
    res,
  ) => {
    try {
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

      for (
        const key of allowed
      ) {
        if (
          req.body[key] !==
          undefined
        ) {
          patch[key] =
            req.body[key]
        }
      }

      const existing =
        await GymSubscription.findById(
          req.params.id,
        )

      if (!existing) {
        return res.status(404).json({
          success: false,
          message:
            "Subscription not found.",
        })
      }

      if (
        patch.status ===
          "active" &&
        patch.paymentStatus ===
          undefined &&
        existing.paymentStatus !==
          "paid"
      ) {
        return res.status(400).json({
          success: false,

          message:
            "A subscription cannot be activated until its payment status is paid.",
        })
      }

      if (
        patch.status ===
        "active"
      ) {
        const paymentStatus =
          patch.paymentStatus ??
          existing.paymentStatus

        const periodEnd =
          patch.currentPeriodEnd ??
          existing.currentPeriodEnd

        if (
          paymentStatus !==
          "paid"
        ) {
          return res.status(400).json({
            success: false,

            message:
              "An active subscription must have a paid payment status.",
          })
        }

        if (
          periodEnd &&
          new Date(
            periodEnd,
          ) <= new Date()
        ) {
          return res.status(400).json({
            success: false,

            message:
              "The subscription period has already ended. Renew the subscription instead.",
          })
        }
      }

      if (
        patch.status ===
        "cancelled"
      ) {
        patch.cancelledAt =
          new Date()
      }

      if (
        patch.status ===
        "active"
      ) {
        patch.cancelledAt = null
        patch.suspendedAt = null
      }

      const subscription =
        await GymSubscription.findByIdAndUpdate(
          req.params.id,
          {
            $set: patch,
          },
          {
            new: true,
            runValidators: true,
          },
        )

      if (!subscription) {
        return res.status(404).json({
          success: false,
          message:
            "Subscription not found.",
        })
      }

      await syncGymForSubscription(
        subscription,
      )

      return res.json({
        success: true,
        subscription,
      })
    } catch (error) {
      console.error(
        "Update Subscription Error:",
        error,
      )

      return res.status(500).json({
        success: false,

        message:
          error.message ||
          "Unable to update subscription.",
      })
    }
  }


/*
|--------------------------------------------------------------------------
| Delete subscription
|--------------------------------------------------------------------------
*/

export const deleteSubscription =
  async (
    req,
    res,
  ) => {
    try {
      const id =
        String(
          req.params.id || "",
        ).trim()

      console.log(
        "DELETE /api/platform/subscriptions/:id",
        id,
      )

      if (!id) {
        return res.status(400).json({
          success: false,
          message:
            "Subscription ID is required.",
        })
      }

      const subscription =
        await GymSubscription.findById(
          id,
        )

      if (!subscription) {
        return res.status(404).json({
          success: false,
          message:
            "Subscription not found.",
        })
      }

      const status =
        String(
          subscription.status || "",
        ).toLowerCase()

      const paymentStatus =
        String(
          subscription.paymentStatus || "",
        ).toLowerCase()

      console.log(
        "Subscription delete check:",
        {
          id,
          status,
          paymentStatus,
        },
      )

      /*
      |--------------------------------------------------------------------------
      | Never delete paid subscriptions
      |--------------------------------------------------------------------------
      */

      if (
        paymentStatus ===
        "paid"
      ) {
        return res.status(400).json({
          success: false,

          message:
            "A paid subscription cannot be permanently deleted because it must remain available for billing and audit history.",
        })
      }

      /*
      |--------------------------------------------------------------------------
      | Delete pending unpaid records.
      |--------------------------------------------------------------------------
      */

      const deletableStatuses = [
        "pending",
        "cancelled",
      ]

      if (
        paymentStatus !==
          "pending" ||
        !deletableStatuses.includes(
          status,
        )
      ) {
        return res.status(400).json({
          success: false,

          message:
            "Only pending unpaid subscriptions can be deleted.",
        })
      }

      const gymId =
        subscription.gym

      await GymSubscription.findByIdAndDelete(
        subscription._id,
      )

      await syncLatestSubscriptionForGym(
        gymId,
      )

      console.log(
        "Subscription deleted successfully:",
        String(
          subscription._id,
        ),
      )

      return res.json({
        success: true,

        message:
          "Subscription deleted successfully.",

        subscriptionId:
          subscription._id,
      })
    } catch (error) {
      console.error(
        "Delete Subscription Error:",
        error,
      )

      return res.status(500).json({
        success: false,

        message:
          error.message ||
          "Unable to delete subscription.",
      })
    }
  }


/*
|--------------------------------------------------------------------------
| Cancel subscription
|--------------------------------------------------------------------------
*/

export const cancelSubscription =
  async (
    req,
    res,
  ) => {
    try {
      const subscription =
        await GymSubscription.findById(
          req.params.id,
        )

      if (!subscription) {
        return res.status(404).json({
          success: false,
          message:
            "Subscription not found.",
        })
      }

      if (
        subscription.status ===
        "cancelled"
      ) {
        return res.json({
          success: true,

          subscription,

          message:
            "Subscription is already cancelled.",
        })
      }

      const now =
        new Date()

      subscription.status =
        "cancelled"

      subscription.cancelledAt =
        now

      subscription.suspendedAt =
        null

      await subscription.save()

      const newerSubscription =
        await GymSubscription.findOne({
          gym:
            subscription.gym,

          _id: {
            $ne:
              subscription._id,
          },

          createdAt: {
            $gt:
              subscription.createdAt,
          },
        }).sort({
          createdAt: -1,
        })

      if (
        !newerSubscription
      ) {
        await Gym.findByIdAndUpdate(
          subscription.gym,
          {
            isActive: false,
          },
        )

        if (
          subscription.owner
        ) {
          await User.findByIdAndUpdate(
            subscription.owner,
            {
              isActive: false,
            },
          )
        }
      } else {
        await syncGymForSubscription(
          newerSubscription,
        )
      }

      return res.json({
        success: true,
        subscription,
      })
    } catch (error) {
      console.error(
        "Cancel Subscription Error:",
        error,
      )

      return res.status(500).json({
        success: false,

        message:
          error.message ||
          "Unable to cancel subscription.",
      })
    }
  }


/*
|--------------------------------------------------------------------------
| Reactivate subscription
|--------------------------------------------------------------------------
*/

export const reactivateSubscription =
  async (
    req,
    res,
  ) => {
    try {
      const subscription =
        await GymSubscription.findById(
          req.params.id,
        )

      if (!subscription) {
        return res.status(404).json({
          success: false,
          message:
            "Subscription not found.",
        })
      }

      const now =
        new Date()

      const paymentStatus =
        String(
          subscription.paymentStatus || "",
        ).toLowerCase()

      const periodEnd =
        subscription.currentPeriodEnd
          ? new Date(
              subscription.currentPeriodEnd,
            )
          : null

      if (
        paymentStatus !==
        "paid"
      ) {
        return res.status(400).json({
          success: false,

          message:
            "This subscription cannot be reactivated because payment has not been completed. Renew the subscription instead.",
        })
      }

      if (
        periodEnd &&
        periodEnd <= now
      ) {
        return res.status(400).json({
          success: false,

          message:
            "This subscription has expired. Renew the subscription instead.",
        })
      }

      await GymSubscription.updateMany(
        {
          gym:
            subscription.gym,

          _id: {
            $ne:
              subscription._id,
          },

          status: {
            $in: [
              "active",
              "trial",
            ],
          },
        },
        {
          $set: {
            status:
              "cancelled",

            cancelledAt:
              now,
          },
        },
      )

      subscription.status =
        "active"

      subscription.cancelledAt =
        null

      subscription.suspendedAt =
        null

      await subscription.save()

      await Gym.findByIdAndUpdate(
        subscription.gym,
        {
          isActive: true,
        },
      )

      if (
        subscription.owner
      ) {
        await User.findByIdAndUpdate(
          subscription.owner,
          {
            isActive: true,
          },
        )
      }

      return res.json({
        success: true,

        message:
          "Subscription reactivated successfully.",

        subscription,
      })
    } catch (error) {
      console.error(
        "Reactivate Subscription Error:",
        error,
      )

      return res.status(500).json({
        success: false,

        message:
          error.message ||
          "Unable to reactivate subscription.",
      })
    }
  }


/*
|--------------------------------------------------------------------------
| Platform revenue
|--------------------------------------------------------------------------
*/

export const platformRevenue =
  async (
    req,
    res,
  ) => {
    try {
      const monthStart =
        new Date(
          new Date().getFullYear(),
          new Date().getMonth(),
          1,
        )

      const [
        agg,
        monthly,
        byPlan,
        transactions,
      ] =
        await Promise.all([
          PlatformTransaction.aggregate([
            {
              $match: {
                status:
                  "success",
              },
            },

            {
              $group: {
                _id: null,

                total: {
                  $sum: "$amount",
                },

                count: {
                  $sum: 1,
                },
              },
            },
          ]),

          PlatformTransaction.aggregate([
            {
              $match: {
                status:
                  "success",

                createdAt: {
                  $gte:
                    monthStart,
                },
              },
            },

            {
              $group: {
                _id: null,

                total: {
                  $sum: "$amount",
                },
              },
            },
          ]),

          PlatformTransaction.aggregate([
            {
              $match: {
                status:
                  "success",
              },
            },

            {
              $group: {
                _id: "$plan",

                total: {
                  $sum: "$amount",
                },

                count: {
                  $sum: 1,
                },
              },
            },

            {
              $lookup: {
                from:
                  "saasplans",

                localField:
                  "_id",

                foreignField:
                  "_id",

                as: "plan",
              },
            },

            {
              $project: {
                total: 1,

                count: 1,

                plan: {
                  $arrayElemAt: [
                    "$plan.name",
                    0,
                  ],
                },
              },
            },
          ]),

          PlatformTransaction.find()
            .populate(
              "gym",
              "name",
            )
            .populate(
              "plan",
              "name",
            )
            .sort({
              createdAt: -1,
            })
            .limit(200)
            .lean(),
        ])

      return res.json({
        success: true,

        summary: {
          total:
            agg[0]?.total ||
            0,

          count:
            agg[0]?.count ||
            0,

          monthly:
            monthly[0]?.total ||
            0,

          byPlan,
        },

        transactions,
      })
    } catch (error) {
      console.error(
        "Platform Revenue Error:",
        error,
      )

      return res.status(500).json({
        success: false,

        message:
          error.message ||
          "Unable to load platform revenue.",
      })
    }
  }


/*
|--------------------------------------------------------------------------
| Platform settings
|--------------------------------------------------------------------------
*/

export const settings =
  async (
    req,
    res,
  ) => {
    try {
      const rows =
        await PlatformSetting.find()
          .lean()

      const values =
        Object.fromEntries(
          rows.map(
            (row) => [
              row.key,
              row.value,
            ],
          ),
        )

      return res.json({
        success: true,

        settings: {
          platformName:
            values.platformName ||
            process.env.PLATFORM_NAME ||
            "GB",

          supportEmail:
            values.supportEmail ||
            process.env.SUPPORT_EMAIL ||
            "",

          currency:
            values.currency ||
            process.env.DEFAULT_CURRENCY ||
            "NGN",
        },
      })
    } catch (error) {
      console.error(
        "Platform Settings Error:",
        error,
      )

      return res.status(500).json({
        success: false,

        message:
          error.message ||
          "Unable to load platform settings.",
      })
    }
  }


/*
|--------------------------------------------------------------------------
| Update platform settings
|--------------------------------------------------------------------------
*/

export const updateSettings =
  async (
    req,
    res,
  ) => {
    try {
      const entries =
        Object.entries(
          req.body || {},
        )

      for (
        const [
          key,
          value,
        ] of entries
      ) {
        await PlatformSetting.findOneAndUpdate(
          {
            key,
          },
          {
            value,
          },
          {
            upsert: true,
            new: true,
            setDefaultsOnInsert: true,
          },
        )
      }

      return res.json({
        success: true,

        settings:
          req.body || {},
      })
    } catch (error) {
      console.error(
        "Update Platform Settings Error:",
        error,
      )

      return res.status(500).json({
        success: false,

        message:
          error.message ||
          "Unable to update platform settings.",
      })
    }
  }