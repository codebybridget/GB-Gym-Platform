import mongoose from "mongoose"

const connectDB = async () => {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is missing from the .env file")
  }

  try {
    const connection = await mongoose.connect(process.env.MONGO_URI)

    console.log(`MongoDB connected: ${connection.connection.host}`)
    console.log(`MongoDB database: ${connection.connection.name}`)

    return connection
  } catch (error) {
    console.error("MongoDB connection failed:", error.message)
    throw error
  }
}

export default connectDB
