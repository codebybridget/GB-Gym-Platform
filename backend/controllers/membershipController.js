import MembershipPlan from "../models/MembershipPlan.js"

/*
|--------------------------------------------------------------------------
| Get Active Membership Plans
|--------------------------------------------------------------------------
*/

export const getMembershipPlans =
  async (req, res) => {
    try {
      const plans =
        await MembershipPlan.find({
          isActive: true,
        })
          .sort({
            displayOrder: 1,
            price: 1,
          })
          .lean()

      return res.status(200).json({
        success: true,
        plans,
      })
    } catch (error) {
      console.error(
        "Get membership plans error:",
        error,
      )

      return res.status(500).json({
        success: false,
        message:
          "Unable to load membership plans.",
      })
    }
  }


/*
|--------------------------------------------------------------------------
| Get All Membership Plans
|--------------------------------------------------------------------------
|
| Admin only.
|--------------------------------------------------------------------------
*/

export const getAllMembershipPlans =
  async (req, res) => {
    try {
      const plans =
        await MembershipPlan.find()
          .sort({
            displayOrder: 1,
            createdAt: -1,
          })
          .lean()

      return res.status(200).json({
        success: true,
        plans,
      })
    } catch (error) {
      console.error(
        "Get all membership plans error:",
        error,
      )

      return res.status(500).json({
        success: false,
        message:
          "Unable to load membership plans.",
      })
    }
  }


/*
|--------------------------------------------------------------------------
| Create Membership Plan
|--------------------------------------------------------------------------
|
| Admin only.
|--------------------------------------------------------------------------
*/

export const createMembershipPlan =
  async (req, res) => {
    try {
      const {
        name,
        description,
        durationDays,
        price,
        currency,
        features,
        displayOrder,
      } = req.body

      /*
      |--------------------------------------------------------------------------
      | Get Gym Context
      |--------------------------------------------------------------------------
      */

      const gymId = req.user?.gym

      if (!gymId) {
        return res.status(400).json({
          success: false,
          message:
            "Gym context is required.",
        })
      }

      /*
      |--------------------------------------------------------------------------
      | Validate Required Fields
      |--------------------------------------------------------------------------
      */

      if (
        !name?.trim() ||
        !durationDays ||
        price === undefined
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Name, duration and price are required.",
        })
      }

      /*
      |--------------------------------------------------------------------------
      | Prevent Duplicate Plan Names
      |--------------------------------------------------------------------------
      */

      const existingPlan =
        await MembershipPlan.findOne({
          name: name.trim(),
          gym: gymId,
        })

      if (existingPlan) {
        return res.status(409).json({
          success: false,
          message:
            "A membership plan with this name already exists.",
        })
      }

      /*
      |--------------------------------------------------------------------------
      | Create Membership Plan
      |--------------------------------------------------------------------------
      */

      const plan =
        await MembershipPlan.create({
          gym: gymId,

          name: name.trim(),

          description:
            description?.trim() || "",

          durationDays:
            Number(durationDays),

          price:
            Number(price),

          currency:
            currency?.trim()?.toUpperCase() ||
            "NGN",

          features:
            Array.isArray(features)
              ? features
              : [],

          displayOrder:
            Number(displayOrder) || 0,

          isActive: true,
        })

      /*
      |--------------------------------------------------------------------------
      | Success Response
      |--------------------------------------------------------------------------
      */

      return res.status(201).json({
        success: true,
        message:
          "Membership plan created successfully.",
        plan,
      })
    } catch (error) {
      console.error(
        "Create membership plan error:",
        error,
      )

      return res.status(500).json({
        success: false,
        message:
          error?.message ||
          "Unable to create membership plan.",
      })
    }
  }


/*
|--------------------------------------------------------------------------
| Update Membership Plan
|--------------------------------------------------------------------------
|
| Admin only.
|--------------------------------------------------------------------------
*/

export const updateMembershipPlan =
  async (req, res) => {
    try {
      const {
        id,
      } = req.params

      const {
        name,
        description,
        durationDays,
        price,
        currency,
        features,
        displayOrder,
        isActive,
      } = req.body

      const plan =
        await MembershipPlan.findById(
          id,
        )

      if (!plan) {
        return res.status(404).json({
          success: false,
          message:
            "Membership plan not found.",
        })
      }

      if (name !== undefined) {
        plan.name =
          name.trim()
      }

      if (
        description !==
        undefined
      ) {
        plan.description =
          description.trim()
      }

      if (
        durationDays !==
        undefined
      ) {
        plan.durationDays =
          Number(durationDays)
      }

      if (
        price !==
        undefined
      ) {
        plan.price =
          Number(price)
      }

      if (
        currency !==
        undefined
      ) {
        plan.currency =
          currency
            .trim()
            .toUpperCase()
      }

      if (
        features !==
        undefined
      ) {
        plan.features =
          Array.isArray(features)
            ? features
            : []
      }

      if (
        displayOrder !==
        undefined
      ) {
        plan.displayOrder =
          Number(displayOrder) || 0
      }

      if (
        isActive !==
        undefined
      ) {
        plan.isActive =
          Boolean(isActive)
      }

      await plan.save()

      return res.status(200).json({
        success: true,
        message:
          "Membership plan updated successfully.",
        plan,
      })
    } catch (error) {
      console.error(
        "Update membership plan error:",
        error,
      )

      return res.status(500).json({
        success: false,
        message:
          error?.message ||
          "Unable to update membership plan.",
      })
    }
  }


/*
|--------------------------------------------------------------------------
| Delete Membership Plan
|--------------------------------------------------------------------------
|
| Admin only.
|
| We deactivate the plan instead of permanently deleting it.
| This preserves historical subscription/payment records.
|--------------------------------------------------------------------------
*/

export const deleteMembershipPlan =
  async (req, res) => {
    try {
      const {
        id,
      } = req.params

      const plan =
        await MembershipPlan.findById(
          id,
        )

      if (!plan) {
        return res.status(404).json({
          success: false,
          message:
            "Membership plan not found.",
        })
      }

      plan.isActive = false

      await plan.save()

      return res.status(200).json({
        success: true,
        message:
          "Membership plan deactivated successfully.",
      })
    } catch (error) {
      console.error(
        "Delete membership plan error:",
        error,
      )

      return res.status(500).json({
        success: false,
        message:
          error?.message ||
          "Unable to deactivate membership plan.",
      })
    }
  }