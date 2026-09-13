import "dotenv/config"
import mongoose from "mongoose"
import readline from "node:readline"
import User from "../models/User.js"

const ask = (question, hidden = false) =>
  new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: true,
    })

    if (hidden && process.stdin.isTTY) {
      process.stdout.write(question)
      const stdin = process.stdin
      const onData = (char) => {
        char = char.toString()
        if (char === "\n" || char === "\r" || char === "\u0004") {
          stdin.setRawMode?.(false)
          stdin.off("data", onData)
          rl.close()
          process.stdout.write("\n")
          resolve(buffer)
        } else if (char === "\u0003") {
          stdin.setRawMode?.(false)
          stdin.off("data", onData)
          rl.close()
          process.stdout.write("\n")
          resolve("")
        } else {
          buffer += char
        }
      }
      let buffer = ""
      stdin.setRawMode?.(true)
      stdin.on("data", onData)
      return
    }

    rl.question(question, (answer) => {
      rl.close()
      resolve(answer)
    })
  })

async function main() {
  const mongoUri = process.env.MONGO_URI?.trim()

  if (!mongoUri) {
    throw new Error(
      "MONGO_URI was not loaded. Expected backend/.env at " +
      `${process.cwd()}\\.env`
    )
  }

  const emailInput =
    process.env.PLATFORM_OWNER_EMAIL?.trim() ||
    await ask("Platform Owner email: ")

  const password =
    await ask("New Platform Owner password: ", true)

  if (!emailInput || !password) {
    throw new Error("Email and password are required.")
  }

  await mongoose.connect(mongoUri)

  const email = emailInput.toLowerCase()
  const user = await User.findOne({ email }).select("+password")

  if (!user) {
    throw new Error(`No user was found for ${email}.`)
  }

  user.password = password
  user.role = "platform_owner"
  user.gym = null
  user.isActive = true
  user.emailVerified = true

  await user.save()

  const verifyUser = await User.findOne({ email }).select("+password")
  const matches = await verifyUser.comparePassword(password)

  if (!matches) {
    throw new Error("Password was saved but verification failed.")
  }

  console.log(`Platform Owner password updated successfully for ${email}.`)
  console.log("Password hash verification: PASSED")
  console.log("Now use the normal GB /login page.")
}

main()
  .catch((error) => {
    console.error("Password reset failed:", error.message)
    process.exitCode = 1
  })
  .finally(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect()
    }
  })
