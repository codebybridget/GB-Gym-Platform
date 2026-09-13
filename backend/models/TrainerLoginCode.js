import mongoose from "mongoose"

const trainerLoginCodeSchema = new mongoose.Schema(
  {
    trainer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    codeHash: {
      type: String,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    attempts: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  },
)

trainerLoginCodeSchema.index(
  { expiresAt: 1 },
  { expireAfterSeconds: 0 },
)

export default mongoose.model(
  "TrainerLoginCode",
  trainerLoginCodeSchema,
)
