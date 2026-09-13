import "dotenv/config"
import mongoose from "mongoose"

const run = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is not configured.")
    }

    await mongoose.connect(process.env.MONGO_URI)
    console.log(`Connected to MongoDB: ${mongoose.connection.host}`)

    const users = mongoose.connection.collection("users")
    const indexes = await users.indexes()

    const oldGlobalEmailIndex = indexes.find(
      (index) => index.name === "email_1",
    )

    if (oldGlobalEmailIndex) {
      await users.dropIndex("email_1")
      console.log("Removed old global email index: email_1")
    } else {
      console.log("Global email index email_1 was not found.")
    }

    const existingGymEmailIndex = (
      await users.indexes()
    ).find((index) => index.name === "gym_email_unique")

    if (!existingGymEmailIndex) {
      await users.createIndex(
        { gym: 1, email: 1 },
        {
          unique: true,
          name: "gym_email_unique",
          partialFilterExpression: {
            gym: { $type: "objectId" },
            email: { $type: "string" },
          },
        },
      )

      console.log("Created gym_email_unique.")
    } else {
      console.log("gym_email_unique already exists.")
    }

    console.log("")
    console.log("Current User indexes:")
    console.table(await users.indexes())
    console.log("")
    console.log("User email index migration completed successfully.")
  } catch (error) {
    console.error("User email index migration failed:", error)
    process.exitCode = 1
  } finally {
    await mongoose.connection.close().catch(() => {})
  }
}

run()
