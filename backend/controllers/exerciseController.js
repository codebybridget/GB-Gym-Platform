import mongoose from "mongoose"
import fs from "fs"

import Exercise from "../models/Exercise.js"
import cloudinary from "../config/cloudinary.js"


/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

const escapeRegex = (value) => {
  return String(value).replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&",
  )
}


/*
|--------------------------------------------------------------------------
| Normalize Array
|--------------------------------------------------------------------------
*/

const normalizeArray = (
  value,
  separator = ",",
) => {
  if (Array.isArray(value)) {
    return value
      .map((item) =>
        String(item).trim(),
      )
      .filter(Boolean)
  }

  if (
    typeof value === "string"
  ) {
    const trimmedValue = value.trim()

    /*
    |--------------------------------------------------------------------------
    | Handle JSON Arrays From FormData
    |--------------------------------------------------------------------------
    |
    | The frontend sends array fields such as targetGender and fitnessGoals
    | through FormData using JSON.stringify(). Parse those values back into
    | real arrays before applying the normal array cleanup.
    |
    */

    if (
      trimmedValue.startsWith("[") &&
      trimmedValue.endsWith("]")
    ) {
      try {
        const parsed = JSON.parse(
          trimmedValue,
        )

        if (Array.isArray(parsed)) {
          return parsed
            .map((item) =>
              String(item).trim(),
            )
            .filter(Boolean)
        }
      } catch {
        // Fall back to normal separator handling below.
      }
    }

    return trimmedValue
      .split(separator)
      .map((item) =>
        item.trim(),
      )
      .filter(Boolean)
  }

  return []
}


/*
|--------------------------------------------------------------------------
| Delete Temporary Local File
|--------------------------------------------------------------------------
*/

const deleteTemporaryFile = (
  file,
) => {
  try {
    if (!file?.path) {
      return
    }

    if (
      fs.existsSync(
        file.path,
      )
    ) {
      fs.unlinkSync(
        file.path,
      )
    }
  } catch (error) {
    console.error(
      "Unable to delete temporary file:",
      error,
    )
  }
}


/*
|--------------------------------------------------------------------------
| Upload Image To Cloudinary
|--------------------------------------------------------------------------
*/

const uploadImageToCloudinary =
  async (file) => {
    if (!file) {
      return null
    }

    const result =
      await cloudinary.uploader.upload(
        file.path,
        {
          folder:
            "gb-gym/exercises/images",

          resource_type:
            "image",

          use_filename:
            false,

          unique_filename:
            true,

          overwrite:
            false,
        },
      )

    return {
      url:
        result.secure_url,

      publicId:
        result.public_id,
    }
  }


/*
|--------------------------------------------------------------------------
| Upload Video To Cloudinary
|--------------------------------------------------------------------------
*/

const uploadVideoToCloudinary =
  async (file) => {
    if (!file) {
      return null
    }

    const result =
      await cloudinary.uploader.upload(
        file.path,
        {
          folder:
            "gb-gym/exercises/videos",

          resource_type:
            "video",

          use_filename:
            false,

          unique_filename:
            true,

          overwrite:
            false,
        },
      )

    return {
      url:
        result.secure_url,

      publicId:
        result.public_id,
    }
  }


/*
|--------------------------------------------------------------------------
| Delete Cloudinary Image
|--------------------------------------------------------------------------
*/

const deleteCloudinaryImage =
  async (
    publicId,
  ) => {
    try {
      if (!publicId) {
        return
      }

      await cloudinary.uploader.destroy(
        publicId,
        {
          resource_type:
            "image",
        },
      )
    } catch (error) {
      console.error(
        "Unable to delete Cloudinary image:",
        error,
      )
    }
  }


/*
|--------------------------------------------------------------------------
| Delete Cloudinary Video
|--------------------------------------------------------------------------
*/

const deleteCloudinaryVideo =
  async (
    publicId,
  ) => {
    try {
      if (!publicId) {
        return
      }

      await cloudinary.uploader.destroy(
        publicId,
        {
          resource_type:
            "video",
        },
      )
    } catch (error) {
      console.error(
        "Unable to delete Cloudinary video:",
        error,
      )
    }
  }


/*
|--------------------------------------------------------------------------
| Get Exercises
|--------------------------------------------------------------------------
*/

const getExercises = async (
  req,
  res,
) => {
  try {
    const {
      category,
      difficulty,
      search,
      active,
      gender,
      goal,
    } = req.query

    const filter = {}


    /*
    |--------------------------------------------------------------------------
    | Category
    |--------------------------------------------------------------------------
    */

    if (category) {
      filter.category =
        category
    }


    /*
    |--------------------------------------------------------------------------
    | Difficulty
    |--------------------------------------------------------------------------
    */

    if (difficulty) {
      filter.difficulty =
        difficulty
    }


    /*
    |--------------------------------------------------------------------------
    | Active
    |--------------------------------------------------------------------------
    */

    if (
      active !==
      undefined
    ) {
      filter.isActive =
        active === "true"
    }


    /*
    |--------------------------------------------------------------------------
    | Gender Recommendation Filter
    |--------------------------------------------------------------------------
    */

    if (gender) {
      filter.targetGender =
        gender
    }


    /*
    |--------------------------------------------------------------------------
    | Fitness Goal Filter
    |--------------------------------------------------------------------------
    */

    if (goal) {
      filter.fitnessGoals =
        goal
    }


    /*
    |--------------------------------------------------------------------------
    | Search
    |--------------------------------------------------------------------------
    */

    if (
      search?.trim()
    ) {
      const value =
        escapeRegex(
          search.trim(),
        )

      filter.$or = [
        {
          name: {
            $regex:
              value,
            $options:
              "i",
          },
        },

        {
          muscleGroup: {
            $regex:
              value,
            $options:
              "i",
          },
        },

        {
          description: {
            $regex:
              value,
            $options:
              "i",
          },
        },

        {
          secondaryMuscles: {
            $regex:
              value,
            $options:
              "i",
          },
        },
      ]
    }


    /*
    |--------------------------------------------------------------------------
    | Get Exercises
    |--------------------------------------------------------------------------
    */

    const exercises =
      await Exercise.find(
        filter,
      )
        .populate(
          "createdBy",
          "firstName lastName role",
        )
        .populate(
          "updatedBy",
          "firstName lastName role",
        )
        .sort({
          category: 1,
          name: 1,
        })


    return res.status(
      200,
    ).json({
      success:
        true,

      count:
        exercises.length,

      exercises,
    })

  } catch (error) {
    console.error(
      "Get exercises error:",
      error,
    )

    return res.status(
      500,
    ).json({
      success:
        false,

      message:
        "Unable to retrieve exercises.",

      error:
        process.env.NODE_ENV !==
        "production"
          ? error.message
          : undefined,
    })
  }
}


/*
|--------------------------------------------------------------------------
| Get Exercise By ID
|--------------------------------------------------------------------------
*/

const getExerciseById =
  async (
    req,
    res,
  ) => {
    try {
      const {
        id,
      } = req.params


      if (
        !mongoose.Types.ObjectId.isValid(
          id,
        )
      ) {
        return res.status(
          400,
        ).json({
          success:
            false,

          message:
            "Invalid exercise ID.",
        })
      }


      const exercise =
        await Exercise.findById(
          id,
        )
          .populate(
            "createdBy",
            "firstName lastName role",
          )
          .populate(
            "updatedBy",
            "firstName lastName role",
          )


      if (!exercise) {
        return res.status(
          404,
        ).json({
          success:
            false,

          message:
            "Exercise not found.",
        })
      }


      return res.status(
        200,
      ).json({
        success:
          true,

        exercise,
      })

    } catch (error) {
      console.error(
        "Get exercise error:",
        error,
      )

      return res.status(
        500,
      ).json({
        success:
          false,

        message:
          "Unable to retrieve exercise.",

        error:
          process.env.NODE_ENV !==
          "production"
            ? error.message
            : undefined,
      })
    }
  }


/*
|--------------------------------------------------------------------------
| Create Exercise
|--------------------------------------------------------------------------
*/

const createExercise =
  async (
    req,
    res,
  ) => {
    let uploadedImage =
      null

    let uploadedVideo =
      null

    const imageFile =
      req.files?.image?.[0]

    const videoFile =
      req.files?.video?.[0]


    try {
      const {
        name,
        category,
        muscleGroup,
        secondaryMuscles,
        targetGender,
        fitnessGoals,
        description,
        instructions,
        safetyTips,
        equipment,
        difficulty,
        defaultSets,
        defaultReps,
        defaultDuration,
        defaultRest,
        caloriesEstimate,
        imageUrl,
        videoUrl,
      } = req.body


      /*
      |--------------------------------------------------------------------------
      | Validate Required Fields
      |--------------------------------------------------------------------------
      */

      if (
        !name?.trim() ||
        !category
      ) {
        return res.status(
          400,
        ).json({
          success:
            false,

          message:
            "Exercise name and category are required.",
        })
      }


      /*
      |--------------------------------------------------------------------------
      | Normalize Name
      |--------------------------------------------------------------------------
      */

      const normalizedName =
        name.trim()


      /*
      |--------------------------------------------------------------------------
      | Duplicate Check
      |--------------------------------------------------------------------------
      */

      const existing =
        await Exercise.findOne({
          name: {
            $regex:
              `^${escapeRegex(
                normalizedName,
              )}$`,

            $options:
              "i",
          },

          category,
        })


      if (existing) {
        return res.status(
          409,
        ).json({
          success:
            false,

          message:
            "An exercise with this name already exists in this category.",
        })
      }


      /*
      |--------------------------------------------------------------------------
      | Normalize Recommendation Fields
      |--------------------------------------------------------------------------
      */

      const normalizedSecondaryMuscles =
        normalizeArray(
          secondaryMuscles,
        )


      const normalizedGender =
        normalizeArray(
          targetGender,
        )


      const normalizedGoals =
        normalizeArray(
          fitnessGoals,
        )


      /*
      |--------------------------------------------------------------------------
      | Upload Image
      |--------------------------------------------------------------------------
      */

      if (imageFile) {
        uploadedImage =
          await uploadImageToCloudinary(
            imageFile,
          )
      }


      /*
      |--------------------------------------------------------------------------
      | Upload Video
      |--------------------------------------------------------------------------
      */

      if (videoFile) {
        uploadedVideo =
          await uploadVideoToCloudinary(
            videoFile,
          )
      }


      /*
      |--------------------------------------------------------------------------
      | Remove Temporary Files
      |--------------------------------------------------------------------------
      */

      deleteTemporaryFile(
        imageFile,
      )

      deleteTemporaryFile(
        videoFile,
      )


      /*
      |--------------------------------------------------------------------------
      | Create Exercise
      |--------------------------------------------------------------------------
      */

      const exercise =
        await Exercise.create({
          name:
            normalizedName,

          category,

          muscleGroup:
            muscleGroup?.trim() ||
            "",

          secondaryMuscles:
            normalizedSecondaryMuscles,

          targetGender:
            normalizedGender.length
              ? normalizedGender
              : [
                  "Male",
                  "Female",
                ],

          fitnessGoals:
            normalizedGoals,

          description:
            description?.trim() ||
            "",

          instructions:
            normalizeArray(
              instructions,
              "\n",
            ),

          safetyTips:
            normalizeArray(
              safetyTips,
              "\n",
            ),

          equipment:
            normalizeArray(
              equipment,
            ),

          difficulty:
            difficulty ||
            "Beginner",

          defaultSets:
            defaultSets !==
            undefined
              ? Number(
                  defaultSets,
                )
              : 3,

          defaultReps:
            defaultReps !==
              undefined &&
            defaultReps !==
              ""
              ? Number(
                  defaultReps,
                )
              : null,

          defaultDuration:
            defaultDuration !==
              undefined &&
            defaultDuration !==
              ""
              ? Number(
                  defaultDuration,
                )
              : null,

          defaultRest:
            defaultRest !==
              undefined
              ? Number(
                  defaultRest,
                )
              : 60,

          caloriesEstimate:
            caloriesEstimate !==
              undefined &&
            caloriesEstimate !==
              ""
              ? Number(
                  caloriesEstimate,
                )
              : null,

          imageUrl:
            uploadedImage?.url ||
            imageUrl?.trim() ||
            "",

          imagePublicId:
            uploadedImage?.publicId ||
            "",

          videoUrl:
            uploadedVideo?.url ||
            videoUrl?.trim() ||
            "",

          videoPublicId:
            uploadedVideo?.publicId ||
            "",

          createdBy:
            req.user?._id ||
            null,

          updatedBy:
            req.user?._id ||
            null,
        })


      return res.status(
        201,
      ).json({
        success:
          true,

        message:
          "Exercise created successfully.",

        exercise,
      })

    } catch (error) {
      console.error(
        "Create exercise error:",
        error,
      )


      /*
      |--------------------------------------------------------------------------
      | Cleanup Temporary Files
      |--------------------------------------------------------------------------
      */

      deleteTemporaryFile(
        imageFile,
      )

      deleteTemporaryFile(
        videoFile,
      )


      /*
      |--------------------------------------------------------------------------
      | Cleanup Cloudinary Files
      |--------------------------------------------------------------------------
      */

      if (
        uploadedImage?.publicId
      ) {
        await deleteCloudinaryImage(
          uploadedImage.publicId,
        )
      }


      if (
        uploadedVideo?.publicId
      ) {
        await deleteCloudinaryVideo(
          uploadedVideo.publicId,
        )
      }


      if (
        error.name ===
        "ValidationError"
      ) {
        return res.status(
          400,
        ).json({
          success:
            false,

          message:
            error.message ||
            "Invalid exercise data.",
        })
      }


      if (
        error.code ===
        11000
      ) {
        return res.status(
          409,
        ).json({
          success:
            false,

          message:
            "An exercise with this name already exists.",
        })
      }


      return res.status(
        500,
      ).json({
        success:
          false,

        message:
          "Unable to create exercise.",

        error:
          process.env.NODE_ENV !==
          "production"
            ? error.message
            : undefined,
      })
    }
  }


/*
|--------------------------------------------------------------------------
| Update Exercise
|--------------------------------------------------------------------------
*/

const updateExercise =
  async (
    req,
    res,
  ) => {
    let uploadedImage =
      null

    let uploadedVideo =
      null

    const imageFile =
      req.files?.image?.[0]

    const videoFile =
      req.files?.video?.[0]


    try {
      const {
        id,
      } = req.params


      /*
      |--------------------------------------------------------------------------
      | Validate ID
      |--------------------------------------------------------------------------
      */

      if (
        !mongoose.Types.ObjectId.isValid(
          id,
        )
      ) {
        return res.status(
          400,
        ).json({
          success:
            false,

          message:
            "Invalid exercise ID.",
        })
      }


      /*
      |--------------------------------------------------------------------------
      | Find Existing Exercise
      |--------------------------------------------------------------------------
      */

      const currentExercise =
        await Exercise.findById(
          id,
        )


      if (!currentExercise) {
        return res.status(
          404,
        ).json({
          success:
            false,

          message:
            "Exercise not found.",
        })
      }


      /*
      |--------------------------------------------------------------------------
      | Allowed Fields
      |--------------------------------------------------------------------------
      */

      const allowedFields = [
        "name",
        "category",
        "muscleGroup",
        "secondaryMuscles",
        "targetGender",
        "fitnessGoals",
        "description",
        "instructions",
        "safetyTips",
        "equipment",
        "difficulty",
        "defaultSets",
        "defaultReps",
        "defaultDuration",
        "defaultRest",
        "caloriesEstimate",
        "isActive",
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


      /*
      |--------------------------------------------------------------------------
      | Name
      |--------------------------------------------------------------------------
      */

      if (
        updates.name !==
        undefined
      ) {
        updates.name =
          String(
            updates.name,
          ).trim()


        if (
          !updates.name
        ) {
          return res.status(
            400,
          ).json({
            success:
              false,

            message:
              "Exercise name cannot be empty.",
          })
        }
      }


      /*
      |--------------------------------------------------------------------------
      | Category
      |--------------------------------------------------------------------------
      */

      if (
        updates.category !==
        undefined
      ) {
        updates.category =
          String(
            updates.category,
          ).trim()


        if (
          !updates.category
        ) {
          return res.status(
            400,
          ).json({
            success:
              false,

            message:
              "Exercise category cannot be empty.",
          })
        }
      }


      /*
      |--------------------------------------------------------------------------
      | Muscle Group
      |--------------------------------------------------------------------------
      */

      if (
        updates.muscleGroup !==
        undefined
      ) {
        updates.muscleGroup =
          String(
            updates.muscleGroup,
          ).trim()
      }


      /*
      |--------------------------------------------------------------------------
      | Secondary Muscles
      |--------------------------------------------------------------------------
      */

      if (
        updates.secondaryMuscles !==
        undefined
      ) {
        updates.secondaryMuscles =
          normalizeArray(
            updates.secondaryMuscles,
          )
      }


      /*
      |--------------------------------------------------------------------------
      | Target Gender
      |--------------------------------------------------------------------------
      */

      if (
        updates.targetGender !==
        undefined
      ) {
        updates.targetGender =
          normalizeArray(
            updates.targetGender,
          )
      }


      /*
      |--------------------------------------------------------------------------
      | Fitness Goals
      |--------------------------------------------------------------------------
      */

      if (
        updates.fitnessGoals !==
        undefined
      ) {
        updates.fitnessGoals =
          normalizeArray(
            updates.fitnessGoals,
          )
      }


      /*
      |--------------------------------------------------------------------------
      | Description
      |--------------------------------------------------------------------------
      */

      if (
        updates.description !==
        undefined
      ) {
        updates.description =
          String(
            updates.description,
          ).trim()
      }


      /*
      |--------------------------------------------------------------------------
      | Instructions
      |--------------------------------------------------------------------------
      */

      if (
        updates.instructions !==
        undefined
      ) {
        updates.instructions =
          normalizeArray(
            updates.instructions,
            "\n",
          )
      }


      /*
      |--------------------------------------------------------------------------
      | Safety Tips
      |--------------------------------------------------------------------------
      */

      if (
        updates.safetyTips !==
        undefined
      ) {
        updates.safetyTips =
          normalizeArray(
            updates.safetyTips,
            "\n",
          )
      }


      /*
      |--------------------------------------------------------------------------
      | Equipment
      |--------------------------------------------------------------------------
      */

      if (
        updates.equipment !==
        undefined
      ) {
        updates.equipment =
          normalizeArray(
            updates.equipment,
          )
      }


      /*
      |--------------------------------------------------------------------------
      | Numeric Fields
      |--------------------------------------------------------------------------
      */

      const numericFields = [
        "defaultSets",
        "defaultReps",
        "defaultDuration",
        "defaultRest",
        "caloriesEstimate",
      ]


      for (
        const field of numericFields
      ) {
        if (
          updates[field] !==
          undefined
        ) {
          if (
            updates[field] ===
              "" ||
            updates[field] ===
              null
          ) {
            updates[field] =
              null
          } else {
            const numericValue =
              Number(
                updates[field],
              )


            if (
              Number.isNaN(
                numericValue,
              )
            ) {
              return res.status(
                400,
              ).json({
                success:
                  false,

                message:
                  `${field} must be a valid number.`,
              })
            }


            updates[field] =
              numericValue
          }
        }
      }


      /*
      |--------------------------------------------------------------------------
      | Upload Replacement Image
      |--------------------------------------------------------------------------
      */

      if (imageFile) {
        uploadedImage =
          await uploadImageToCloudinary(
            imageFile,
          )


        updates.imageUrl =
          uploadedImage.url

        updates.imagePublicId =
          uploadedImage.publicId
      }


      /*
      |--------------------------------------------------------------------------
      | Upload Replacement Video
      |--------------------------------------------------------------------------
      */

      if (videoFile) {
        uploadedVideo =
          await uploadVideoToCloudinary(
            videoFile,
          )


        updates.videoUrl =
          uploadedVideo.url

        updates.videoPublicId =
          uploadedVideo.publicId
      }


      /*
      |--------------------------------------------------------------------------
      | Remove Temporary Files
      |--------------------------------------------------------------------------
      */

      deleteTemporaryFile(
        imageFile,
      )

      deleteTemporaryFile(
        videoFile,
      )


      /*
      |--------------------------------------------------------------------------
      | Duplicate Name / Category
      |--------------------------------------------------------------------------
      */

      if (
        updates.name !==
          undefined ||
        updates.category !==
          undefined
      ) {
        const finalName =
          updates.name ??
          currentExercise.name


        const finalCategory =
          updates.category ??
          currentExercise.category


        const duplicate =
          await Exercise.findOne({
            _id: {
              $ne: id,
            },

            name: {
              $regex:
                `^${escapeRegex(
                  finalName.trim(),
                )}$`,

              $options:
                "i",
            },

            category:
              finalCategory,
          })


        if (duplicate) {
          return res.status(
            409,
          ).json({
            success:
              false,

            message:
              "An exercise with this name already exists in this category.",
          })
        }
      }


      /*
      |--------------------------------------------------------------------------
      | Updated By
      |--------------------------------------------------------------------------
      */

      if (
        req.user?._id
      ) {
        updates.updatedBy =
          req.user._id
      }


      /*
      |--------------------------------------------------------------------------
      | Update Database
      |--------------------------------------------------------------------------
      */

      const exercise =
        await Exercise.findByIdAndUpdate(
          id,
          {
            $set:
              updates,
          },
          {
            new:
              true,

            runValidators:
              true,
          },
        )


      if (!exercise) {
        return res.status(
          404,
        ).json({
          success:
            false,

          message:
            "Exercise not found.",
        })
      }


      /*
      |--------------------------------------------------------------------------
      | Delete Previous Image
      |--------------------------------------------------------------------------
      */

      if (
        uploadedImage &&
        currentExercise.imagePublicId
      ) {
        await deleteCloudinaryImage(
          currentExercise.imagePublicId,
        )
      }


      /*
      |--------------------------------------------------------------------------
      | Delete Previous Video
      |--------------------------------------------------------------------------
      */

      if (
        uploadedVideo &&
        currentExercise.videoPublicId
      ) {
        await deleteCloudinaryVideo(
          currentExercise.videoPublicId,
        )
      }


      return res.status(
        200,
      ).json({
        success:
          true,

        message:
          "Exercise updated successfully.",

        exercise,
      })

    } catch (error) {
      console.error(
        "Update exercise error:",
        error,
      )


      /*
      |--------------------------------------------------------------------------
      | Cleanup Temporary Files
      |--------------------------------------------------------------------------
      */

      deleteTemporaryFile(
        imageFile,
      )

      deleteTemporaryFile(
        videoFile,
      )


      /*
      |--------------------------------------------------------------------------
      | Cleanup Newly Uploaded Files
      |--------------------------------------------------------------------------
      */

      if (
        uploadedImage?.publicId
      ) {
        await deleteCloudinaryImage(
          uploadedImage.publicId,
        )
      }


      if (
        uploadedVideo?.publicId
      ) {
        await deleteCloudinaryVideo(
          uploadedVideo.publicId,
        )
      }


      /*
      |--------------------------------------------------------------------------
      | Validation Error
      |--------------------------------------------------------------------------
      */

      if (
        error.name ===
        "ValidationError"
      ) {
        return res.status(
          400,
        ).json({
          success:
            false,

          message:
            error.message ||
            "Invalid exercise data.",
        })
      }


      /*
      |--------------------------------------------------------------------------
      | Duplicate Error
      |--------------------------------------------------------------------------
      */

      if (
        error.code ===
        11000
      ) {
        return res.status(
          409,
        ).json({
          success:
            false,

          message:
            "An exercise with this name already exists.",
        })
      }


      /*
      |--------------------------------------------------------------------------
      | Detailed Development Error
      |--------------------------------------------------------------------------
      */

      return res.status(
        500,
      ).json({
        success:
          false,

        message:
          "Unable to update exercise.",

        error:
          process.env.NODE_ENV !==
          "production"
            ? error.message
            : undefined,
      })
    }
  }


/*
|--------------------------------------------------------------------------
| Delete / Deactivate Exercise
|--------------------------------------------------------------------------
*/

const deleteExercise =
  async (
    req,
    res,
  ) => {
    try {
      const {
        id,
      } = req.params

      if (
        !mongoose.Types.ObjectId.isValid(
          id,
        )
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid exercise ID.",
        })
      }

      const exercise =
        await Exercise.findById(id)

      if (!exercise) {
        return res.status(404).json({
          success: false,
          message: "Exercise not found.",
        })
      }

      await Exercise.findByIdAndDelete(id)

      return res.status(200).json({
        success: true,
        message: "Exercise deleted successfully.",
      })

    } catch (error) {
      console.error(
        "Delete exercise error:",
        error,
      )

      return res.status(
        500,
      ).json({
        success:
          false,

        message:
          "Unable to deactivate exercise.",

        error:
          process.env.NODE_ENV !==
          "production"
            ? error.message
            : undefined,
      })
    }
  }


/*
|--------------------------------------------------------------------------
| Exports
|--------------------------------------------------------------------------
*/

export {
  getExercises,
  getExerciseById,
  createExercise,
  updateExercise,
  deleteExercise,
}