import mongoose from "mongoose"
import bcrypt from "bcryptjs"
import dotenv from "dotenv"

dotenv.config()

const MEMBER_EMAIL =
  "adeyeyebridget2@gmail.com"

const NEW_PASSWORD =
  "GBmember2026!"

const resetMemberPassword =
  async () => {
    try {
      if (!process.env.MONGO_URI) {
        throw new Error(
          "MONGO_URI is missing from .env",
        )
      }

      /*
      |--------------------------------------------------------------------------
      | Connect to MongoDB
      |--------------------------------------------------------------------------
      */

      const connection =
        await mongoose.connect(
          process.env.MONGO_URI,
        )

      console.log(
        `Connected to MongoDB database: ${connection.connection.name}`,
      )

      /*
      |--------------------------------------------------------------------------
      | Get users collection
      |--------------------------------------------------------------------------
      */

      const usersCollection =
        mongoose.connection.db.collection(
          "users",
        )

      /*
      |--------------------------------------------------------------------------
      | Find member
      |--------------------------------------------------------------------------
      */

      const member =
        await usersCollection.findOne({
          email:
            MEMBER_EMAIL,
        })

      if (!member) {
        console.log("")
        console.log(
          "Member was not found.",
        )
        console.log(
          `Email searched: ${MEMBER_EMAIL}`,
        )

        return
      }

      console.log("")
      console.log(
        "Member found:",
      )
      console.log(
        `Name: ${member.firstName || ""} ${member.lastName || ""}`,
      )
      console.log(
        `Email: ${member.email}`,
      )
      console.log(
        `Role: ${member.role}`,
      )

      /*
      |--------------------------------------------------------------------------
      | Hash new password
      |--------------------------------------------------------------------------
      */

      const hashedPassword =
        await bcrypt.hash(
          NEW_PASSWORD,
          12,
        )

      /*
      |--------------------------------------------------------------------------
      | Update password
      |--------------------------------------------------------------------------
      */

      const result =
        await usersCollection.updateOne(
          {
            _id:
              member._id,
          },
          {
            $set: {
              password:
                hashedPassword,
            },
          },
        )

      if (
        result.modifiedCount !== 1
      ) {
        console.log("")
        console.log(
          "Password was not changed.",
        )

        return
      }

      console.log("")
      console.log(
        "======================================",
      )
      console.log(
        "PASSWORD RESET SUCCESSFUL",
      )
      console.log(
        "======================================",
      )

      console.log(
        `Email: ${MEMBER_EMAIL}`,
      )

      console.log(
        `New password: ${NEW_PASSWORD}`,
      )

      console.log("")
      console.log(
        "You can now log in with these credentials.",
      )
    } catch (error) {
      console.error("")
      console.error(
        "PASSWORD RESET FAILED:",
      )
      console.error(error)
    } finally {
      await mongoose.disconnect()
    }
  }

resetMemberPassword()