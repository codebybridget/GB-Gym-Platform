import User from "../models/User.js"
import WeightLog from "../models/WeightLog.js"

const VALID_FITNESS_GOALS = [
  "lose_weight",
  "keep_fit",
  "gain_weight",
  "become_trainer",
]

/*
|--------------------------------------------------------------------------
| Get my profile
|--------------------------------------------------------------------------
*/

const getMyProfile = async (
  req,
  res,
) => {
  try {
    const user =
      await User.findById(
        req.user._id,
      ).select("-password")

    if (!user) {
      return res.status(404).json({
        success: false,
        message:
          "Profile not found.",
      })
    }

    return res.status(200).json({
      success: true,
      user,
    })
  } catch (error) {
    console.error(
      "Get profile error:",
      error,
    )

    return res.status(500).json({
      success: false,
      message:
        "Unable to retrieve profile.",
    })
  }
}

/*
|--------------------------------------------------------------------------
| Update my profile
|--------------------------------------------------------------------------
*/

const updateMyProfile = async (
  req,
  res,
) => {
  try {
    const {
      firstName,
      lastName,
      phone,
      dateOfBirth,
      gender,
      age,
      height,
      weight,
      address,
      fitnessGoal,
      medicalProfile,
      emergencyContacts,
      profilePhoto,
    } = req.body

    const user =
      await User.findById(
        req.user._id,
      )

    if (!user) {
      return res.status(404).json({
        success: false,
        message:
          "Profile not found.",
      })
    }

    /*
    |--------------------------------------------------------------------------
    | Basic information
    |--------------------------------------------------------------------------
    */

    if (
      firstName !== undefined
    ) {
      const value =
        String(
          firstName,
        ).trim()

      if (!value) {
        return res.status(400).json({
          success: false,
          message:
            "First name cannot be empty.",
        })
      }

      user.firstName =
        value
    }

    if (
      lastName !== undefined
    ) {
      const value =
        String(
          lastName,
        ).trim()

      if (!value) {
        return res.status(400).json({
          success: false,
          message:
            "Last name cannot be empty.",
        })
      }

      user.lastName =
        value
    }

    if (phone !== undefined) {
      user.phone =
        String(phone).trim()
    }

    /*
    |--------------------------------------------------------------------------
    | Date of birth
    |--------------------------------------------------------------------------
    */

    if (
      dateOfBirth !==
      undefined
    ) {
      if (!dateOfBirth) {
        user.dateOfBirth =
          null
      } else {
        const parsedDate =
          new Date(
            dateOfBirth,
          )

        if (
          Number.isNaN(
            parsedDate.getTime(),
          )
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Invalid date of birth.",
          })
        }

        user.dateOfBirth =
          parsedDate
      }
    }

    /*
    |--------------------------------------------------------------------------
    | Gender
    |--------------------------------------------------------------------------
    */

    if (gender !== undefined) {
      const value =
        String(
          gender || "",
        )
          .trim()
          .toLowerCase()

      if (
        ![
          "",
          "female",
          "male",
          "other",
        ].includes(value)
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid gender.",
        })
      }

      user.gender =
        value
    }

    /*
    |--------------------------------------------------------------------------
    | Age
    |--------------------------------------------------------------------------
    */

    if (age !== undefined) {
      if (
        age === null ||
        age === ""
      ) {
        user.age = null
      } else {
        const numericAge =
          Number(age)

        if (
          !Number.isFinite(
            numericAge,
          ) ||
          numericAge < 1 ||
          numericAge > 120
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Age must be between 1 and 120.",
          })
        }

        user.age =
          numericAge
      }
    }

    /*
    |--------------------------------------------------------------------------
    | Height
    |--------------------------------------------------------------------------
    */

    if (
      height !== undefined
    ) {
      if (
        height === null ||
        typeof height !==
          "object"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Height must be an object containing value and unit.",
        })
      }

      const heightValue =
        height.value ===
          null ||
        height.value ===
          ""
          ? null
          : Number(
              height.value,
            )

      const heightUnit =
        height.unit || "cm"

      if (
        heightValue !==
          null &&
        (!Number.isFinite(
          heightValue,
        ) ||
          heightValue <= 0)
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Height must be greater than zero.",
        })
      }

      if (
        !["cm", "ft"].includes(
          heightUnit,
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Height unit must be cm or ft.",
        })
      }

      user.height = {
        value:
          heightValue,

        unit:
          heightUnit,
      }
    }

    /*
    |--------------------------------------------------------------------------
    | Weight
    |--------------------------------------------------------------------------
    |
    | The current weight is stored on User.
    | A separate WeightLog is also created whenever a valid weight
    | is submitted so we retain the member's progress history.
    |--------------------------------------------------------------------------
    */

    let newWeightLog = null

    if (
      weight !== undefined
    ) {
      if (
        weight === null ||
        typeof weight !==
          "object"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Weight must be an object containing value and unit.",
        })
      }

      const weightValue =
        weight.value ===
          null ||
        weight.value ===
          ""
          ? null
          : Number(
              weight.value,
            )

      const weightUnit =
        weight.unit || "kg"

      if (
        weightValue !==
          null &&
        (!Number.isFinite(
          weightValue,
        ) ||
          weightValue <= 0)
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Weight must be greater than zero.",
        })
      }

      if (
        !["kg", "lb"].includes(
          weightUnit,
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Weight unit must be kg or lb.",
        })
      }

      user.weight = {
        value:
          weightValue,

        unit:
          weightUnit,
      }

      if (
        weightValue !== null
      ) {
        newWeightLog =
          await WeightLog.create(
            {
              gym:
                user.gym,

              member:
                user._id,

              weight: {
                value:
                  weightValue,

                unit:
                  weightUnit,
              },

              recordedAt:
                new Date(),
            },
          )
      }
    }

    /*
    |--------------------------------------------------------------------------
    | Address
    |--------------------------------------------------------------------------
    */

    if (
      address !== undefined
    ) {
      user.address =
        String(
          address,
        ).trim()
    }

    /*
    |--------------------------------------------------------------------------
    | Fitness goal
    |--------------------------------------------------------------------------
    */

    if (
      fitnessGoal !==
      undefined
    ) {
      if (
        !VALID_FITNESS_GOALS.includes(
          fitnessGoal,
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid fitness goal.",
        })
      }

      user.fitnessGoal =
        fitnessGoal
    }

    /*
    |--------------------------------------------------------------------------
    | Medical profile
    |--------------------------------------------------------------------------
    */

    if (
      medicalProfile !==
      undefined
    ) {
      if (
        medicalProfile ===
          null ||
        typeof medicalProfile !==
          "object"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Medical profile must be an object.",
        })
      }

      user.medicalProfile = {
        hasMedicalCondition:
          Boolean(
            medicalProfile.hasMedicalCondition,
          ),

        conditions:
          String(
            medicalProfile.conditions ||
              "",
          ).trim(),

        medications:
          String(
            medicalProfile.medications ||
              "",
          ).trim(),

        allergies:
          String(
            medicalProfile.allergies ||
              "",
          ).trim(),

        injuries:
          String(
            medicalProfile.injuries ||
              "",
          ).trim(),

        additionalInformation:
          String(
            medicalProfile.additionalInformation ||
              "",
          ).trim(),
      }
    }

    /*
    |--------------------------------------------------------------------------
    | Emergency contacts
    |--------------------------------------------------------------------------
    */

    if (
      emergencyContacts !==
      undefined
    ) {
      if (
        !Array.isArray(
          emergencyContacts,
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Emergency contacts must be an array.",
        })
      }

      user.emergencyContacts =
        emergencyContacts.map(
          (contact) => ({
            name:
              String(
                contact?.name ||
                  "",
              ).trim(),

            relationship:
              String(
                contact?.relationship ||
                  "",
              ).trim(),

            phone:
              String(
                contact?.phone ||
                  "",
              ).trim(),

            email:
              String(
                contact?.email ||
                  "",
              )
                .trim()
                .toLowerCase(),
          }),
        )
    }

    /*
    |--------------------------------------------------------------------------
    | Profile photo
    |--------------------------------------------------------------------------
    */

    if (
      profilePhoto !==
      undefined
    ) {
      user.profilePhoto =
        String(
          profilePhoto ||
            "",
        ).trim()
    }

    await user.save()

    const updatedUser =
      await User.findById(
        user._id,
      ).select("-password")

    /*
    |--------------------------------------------------------------------------
    | Return updated profile
    |--------------------------------------------------------------------------
    */

    return res.status(200).json({
      success: true,
      message:
        "Profile updated successfully.",
      user: updatedUser,
      weightLog:
        newWeightLog,
    })
  } catch (error) {
    console.error(
      "Update profile error:",
      error,
    )

    return res.status(500).json({
      success: false,
      message:
        "Unable to update profile.",
    })
  }
}

/*
|--------------------------------------------------------------------------
| Get weight history
|--------------------------------------------------------------------------
*/

const getWeightHistory = async (
  req,
  res,
) => {
  try {
    const weights =
      await WeightLog.find({
        member:
          req.user._id,
      })
        .sort({
          recordedAt: 1,
        })
        .select(
          "weight recordedAt notes",
        )
        .lean()

    return res.status(200).json({
      success: true,
      count:
        weights.length,
      weights,
    })
  } catch (error) {
    console.error(
      "Get weight history error:",
      error,
    )

    return res.status(500).json({
      success: false,
      message:
        "Unable to retrieve weight history.",
    })
  }
}

/*
|--------------------------------------------------------------------------
| Update medical profile
|--------------------------------------------------------------------------
*/

const updateMedicalProfile =
  async (
    req,
    res,
  ) => {
    try {
      const {
        hasMedicalCondition,
        conditions,
        medications,
        allergies,
        injuries,
        additionalInformation,
      } = req.body

      const user =
        await User.findById(
          req.user._id,
        )

      if (!user) {
        return res.status(404).json({
          success: false,
          message:
            "Profile not found.",
        })
      }

      user.medicalProfile = {
        hasMedicalCondition:
          Boolean(
            hasMedicalCondition,
          ),

        conditions:
          String(
            conditions || "",
          ).trim(),

        medications:
          String(
            medications || "",
          ).trim(),

        allergies:
          String(
            allergies || "",
          ).trim(),

        injuries:
          String(
            injuries || "",
          ).trim(),

        additionalInformation:
          String(
            additionalInformation ||
              "",
          ).trim(),
      }

      await user.save()

      const updatedUser =
        await User.findById(
          user._id,
        ).select("-password")

      return res.status(200).json({
        success: true,
        message:
          "Medical information updated successfully.",
        user: updatedUser,
      })
    } catch (error) {
      console.error(
        "Update medical profile error:",
        error,
      )

      return res.status(500).json({
        success: false,
        message:
          "Unable to update medical information.",
      })
    }
  }

/*
|--------------------------------------------------------------------------
| Update fitness goal
|--------------------------------------------------------------------------
*/

const updateFitnessGoal =
  async (
    req,
    res,
  ) => {
    try {
      const {
        fitnessGoal,
      } = req.body

      if (
        !VALID_FITNESS_GOALS.includes(
          fitnessGoal,
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid fitness goal.",
        })
      }

      const user =
        await User.findByIdAndUpdate(
          req.user._id,
          {
            fitnessGoal,
          },
          {
            new: true,
            runValidators: true,
          },
        ).select("-password")

      if (!user) {
        return res.status(404).json({
          success: false,
          message:
            "Profile not found.",
        })
      }

      return res.status(200).json({
        success: true,
        message:
          "Fitness goal updated successfully.",
        fitnessGoal:
          user.fitnessGoal,
        user,
      })
    } catch (error) {
      console.error(
        "Update fitness goal error:",
        error,
      )

      return res.status(500).json({
        success: false,
        message:
          "Unable to update fitness goal.",
      })
    }
  }

export {
  getMyProfile,
  updateMyProfile,
  getWeightHistory,
  updateMedicalProfile,
  updateFitnessGoal,
}