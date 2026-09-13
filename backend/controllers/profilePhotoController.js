import User from "../models/User.js"
import cloudinary from "../config/cloudinary.js"

const uploadProfilePhoto = async (
  req,
  res,
) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please select a profile photo.",
      })
    }

    if (!req.file.mimetype?.startsWith("image/")) {
      return res.status(400).json({
        success: false,
        message: "Only image files are allowed.",
      })
    }

    if (req.file.size > 5 * 1024 * 1024) {
      return res.status(400).json({
        success: false,
        message: "Profile photo must be 5 MB or smaller.",
      })
    }

    const user = await User.findById(req.user._id)

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Profile not found.",
      })
    }

    const uploadResult = await new Promise(
      (resolve, reject) => {
        const stream =
          cloudinary.uploader.upload_stream(
            {
              folder: "gb-gym/profile-photos",
              resource_type: "image",
              use_filename: false,
              unique_filename: true,
              overwrite: false,
            },
            (error, result) => {
              if (error) {
                reject(error)
                return
              }

              resolve(result)
            },
          )

        stream.end(req.file.buffer)
      },
    )

    if (!uploadResult?.secure_url) {
      return res.status(500).json({
        success: false,
        message:
          "Cloudinary did not return a profile photo URL.",
      })
    }

    user.profilePhoto =
      uploadResult.secure_url

    await user.save()

    const updatedUser =
      await User.findById(user._id)
        .select("-password")

    return res.status(200).json({
      success: true,
      message:
        "Profile photo uploaded successfully.",
      profilePhoto:
        updatedUser.profilePhoto,
      user: updatedUser,
    })
  } catch (error) {
    console.error(
      "Upload profile photo error:",
      error,
    )

    return res.status(500).json({
      success: false,
      message:
        error?.message ||
        "Unable to upload profile photo.",
    })
  }
}

export {
  uploadProfilePhoto,
}