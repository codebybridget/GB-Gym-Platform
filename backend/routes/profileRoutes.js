import express from "express"
import multer from "multer"

import {
  getMyProfile,
  getWeightHistory,
  updateFitnessGoal,
  updateMedicalProfile,
  updateMyProfile,
} from "../controllers/profileController.js"

import {
  uploadProfilePhoto,
} from "../controllers/profilePhotoController.js"

import {
  protect,
} from "../middleware/authMiddleware.js"

const router =
  express.Router()

/*
|--------------------------------------------------------------------------
| Profile Photo Upload
|--------------------------------------------------------------------------
|
| The image is kept temporarily in memory and streamed
| directly to Cloudinary.
|
*/

const profilePhotoUpload =
  multer({
    storage:
      multer.memoryStorage(),

    limits: {
      fileSize:
        5 * 1024 * 1024,

      files: 1,
    },

    fileFilter: (
      req,
      file,
      callback,
    ) => {
      if (
        file.mimetype?.startsWith(
          "image/",
        )
      ) {
        callback(
          null,
          true,
        )

        return
      }

      callback(
        new Error(
          "Only image files are allowed.",
        ),
        false,
      )
    },
  })

/*
|--------------------------------------------------------------------------
| Get My Profile
|--------------------------------------------------------------------------
*/

router.get(
  "/me",
  protect,
  getMyProfile,
)

router.get(
  "/me/weight-history",
  protect,
  getWeightHistory,
)

/*
|--------------------------------------------------------------------------
| Update My Profile
|--------------------------------------------------------------------------
*/

router.put(
  "/me",
  protect,
  updateMyProfile,
)

/*
|--------------------------------------------------------------------------
| Upload Profile Photo
|--------------------------------------------------------------------------
*/

router.put(
  "/me/photo",
  protect,
  profilePhotoUpload.single(
    "photo",
  ),
  uploadProfilePhoto,
)

/*
|--------------------------------------------------------------------------
| Update Medical Profile
|--------------------------------------------------------------------------
*/

router.put(
  "/me/medical",
  protect,
  updateMedicalProfile,
)

/*
|--------------------------------------------------------------------------
| Update Fitness Goal
|--------------------------------------------------------------------------
*/

router.put(
  "/me/fitness-goal",
  protect,
  updateFitnessGoal,
)

export default router