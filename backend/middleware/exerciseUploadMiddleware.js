import multer from "multer"

/*
|--------------------------------------------------------------------------
| Storage
|--------------------------------------------------------------------------
|
| Exercise images and videos are kept in memory temporarily.
| They are uploaded directly to Cloudinary by the exercise controller.
|
|--------------------------------------------------------------------------
*/

const storage =
  multer.memoryStorage()

/*
|--------------------------------------------------------------------------
| Allowed File Types
|--------------------------------------------------------------------------
*/

const allowedImageTypes = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
]

const allowedVideoTypes = [
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "video/x-msvideo",
  "video/mpeg",
]

/*
|--------------------------------------------------------------------------
| File Filter
|--------------------------------------------------------------------------
*/

const fileFilter = (
  req,
  file,
  callback,
) => {
  /*
  |--------------------------------------------------------------------------
  | Exercise Image
  |--------------------------------------------------------------------------
  */

  if (
    file.fieldname ===
    "image"
  ) {
    if (
      allowedImageTypes.includes(
        file.mimetype,
      )
    ) {
      return callback(
        null,
        true,
      )
    }

    return callback(
      new Error(
        "Invalid image file. Please upload a JPG, JPEG, PNG, WEBP, or GIF image.",
      ),
      false,
    )
  }

  /*
  |--------------------------------------------------------------------------
  | Exercise Video
  |--------------------------------------------------------------------------
  */

  if (
    file.fieldname ===
    "video"
  ) {
    if (
      allowedVideoTypes.includes(
        file.mimetype,
      )
    ) {
      return callback(
        null,
        true,
      )
    }

    return callback(
      new Error(
        "Invalid video file. Please upload an MP4, WEBM, MOV, AVI, or MPEG video.",
      ),
      false,
    )
  }

  /*
  |--------------------------------------------------------------------------
  | Unexpected Field
  |--------------------------------------------------------------------------
  */

  return callback(
    new multer.MulterError(
      "LIMIT_UNEXPECTED_FILE",
      file.fieldname,
    ),
    false,
  )
}

/*
|--------------------------------------------------------------------------
| Multer Configuration
|--------------------------------------------------------------------------
|
| Maximum:
| - One image
| - One video
| - 100 MB per file
|
|--------------------------------------------------------------------------
*/

const upload =
  multer({
    storage,

    fileFilter,

    limits: {
      files: 2,

      fieldNameSize:
        100,

      fieldSize:
        10 *
        1024 *
        1024,

      fileSize:
        100 *
        1024 *
        1024,
    },
  })

/*
|--------------------------------------------------------------------------
| Exercise Upload Middleware
|--------------------------------------------------------------------------
*/

const exerciseUploadMiddleware =
  (req, res, next) => {
    upload.fields([
      {
        name: "image",
        maxCount: 1,
      },

      {
        name: "video",
        maxCount: 1,
      },
    ])(
      req,
      res,
      (error) => {
        if (error) {
          /*
          |--------------------------------------------------------------------------
          | Multer Errors
          |--------------------------------------------------------------------------
          */

          if (
            error instanceof
            multer.MulterError
          ) {
            if (
              error.code ===
              "LIMIT_FILE_SIZE"
            ) {
              return res.status(
                400,
              ).json({
                success:
                  false,

                message:
                  "File is too large. Images and videos must be 100 MB or less.",
              })
            }

            if (
              error.code ===
              "LIMIT_FILE_COUNT"
            ) {
              return res.status(
                400,
              ).json({
                success:
                  false,

                message:
                  "You can upload a maximum of one image and one video.",
              })
            }

            if (
              error.code ===
              "LIMIT_UNEXPECTED_FILE"
            ) {
              return res.status(
                400,
              ).json({
                success:
                  false,

                message:
                  "Unexpected upload field. Please use the image and video upload controls.",
              })
            }

            return res.status(
              400,
            ).json({
              success:
                false,

              message:
                error.message ||
                "Unable to process uploaded file.",
            })
          }

          /*
          |--------------------------------------------------------------------------
          | File Type Errors
          |--------------------------------------------------------------------------
          */

          return res.status(
            400,
          ).json({
            success:
              false,

            message:
              error.message ||
              "Unable to upload file.",
          })
        }

        const image =
          req.files?.image?.[0]

        const video =
          req.files?.video?.[0]

        /*
        |--------------------------------------------------------------------------
        | Image Size
        |--------------------------------------------------------------------------
        */

        if (
          image &&
          image.size >
            10 *
              1024 *
              1024
        ) {
          return res.status(
            400,
          ).json({
            success:
              false,

            message:
              "Exercise images must be 10 MB or less.",
          })
        }

        /*
        |--------------------------------------------------------------------------
        | Video Size
        |--------------------------------------------------------------------------
        */

        if (
          video &&
          video.size >
            100 *
              1024 *
              1024
        ) {
          return res.status(
            400,
          ).json({
            success:
              false,

            message:
              "Exercise videos must be 100 MB or less.",
          })
        }

        next()
      },
    )
  }

/*
|--------------------------------------------------------------------------
| Export
|--------------------------------------------------------------------------
*/

export default exerciseUploadMiddleware