import multer from "multer"

/*
|--------------------------------------------------------------------------
| Exercise Upload Middleware
|--------------------------------------------------------------------------
|
| Exercise images and videos are uploaded to Cloudinary by the controller.
|
| We therefore keep the uploaded files in memory instead of writing them
| to the local filesystem.
|
|--------------------------------------------------------------------------
*/

/*
|--------------------------------------------------------------------------
| Storage
|--------------------------------------------------------------------------
*/

const storage =
  multer.memoryStorage()

/*
|--------------------------------------------------------------------------
| File validation
|--------------------------------------------------------------------------
*/

const fileFilter =
  (
    req,
    file,
    cb,
  ) => {
    /*
    |--------------------------------------------------------------------------
    | Exercise image
    |--------------------------------------------------------------------------
    */

    if (
      file.fieldname ===
      "image"
    ) {
      const allowedImageTypes = [
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/gif",
      ]

      if (
        allowedImageTypes.includes(
          file.mimetype,
        )
      ) {
        return cb(
          null,
          true,
        )
      }

      return cb(
        new Error(
          "Only JPG, PNG, WEBP and GIF images are allowed.",
        ),
        false,
      )
    }

    /*
    |--------------------------------------------------------------------------
    | Exercise video
    |--------------------------------------------------------------------------
    */

    if (
      file.fieldname ===
      "video"
    ) {
      const allowedVideoTypes = [
        "video/mp4",
        "video/webm",
        "video/quicktime",
        "video/x-msvideo",
      ]

      if (
        allowedVideoTypes.includes(
          file.mimetype,
        )
      ) {
        return cb(
          null,
          true,
        )
      }

      return cb(
        new Error(
          "Only MP4, WEBM, MOV and AVI videos are allowed.",
        ),
        false,
      )
    }

    /*
    |--------------------------------------------------------------------------
    | Invalid field
    |--------------------------------------------------------------------------
    */

    return cb(
      new Error(
        "Invalid upload field.",
      ),
      false,
    )
  }

/*
|--------------------------------------------------------------------------
| Exercise upload
|--------------------------------------------------------------------------
*/

const exerciseUpload =
  multer({
    storage,

    fileFilter,

    limits: {
      fileSize:
        100 *
        1024 *
        1024,
    },
  })

export {
  exerciseUpload,
}