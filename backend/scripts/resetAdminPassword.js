import dotenv from "dotenv"
import mongoose from "mongoose"
import User from "../models/User.js"

dotenv.config()

const email = process.argv[2]
const newPassword = process.argv[3]

if (!email || !newPassword) {
  console.error(
    "Usage: node scripts/resetAdminPassword.js EMAIL NEW_PASSWORD",
  )

  process.exit(1)
}

if (newPassword.length < 8) {
  console.error(
    "Admin password must be at least 8 characters.",
  )

  process.exit(1)
}

const resetAdminPassword =
  async () => {
    try {
      await mongoose.connect(
        process.env.MONGO_URI,
      )

      console.log(
        "Connected to MongoDB.",
      )

      const normalizedEmail =
        email
          .trim()
          .toLowerCase()

      const admin =
        await User.findOne({
          email:
            normalizedEmail,
          role: "admin",
        }).select("+password")

      if (!admin) {
        console.error(
          "Admin account not found.",
        )

        await mongoose.disconnect()

        process.exit(1)
      }

      /*
      |--------------------------------------------------------------------------
      | Set the new password
      |--------------------------------------------------------------------------
      |
      | User.pre("save") in User.js will automatically hash this password.
      |
      */

      admin.password =
        newPassword

      admin.isActive = true
      admin.emailVerified = true

      await admin.save()

      console.log("")
      console.log(
        "================================",
      )
      console.log(
        "ADMIN PASSWORD RESET SUCCESSFUL",
      )
      console.log(
        "================================",
      )
      console.log(
        `Email: ${admin.email}`,
      )
      console.log(
        "Password: successfully updated",
      )
      console.log(
        "Role: admin",
      )
      console.log(
        "Active: true",
      )
      console.log(
        "================================",
      )
      console.log("")

      await mongoose.disconnect()

      process.exit(0)
    } catch (error) {
      console.error(
        "Password reset failed:",
        error,
      )

      await mongoose.disconnect()

      process.exit(1)
    }
  }

resetAdminPassword()