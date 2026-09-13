import dotenv from "dotenv"
dotenv.config()
import connectDB from "../config/db.js"
import User from "../models/User.js"

const run = async () => {
  await connectDB()
  const email = String(process.env.PLATFORM_OWNER_EMAIL || "").trim().toLowerCase()
  const password = process.env.PLATFORM_OWNER_PASSWORD
  const firstName = process.env.PLATFORM_OWNER_FIRST_NAME || "GB"
  const lastName = process.env.PLATFORM_OWNER_LAST_NAME || "Platform Owner"
  if (!email || !password) throw new Error("Set PLATFORM_OWNER_EMAIL and PLATFORM_OWNER_PASSWORD before running this script.")
  let user = await User.findOne({ email }).select("+password")
  if (user) {
    user.role = "platform_owner"; user.gym = null; user.isActive = true; user.emailVerified = true; user.password = password; await user.save()
    console.log("GB Platform Owner updated:", email)
  } else {
    await User.create({ firstName, lastName, email, password, role: "platform_owner", gym: null, isActive: true, emailVerified: true })
    console.log("GB Platform Owner created:", email)
  }
  process.exit(0)
}
run().catch((error) => { console.error("Unable to seed GB Platform Owner:", error); process.exit(1) })
