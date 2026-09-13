import multer from "multer"

/*
|--------------------------------------------------------------------------
| Gym Logo Upload
|--------------------------------------------------------------------------
|
| Gym logos are uploaded directly to Cloudinary.
|
| We therefore keep the uploaded image in memory instead of writing
| it to the local filesystem.
|
|--------------------------------------------------------------------------
*/

const storage =
  multer.memoryStorage()

/*
|--------------------------------------------------------------------------
| File Validation
|--------------------------------------------------------------------------
*/

const fileFilter =
  (
    req,
    file,
    cb,
  ) => {
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
        "Only JPG, PNG, WEBP and GIF images are allowed for gym logos.",
      ),
      false,
    )
  }

/*
|--------------------------------------------------------------------------
| Gym Logo Upload Middleware
|--------------------------------------------------------------------------
*/

const gymLogoUpload =
  multer({
    storage,

    fileFilter,

    limits: {
      fileSize:
        5 *
        1024 *
        1024,
    },
  })

export {
  gymLogoUpload,
}