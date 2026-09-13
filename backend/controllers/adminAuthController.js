import User from "../models/User.js"

/*
|--------------------------------------------------------------------------
| Create First Admin
|--------------------------------------------------------------------------
|
| This endpoint is intended only for initial application setup.
|
| IMPORTANT:
| Once an admin exists, this endpoint cannot be used to promote another
| account to admin.
|
|--------------------------------------------------------------------------
*/

const createFirstAdmin = async (
  req,
  res,
) => {
  try {
    const {
      setupKey,
      firstName,
      lastName,
      email,
      password,
      phone,
    } = req.body

    /*
    |--------------------------------------------------------------------------
    | Verify setup key
    |--------------------------------------------------------------------------
    */

    if (
      !process.env.ADMIN_SETUP_KEY
    ) {
      return res.status(500).json({
        success: false,
        message:
          "ADMIN_SETUP_KEY is not configured.",
      })
    }

    if (
      !setupKey ||
      setupKey !==
        process.env.ADMIN_SETUP_KEY
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Invalid admin setup key.",
      })
    }

    /*
    |--------------------------------------------------------------------------
    | Check whether an admin already exists
    |--------------------------------------------------------------------------
    */

    const existingAdmin =
      await User.findOne({
        role: "admin",
      })

    if (existingAdmin) {
      return res.status(409).json({
        success: false,
        message:
          "An admin account already exists. Use the admin management system to create additional administrators.",
      })
    }

    /*
    |--------------------------------------------------------------------------
    | Validate required fields
    |--------------------------------------------------------------------------
    */

    if (
      !firstName?.trim() ||
      !lastName?.trim() ||
      !email?.trim() ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message:
          "First name, last name, email and password are required.",
      })
    }

    /*
    |--------------------------------------------------------------------------
    | Password validation
    |--------------------------------------------------------------------------
    */

    if (
      password.length < 8
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Admin password must be at least 8 characters.",
      })
    }

    /*
    |--------------------------------------------------------------------------
    | Normalize email
    |--------------------------------------------------------------------------
    */

    const normalizedEmail =
      email
        .trim()
        .toLowerCase()

    /*
    |--------------------------------------------------------------------------
    | Check existing account
    |--------------------------------------------------------------------------
    */

    const existingUser =
      await User.findOne({
        email:
          normalizedEmail,
      })

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message:
          "An account with this email already exists. The first-admin setup cannot promote an existing account.",
      })
    }

    /*
    |--------------------------------------------------------------------------
    | Create first admin
    |--------------------------------------------------------------------------
    */

    const admin =
      await User.create({
        firstName:
          firstName.trim(),

        lastName:
          lastName.trim(),

        email:
          normalizedEmail,

        password,

        phone:
          phone?.trim() || "",

        role: "admin",

        emailVerified: true,

        isActive: true,
      })

    /*
    |--------------------------------------------------------------------------
    | Response
    |--------------------------------------------------------------------------
    */

    return res.status(201).json({
      success: true,

      message:
        "First admin account created successfully.",

      admin: {
        id:
          admin._id,

        firstName:
          admin.firstName,

        lastName:
          admin.lastName,

        email:
          admin.email,

        role:
          admin.role,

        isActive:
          admin.isActive,
      },
    })
  } catch (error) {
    console.error(
      "Create first admin error:",
      error,
    )

    if (
      error.code === 11000
    ) {
      return res.status(409).json({
        success: false,
        message:
          "An account with this email already exists.",
      })
    }

    if (
      error.name ===
      "ValidationError"
    ) {
      return res.status(400).json({
        success: false,
        message:
          error.message ||
          "Invalid admin account data.",
      })
    }

    return res.status(500).json({
      success: false,
      message:
        "Unable to create first admin account.",
    })
  }
}

export {
  createFirstAdmin,
}