import mongoose from "mongoose"

const gymSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
    },

    phone: {
      type: String,
      trim: true,
      default: "",
    },

    address: {
      type: String,
      trim: true,
      default: "",
    },

    city: {
      type: String,
      trim: true,
      default: "",
    },

    state: {
      type: String,
      trim: true,
      default: "",
    },

    country: {
      type: String,
      trim: true,
      default: "Nigeria",
    },

    logoUrl: {
      type: String,
      trim: true,
      default: "",
    },

    socialMedia: {
      instagram: { type: String, default: "" },
      facebook: { type: String, default: "" },
      tiktok: { type: String, default: "" },
      youtube: { type: String, default: "" },
      x: { type: String, default: "" },
      whatsapp: { type: String, default: "" },
      website: { type: String, default: "" },
    },

    branding: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    settings: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    emailSettings: {
      enabled: {
        type: Boolean,
        default: false,
      },

      provider: {
        type: String,
        enum: ["platform", "smtp"],
        default: "platform",
      },

      senderName: {
        type: String,
        trim: true,
        default: "",
      },

      senderEmail: {
        type: String,
        trim: true,
        lowercase: true,
        default: "",
      },

      replyToEmail: {
        type: String,
        trim: true,
        lowercase: true,
        default: "",
      },

      smtpHost: {
        type: String,
        trim: true,
        default: "",
      },

      smtpPort: {
        type: Number,
        default: 587,
      },

      smtpUser: {
        type: String,
        trim: true,
        default: "",
      },

      smtpPasswordEncrypted: {
        type: String,
        default: "",
      },

      smtpSecure: {
        type: Boolean,
        default: false,
      },

      trainerOtpEnabled: {
        type: Boolean,
        default: true,
      },

      memberEmailsEnabled: {
        type: Boolean,
        default: true,
      },

      passwordResetEmailsEnabled: {
        type: Boolean,
        default: true,
      },

      configuredAt: {
        type: Date,
        default: null,
      },

      lastTestedAt: {
        type: Date,
        default: null,
      },
    },

    paymentSettings: {
      provider: {
        type: String,
        enum: ["paystack", "none"],
        default: "none",
      },

      enabled: {
        type: Boolean,
        default: false,
      },

      publicKey: {
        type: String,
        trim: true,
        default: "",
      },

      secretKeyEncrypted: {
        type: String,
        default: "",
      },

      testMode: {
        type: Boolean,
        default: true,
      },

      connectedAt: {
        type: Date,
        default: null,
      },

      lastVerifiedAt: {
        type: Date,
        default: null,
      },
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  },
)

export default mongoose.model("Gym", gymSchema)