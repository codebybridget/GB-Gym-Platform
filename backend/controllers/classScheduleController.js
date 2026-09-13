import ClassSchedule from "../models/ClassSchedule.js"

const DAY_ORDER = {
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
  Saturday: 6,
  Sunday: 7,
}

const getSchedule = async (req, res) => {
  try {
    const schedules = await ClassSchedule.find({
      isActive: true,
    })
      .populate(
        "createdBy",
        "firstName lastName role",
      )
      .populate(
        "updatedBy",
        "firstName lastName role",
      )
      .populate(
        "trainer",
        "firstName lastName email profilePhoto role",
      )

    schedules.sort(
      (a, b) =>
        (DAY_ORDER[a.dayOfWeek] || 99) -
        (DAY_ORDER[b.dayOfWeek] || 99),
    )

    return res.status(200).json({
      success: true,
      count: schedules.length,
      schedules,
    })
  } catch (error) {
    console.error(
      "Get class schedule error:",
      error,
    )

    return res.status(500).json({
      success: false,
      message:
        "Unable to retrieve class schedule.",
    })
  }
}

const createSchedule = async (req, res) => {
  try {
    const {
      dayOfWeek,
      workoutType,
      title,
      startTime,
      endTime,
      description,
      trainer,
      capacity,
      location,
    } = req.body

    if (
      !dayOfWeek ||
      !workoutType ||
      !title?.trim()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Day, workout type and title are required.",
      })
    }

    const existingSchedule =
      await ClassSchedule.findOne({
        dayOfWeek,
        isActive: true,
      })

    if (existingSchedule) {
      return res.status(409).json({
        success: false,
        message:
          `A schedule already exists for ${dayOfWeek}.`,
      })
    }

    const schedule =
      await ClassSchedule.create({
        dayOfWeek,

        workoutType,

        title: title.trim(),

        startTime:
          startTime?.trim() || "",

        endTime:
          endTime?.trim() || "",

        description:
          description?.trim() || "",

        trainer:
          trainer || null,

        capacity:
          capacity !== undefined &&
          capacity !== null &&
          capacity !== ""
            ? Number(capacity)
            : 0,

        location:
          location?.trim() || "",

        createdBy:
          req.user._id,

        updatedBy:
          req.user._id,
      })

    await schedule.populate(
      "trainer",
      "firstName lastName email profilePhoto role",
    )

    return res.status(201).json({
      success: true,
      message:
        "Class schedule created successfully.",
      schedule,
    })
  } catch (error) {
    console.error(
      "Create class schedule error:",
      error,
    )

    return res.status(500).json({
      success: false,
      message:
        "Unable to create class schedule.",
    })
  }
}

const updateSchedule = async (req, res) => {
  try {
    const allowedFields = [
      "dayOfWeek",
      "workoutType",
      "title",
      "startTime",
      "endTime",
      "description",
      "isActive",
      "trainer",
      "capacity",
      "location",
    ]

    const updates = {}

    for (
      const field of allowedFields
    ) {
      if (
        req.body[field] !==
        undefined
      ) {
        updates[field] =
          req.body[field]
      }
    }

    if (
      updates.title !==
      undefined
    ) {
      updates.title =
        String(
          updates.title,
        ).trim()
    }

    if (
      updates.startTime !==
      undefined
    ) {
      updates.startTime =
        String(
          updates.startTime,
        ).trim()
    }

    if (
      updates.endTime !==
      undefined
    ) {
      updates.endTime =
        String(
          updates.endTime,
        ).trim()
    }

    if (
      updates.description !==
      undefined
    ) {
      updates.description =
        String(
          updates.description,
        ).trim()
    }

    if (
      updates.location !==
      undefined
    ) {
      updates.location =
        String(
          updates.location,
        ).trim()
    }

    if (
      updates.trainer ===
      undefined
    ) {
      // Keep the existing trainer.
    } else if (
      updates.trainer === "" ||
      updates.trainer === null
    ) {
      updates.trainer = null
    }

    if (
      updates.capacity !==
      undefined
    ) {
      if (
        updates.capacity === "" ||
        updates.capacity === null
      ) {
        updates.capacity = 0
      } else {
        updates.capacity =
          Number(
            updates.capacity,
          )

        if (
          Number.isNaN(
            updates.capacity,
          )
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Capacity must be a valid number.",
          })
        }
      }
    }

    if (
      updates.dayOfWeek !==
      undefined
    ) {
      const duplicate =
        await ClassSchedule.findOne({
          _id: {
            $ne:
              req.params.id,
          },
          dayOfWeek:
            updates.dayOfWeek,
          isActive:
            updates.isActive !==
            false,
        })

      if (duplicate) {
        return res.status(409).json({
          success: false,
          message:
            `A schedule already exists for ${updates.dayOfWeek}.`,
        })
      }
    }

    updates.updatedBy =
      req.user._id

    const schedule =
      await ClassSchedule.findOneAndUpdate(
        {
          _id:
            req.params.id,
        },
        updates,
        {
          new: true,
          runValidators: true,
        },
      )
        .populate(
          "createdBy",
          "firstName lastName role",
        )
        .populate(
          "updatedBy",
          "firstName lastName role",
        )
        .populate(
          "trainer",
          "firstName lastName email profilePhoto role",
        )

    if (!schedule) {
      return res.status(404).json({
        success: false,
        message:
          "Class schedule not found.",
      })
    }

    return res.status(200).json({
      success: true,
      message:
        "Class schedule updated successfully.",
      schedule,
    })
  } catch (error) {
    console.error(
      "Update class schedule error:",
      error,
    )

    return res.status(500).json({
      success: false,
      message:
        "Unable to update class schedule.",
    })
  }
}

const seedDefaultSchedule = async (
  req,
  res,
) => {
  try {
    const defaults = [
      {
        dayOfWeek: "Monday",
        workoutType: "Lower Body",
        title: "Lower Body",
        startTime: "",
        endTime: "",
        description:
          "Lower body training.",
      },

      {
        dayOfWeek: "Tuesday",
        workoutType: "Upper Body",
        title: "Upper Body",
        startTime: "",
        endTime: "",
        description:
          "Upper body training.",
      },

      {
        dayOfWeek: "Wednesday",
        workoutType: "Lower Body",
        title: "Lower Body",
        startTime: "",
        endTime: "",
        description:
          "Lower body training.",
      },

      {
        dayOfWeek: "Thursday",
        workoutType: "Upper Body",
        title: "Upper Body",
        startTime: "",
        endTime: "",
        description:
          "Upper body training.",
      },

      {
        dayOfWeek: "Friday",
        workoutType: "CrossFit",
        title: "CrossFit",
        startTime: "",
        endTime: "",
        description:
          "General full-body CrossFit training.",
      },

      {
        dayOfWeek: "Saturday",
        workoutType: "Tabata",
        title: "Saturday Tabata",
        startTime: "08:00",
        endTime: "09:00",
        description:
          "One-hour Tabata class.",
      },

      {
        dayOfWeek: "Sunday",
        workoutType: "Rest",
        title: "Rest Day",
        startTime: "",
        endTime: "",
        description:
          "Recovery and rest.",
      },
    ]

    const created = []

    for (
      const item of defaults
    ) {
      const existing =
        await ClassSchedule.findOne({
          dayOfWeek:
            item.dayOfWeek,
          isActive: true,
        })

      if (!existing) {
        const schedule =
          await ClassSchedule.create({
            ...item,

            createdBy:
              req.user._id,

            updatedBy:
              req.user._id,
          })

        created.push(
          schedule,
        )
      }
    }

    return res.status(201).json({
      success: true,
      message:
        created.length > 0
          ? "Default weekly schedule created."
          : "Default weekly schedule already exists.",
      createdCount:
        created.length,
      schedules:
        created,
    })
  } catch (error) {
    console.error(
      "Seed schedule error:",
      error,
    )

    return res.status(500).json({
      success: false,
      message:
        "Unable to create default schedule.",
    })
  }
}

export {
  getSchedule,
  createSchedule,
  updateSchedule,
  seedDefaultSchedule,
}