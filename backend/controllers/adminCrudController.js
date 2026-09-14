import User from "../models/User.js"
import Gym from "../models/Gym.js"
import GymSubscription from "../models/GymSubscription.js"
import PlatformTransaction from "../models/PlatformTransaction.js"

/*
|--------------------------------------------------------------------------
| Safe User Response
|--------------------------------------------------------------------------
*/

const safe = (u) => {
  const v = u.toObject()

  delete v.password

  return v
}

/*
|--------------------------------------------------------------------------
| Normalize Phone
|--------------------------------------------------------------------------
*/

const normalizePhone = (value) => {
  const raw = String(value || "")
    .trim()
    .replace(/[\s().-]/g, "")

  if (!raw) {
    return ""
  }

  if (raw.startsWith("+")) {
    return raw
  }

  if (
    raw.startsWith("0") &&
    raw.length >= 10
  ) {
    return `+234${raw.slice(1)}`
  }

  return raw
}

/*
|--------------------------------------------------------------------------
| Get Valid Gym Subscription
|--------------------------------------------------------------------------
|
| This follows the same subscription validity rules used by the main
| authentication flow.
|
| Active subscription:
|   - status = active
|   - paymentStatus = paid
|   - currentPeriodEnd is still in the future
|
| Trial subscription:
|   - status = trial
|   - trialEndsAt is still in the future
|
|--------------------------------------------------------------------------
*/

const getValidGymSubscription =
  async (gymId) => {
    const now = new Date()

    const subscription =
      await GymSubscription.findOne({
        gym: gymId,

        status: {
          $in: [
            "active",
            "trial",
          ],
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

    if (subscription) {
      return subscription
    }

    /*
    |--------------------------------------------------------------------------
    | Self-heal from verified successful platform transaction
    |--------------------------------------------------------------------------
    |
    | This keeps this controller consistent with the authentication flow.
    |
    |--------------------------------------------------------------------------
    */

    const tx =
      await PlatformTransaction.findOne({
        gym: gymId,

        status: "success",
      }).sort({
        paidAt: -1,
        createdAt: -1,
      })

    if (!tx?.subscription) {
      return null
    }

    const sub =
      await GymSubscription.findById(
        tx.subscription,
      )

    if (!sub) {
      return null
    }

    const periodEnd =
      sub.currentPeriodEnd &&
      new Date(
        sub.currentPeriodEnd,
      ) > now
        ? new Date(
            sub.currentPeriodEnd,
          )
        : new Date(
            now.getTime() +
              (sub.billingCycle ===
              "yearly"
                ? 365
                : 30) *
                24 *
                60 *
                60 *
                1000,
          )

    await GymSubscription.findByIdAndUpdate(
      sub._id,
      {
        status: "active",

        paymentStatus: "paid",

        startDate:
          sub.startDate || now,

        currentPeriodStart:
          sub.currentPeriodStart ||
          now,

        currentPeriodEnd:
          periodEnd,

        nextBillingDate:
          periodEnd,

        transactionReference:
          sub.transactionReference ||
          tx.reference,
      },
    )

    await Gym.findByIdAndUpdate(
      gymId,
      {
        isActive: true,
      },
    )

    return GymSubscription.findById(
      sub._id,
    ).populate("plan")
  }

/*
|--------------------------------------------------------------------------
| Enforce SaaS Plan Limit
|--------------------------------------------------------------------------
|
| type:
|   maxMembers
|   maxTrainers
|
| Only ACTIVE users consume seats.
|
| null / undefined = unlimited.
|
|--------------------------------------------------------------------------
*/

const enforcePlanLimit =
  async (
    gymId,
    type,
  ) => {
    if (!gymId) {
      return {
        code:
          "GYM_REQUIRED",

        message:
          "Your administrator account is not associated with a gym.",
      }
    }

    const subscription =
      await getValidGymSubscription(
        gymId,
      )

    if (!subscription) {
      return {
        code:
          "GYM_SUBSCRIPTION_REQUIRED",

        message:
          "This gym's subscription is not active. Complete or renew the gym subscription before adding users.",
      }
    }

    const limit =
      subscription.plan?.[
        type
      ]

    /*
    |--------------------------------------------------------------------------
    | Unlimited plan
    |--------------------------------------------------------------------------
    */

    if (
      limit === null ||
      limit === undefined
    ) {
      return null
    }

    const role =
      type === "maxMembers"
        ? "member"
        : "trainer"

    /*
    |--------------------------------------------------------------------------
    | Count ACTIVE users only.
    |--------------------------------------------------------------------------
    */

    const activeCount =
      await User.countDocuments({
        gym: gymId,

        role,

        isActive: true,
      })

    if (
      activeCount >=
      Number(limit)
    ) {
      return {
        code:
          role === "member"
            ? "SAAS_MEMBER_LIMIT_REACHED"
            : "SAAS_TRAINER_LIMIT_REACHED",

        message:
          `Your ${subscription.plan.name} plan has reached its ${role} limit (${limit}). Please upgrade your plan to add more ${role}s.`,
      }
    }

    return null
  }

/*
|--------------------------------------------------------------------------
| Create Member
|--------------------------------------------------------------------------
*/

export const createMember =
  async (
    req,
    res,
  ) => {
    try {
      const {
        firstName,
        lastName,
        email,
        password,
        phone,
      } = req.body

      if (
        !firstName ||
        !lastName ||
        !email ||
        !password
      ) {
        return res.status(400).json({
          success: false,

          message:
            "First name, last name, email and password are required.",
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
      | Enforce maxMembers before creating the member.
      |--------------------------------------------------------------------------
      */

      const limitError =
        await enforcePlanLimit(
          req.user.gym,
          "maxMembers",
        )

      if (limitError) {
        return res.status(403).json({
          success: false,

          code:
            limitError.code,

          message:
            limitError.message,
        })
      }

      const normalizedEmail =
        String(email)
          .trim()
          .toLowerCase()

      /*
      |--------------------------------------------------------------------------
      | Tenant-specific email uniqueness
      |--------------------------------------------------------------------------
      */

      if (
        await User.findOne({
          gym: req.user.gym,

          email:
            normalizedEmail,
        })
      ) {
        return res.status(409).json({
          success: false,

          message:
            "An account with this email already exists at this gym.",
        })
      }

      /*
      |--------------------------------------------------------------------------
      | Create active member
      |--------------------------------------------------------------------------
      */

      const user =
        await User.create({
          firstName:
            firstName.trim(),

          lastName:
            lastName.trim(),

          email:
            normalizedEmail,

          phone:
            normalizePhone(
              phone,
            ),

          password,

          role: "member",

          gym:
            req.user.gym,

          isActive: true,

          emailVerified: true,
        })

      return res.status(201).json({
        success: true,

        member:
          safe(user),
      })
    } catch (e) {
      console.error(
        "Create member error:",
        e,
      )

      if (
        e?.code === 11000
      ) {
        return res.status(409).json({
          success: false,

          message:
            "An account with this email already exists at this gym.",
        })
      }

      return res.status(500).json({
        success: false,

        message:
          e.message ||
          "Unable to create member.",
      })
    }
  }

/*
|--------------------------------------------------------------------------
| Update Member
|--------------------------------------------------------------------------
*/

export const updateMember =
  async (
    req,
    res,
  ) => {
    try {
      if (!req.user?.gym) {
        return res.status(400).json({
          success: false,

          message:
            "Your administrator account is not associated with a gym.",
        })
      }

      /*
      |--------------------------------------------------------------------------
      | IMPORTANT:
      | The member must belong to the administrator's gym.
      |--------------------------------------------------------------------------
      */

      const u =
        await User.findOne({
          _id:
            req.params.memberId,

          gym:
            req.user.gym,

          role: "member",
        })

      if (!u) {
        return res.status(404).json({
          success: false,

          message:
            "Member not found.",
        })
      }

      for (
        const k of [
          "firstName",
          "lastName",
          "email",
          "phone",
          "dateOfBirth",
          "gender",
          "fitnessGoal",
          "address",
          "age",
          "height",
          "weight",
        ]
      ) {
        if (
          req.body[k] !==
          undefined
        ) {
          u[k] =
            req.body[k]
        }
      }

      /*
      |--------------------------------------------------------------------------
      | Normalize email when it is changed
      |--------------------------------------------------------------------------
      */

      if (
        req.body.email !==
        undefined
      ) {
        const normalizedEmail =
          String(
            req.body.email,
          )
            .trim()
            .toLowerCase()

        const duplicate =
          await User.findOne({
            gym:
              req.user.gym,

            email:
              normalizedEmail,

            _id: {
              $ne: u._id,
            },
          })

        if (duplicate) {
          return res.status(409).json({
            success: false,

            message:
              "An account with this email already exists at this gym.",
          })
        }

        u.email =
          normalizedEmail
      }

      /*
      |--------------------------------------------------------------------------
      | Normalize phone when it is changed
      |--------------------------------------------------------------------------
      */

      if (
        req.body.phone !==
        undefined
      ) {
        u.phone =
          normalizePhone(
            req.body.phone,
          )
      }

      if (
        req.body.password
      ) {
        u.password =
          req.body.password
      }

      await u.save()

      return res.json({
        success: true,

        member:
          safe(u),
      })
    } catch (e) {
      console.error(
        "Update member error:",
        e,
      )

      if (
        e?.code === 11000
      ) {
        return res.status(409).json({
          success: false,

          message:
            "An account with this email already exists at this gym.",
        })
      }

      return res.status(500).json({
        success: false,

        message:
          e.message ||
          "Unable to update member.",
      })
    }
  }

/*
|--------------------------------------------------------------------------
| Update Trainer
|--------------------------------------------------------------------------
*/

export const updateTrainer =
  async (
    req,
    res,
  ) => {
    try {
      if (!req.user?.gym) {
        return res.status(400).json({
          success: false,

          message:
            "Your administrator account is not associated with a gym.",
        })
      }

      /*
      |--------------------------------------------------------------------------
      | IMPORTANT:
      | The trainer must belong to the administrator's gym.
      |--------------------------------------------------------------------------
      */

      const u =
        await User.findOne({
          _id:
            req.params.trainerId,

          gym:
            req.user.gym,

          role: "trainer",
        })

      if (!u) {
        return res.status(404).json({
          success: false,

          message:
            "Trainer not found.",
        })
      }

      for (
        const k of [
          "firstName",
          "lastName",
          "email",
          "phone",
          "age",
          "dateOfBirth",
          "address",
        ]
      ) {
        if (
          req.body[k] !==
          undefined
        ) {
          u[k] =
            req.body[k]
        }
      }

      /*
      |--------------------------------------------------------------------------
      | Normalize email when it is changed
      |--------------------------------------------------------------------------
      */

      if (
        req.body.email !==
        undefined
      ) {
        const normalizedEmail =
          String(
            req.body.email,
          )
            .trim()
            .toLowerCase()

        const duplicate =
          await User.findOne({
            gym:
              req.user.gym,

            email:
              normalizedEmail,

            _id: {
              $ne: u._id,
            },
          })

        if (duplicate) {
          return res.status(409).json({
            success: false,

            message:
              "An account with this email already exists at this gym.",
          })
        }

        u.email =
          normalizedEmail
      }

      /*
      |--------------------------------------------------------------------------
      | Normalize phone when it is changed
      |--------------------------------------------------------------------------
      */

      if (
        req.body.phone !==
        undefined
      ) {
        u.phone =
          normalizePhone(
            req.body.phone,
          )
      }

      await u.save()

      return res.json({
        success: true,

        trainer:
          safe(u),
      })
    } catch (e) {
      console.error(
        "Update trainer error:",
        e,
      )

      if (
        e?.code === 11000
      ) {
        return res.status(409).json({
          success: false,

          message:
            "An account with this email already exists at this gym.",
        })
      }

      return res.status(500).json({
        success: false,

        message:
          e.message ||
          "Unable to update trainer.",
      })
    }
  }