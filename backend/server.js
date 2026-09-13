import dotenv from "dotenv"

dotenv.config()

/*
 * Load environment variables before importing any application module
 * that reads process.env at module initialization.
 */

const { default: express } = await import("express")
const { default: cors } = await import("cors")
const { default: helmet } = await import("helmet")
const { default: rateLimit } = await import("express-rate-limit")
const { default: path } = await import("path")
const { fileURLToPath } = await import("url")

const { default: connectDB } = await import("./config/db.js")

const { default: authRoutes } = await import("./routes/authRoutes.js")
const { default: passwordResetRoutes } = await import("./routes/passwordResetRoutes.js")
const { default: paymentRoutes } = await import("./routes/paymentRoutes.js")
const { default: adminAuthRoutes } = await import("./routes/adminAuthRoutes.js")
const { default: adminRoutes } = await import("./routes/adminRoutes.js")
const { default: dashboardRoutes } = await import("./routes/dashboardRoutes.js")
const { default: trainerRoutes } = await import("./routes/trainerRoutes.js")
const { default: trainerAssignmentRoutes } = await import("./routes/trainerAssignmentRoutes.js")
const { default: exerciseRoutes } = await import("./routes/exerciseRoutes.js")
const { default: programRoutes } = await import("./routes/programRoutes.js")
const { default: profileRoutes } = await import("./routes/profileRoutes.js")
const { default: paymentVerificationRoutes } = await import("./routes/paymentVerificationRoutes.js")
const { default: emergencyContactRoutes } = await import("./routes/emergencyContactRoutes.js")
const { default: programAssignmentRoutes } = await import("./routes/programAssignmentRoutes.js")
const { default: workoutRoutes } = await import("./routes/workoutRoutes.js")
const { default: workoutLogRoutes } = await import("./routes/workoutLogRoutes.js")
const { default: classScheduleRoutes } = await import("./routes/classScheduleRoutes.js")
const { default: membershipRoutes } = await import("./routes/membershipRoutes.js")
const { default: subscriptionRoutes } = await import("./routes/subscriptionRoutes.js")
const { default: notificationRoutes } = await import("./routes/notificationRoutes.js")
const { default: revenueRoutes } = await import("./routes/revenueRoutes.js")
const { default: gymRoutes } = await import("./routes/gymRoutes.js")
const { default: platformRoutes } = await import("./routes/platformRoutes.js")
const { default: platformPaymentRoutes } = await import("./routes/platformPaymentRoutes.js")
const { default: gymSubscriptionRoutes } = await import("./routes/gymSubscriptionRoutes.js")
const { default: workoutTemplateRoutes } = await import("./routes/workoutTemplateRoutes.js")
const { default: attendanceRoutes } = await import("./routes/attendanceRoutes.js")

const { startWorkoutNotificationJobs } = await import(
  "./services/workoutNotificationService.js"
)

const { protect } = await import("./middleware/authMiddleware.js")
const { default: requireActiveSubscription } = await import(
  "./middleware/requireActiveSubscription.js"
)

const app = express()

const PORT =
  process.env.PORT || 5000

const allowedOrigins = [
  "http://localhost:5173",
  process.env.CLIENT_URL,
  process.env.FRONTEND_URL,
  "https://localhost:5173",
].filter(Boolean).filter((value, index, values) => values.indexOf(value) === index)


/*
|--------------------------------------------------------------------------
| File / Directory Setup
|--------------------------------------------------------------------------
*/

const __filename =
  fileURLToPath(
    import.meta.url,
  )

const __dirname =
  path.dirname(
    __filename,
  )

/*
|--------------------------------------------------------------------------
| Security
|--------------------------------------------------------------------------
*/

app.use(
  helmet({
    crossOriginResourcePolicy: {
      policy: "cross-origin",
    },
  }),
)

/*
|--------------------------------------------------------------------------
| CORS
|--------------------------------------------------------------------------
|
| Production frontend:
| https://localhost:5173
|
| Local development:
| http://localhost:5173
|
*/

app.use(
  cors({
    credentials: true,
    origin: (origin, callback) => {
      /*
       * Allow requests that do not have an Origin header.
       * This includes some server-to-server requests,
       * health checks and direct API requests.
       */
      if (!origin) {
        return callback(null, true)
      }

      if (
        allowedOrigins.includes(origin)
      ) {
        return callback(null, true)
      }

      return callback(
        new Error(
          `CORS blocked origin: ${origin}`,
        ),
      )
    },

    methods: [
      "GET",
      "POST",
      "PUT",
      "PATCH",
      "DELETE",
      "OPTIONS",
    ],

    allowedHeaders: [
      "Content-Type",
      "Authorization",
    ],
  }),
)

/*
|--------------------------------------------------------------------------
| Body Parsing
|--------------------------------------------------------------------------
*/

app.use(
  express.json({
    limit: "1mb",
  }),
)

app.use(
  express.urlencoded({
    extended: true,
    limit: "1mb",
  }),
)


/*
|--------------------------------------------------------------------------
| Uploaded Media
|--------------------------------------------------------------------------
*/

app.use(
  "/uploads",
  express.static(
    path.resolve(
      "uploads",
    ),
    {
      setHeaders: (
        response,
        filePath,
      ) => {
        const requestOrigin = response.req?.headers?.origin
        if (requestOrigin && allowedOrigins.includes(requestOrigin)) {
          response.setHeader("Access-Control-Allow-Origin", requestOrigin)
        } else {
          response.setHeader("Access-Control-Allow-Origin", allowedOrigins[0] || "http://localhost:5173")
        }

        response.setHeader(
          "Cross-Origin-Resource-Policy",
          "cross-origin",
        )

        if (
          /\.(mp4|webm|mov|avi|mpeg)$/i.test(
            filePath,
          )
        ) {
          response.setHeader(
            "Accept-Ranges",
            "bytes",
          )
        }
      },
    },
  ),
)

/*
|--------------------------------------------------------------------------
| API Rate Limiting
|--------------------------------------------------------------------------
*/

const apiLimiter =
  rateLimit({
    windowMs:
      15 * 60 * 1000,

    max: 300,

    standardHeaders: true,

    legacyHeaders: false,
  })

app.use(
  "/api",
  apiLimiter,
)

/*
|--------------------------------------------------------------------------
| Health
|--------------------------------------------------------------------------
*/

app.get(
  "/",
  (req, res) => {
    return res.status(200).json({
      success: true,

      message:
        "GB Gym Platform API is running.",
    })
  },
)

app.get(
  "/api/health",
  (req, res) => {
    return res.status(200).json({
      success: true,

      message:
        "GB Gym Platform API is healthy.",
    })
  },
)

/*
|--------------------------------------------------------------------------
| Authentication
|--------------------------------------------------------------------------
*/

app.use("/api/gyms", gymRoutes)
app.use("/api/attendance", attendanceRoutes)
app.use("/api/platform", platformRoutes)
app.use("/api/platform-payment", platformPaymentRoutes)

app.use(
  "/api/auth",
  authRoutes,
)
app.use("/api/password-reset", passwordResetRoutes)

app.use(
  "/api/payments",
  paymentRoutes,
)
app.use("/api/subscriptions", gymSubscriptionRoutes)
app.use("/api/subscriptions", subscriptionRoutes)
app.use(
  "/api/payment-verification",
  paymentVerificationRoutes,
)

app.use(
  "/api/admin-auth",
  adminAuthRoutes,
)

/*
|--------------------------------------------------------------------------
| Admin
|--------------------------------------------------------------------------
*/

app.use(
  "/api/admin",
  adminRoutes,
)

app.use(
  "/api/revenue",
  revenueRoutes,
)

app.use(
  "/api/dashboard",
  protect,
  requireActiveSubscription,
  dashboardRoutes,
)

/*
|--------------------------------------------------------------------------
| Trainer
|--------------------------------------------------------------------------
*/

app.use(
  "/api/trainer",
  trainerRoutes,
)

app.use(
  "/api/trainer-assignments",
  trainerAssignmentRoutes,
)

/*
|--------------------------------------------------------------------------
| Exercises
|--------------------------------------------------------------------------
*/

app.use(
  "/api/exercises",
  protect,
  requireActiveSubscription,
  exerciseRoutes,
)

/*
|--------------------------------------------------------------------------
| Programs
|--------------------------------------------------------------------------
*/

app.use(
  "/api/programs",
  protect,
  requireActiveSubscription,
  programRoutes,
)

/*
|--------------------------------------------------------------------------
| Profile
|--------------------------------------------------------------------------
*/

app.use(
  "/api/profile",
  protect,
  requireActiveSubscription,
  profileRoutes,
)

app.use(
  "/api/membership",
  membershipRoutes,
)

/*
|--------------------------------------------------------------------------
| Emergency Contacts
|--------------------------------------------------------------------------
*/

app.use(
  "/api/emergency-contacts",
  protect,
  requireActiveSubscription,
  emergencyContactRoutes,
)

/*
|--------------------------------------------------------------------------
| Program Assignments
|--------------------------------------------------------------------------
*/

app.use(
  "/api/program-assignments",
  protect,
  requireActiveSubscription,
  programAssignmentRoutes,
)

/*
|--------------------------------------------------------------------------
| Workouts
|--------------------------------------------------------------------------
*/

app.use("/api/workouts", workoutTemplateRoutes)
app.use("/api/member-workouts", protect, requireActiveSubscription, workoutRoutes)

/*
|--------------------------------------------------------------------------
| Workout Logs
|--------------------------------------------------------------------------
*/

app.use(
  "/api/workout-logs",
  protect,
  requireActiveSubscription,
  workoutLogRoutes,
)

/*
|--------------------------------------------------------------------------
| Weekly Class Schedule
|--------------------------------------------------------------------------
*/

app.use("/api/class-schedule", protect, requireActiveSubscription, classScheduleRoutes)
app.use("/api/class-schedules", protect, requireActiveSubscription, classScheduleRoutes)

/*
|--------------------------------------------------------------------------
| Notifications
|--------------------------------------------------------------------------
*/

app.use(
  "/api/notifications",
  protect,
  requireActiveSubscription,
  notificationRoutes,
)

/*
|--------------------------------------------------------------------------
| 404
|--------------------------------------------------------------------------
*/

app.use(
  (req, res) => {
    return res.status(404).json({
      success: false,

      message:
        "API route not found.",
    })
  },
)

/*
|--------------------------------------------------------------------------
| Error Handler
|--------------------------------------------------------------------------
*/

app.use(
  (
    error,
    req,
    res,
    next,
  ) => {
    console.error(
      "Server error:",
      error,
    )

    /*
    |--------------------------------------------------------------------------
    | CORS Errors
    |--------------------------------------------------------------------------
    */

    if (
      error?.message?.startsWith(
        "CORS blocked origin:",
      )
    ) {
      return res.status(403).json({
        success: false,

        message:
          "CORS policy blocked this request.",
      })
    }

    /*
    |--------------------------------------------------------------------------
    | Multer Errors
    |--------------------------------------------------------------------------
    */

    if (
      error?.name ===
      "MulterError"
    ) {
      if (
        error.code ===
        "LIMIT_FILE_SIZE"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Uploaded file is too large. Images must be 5 MB or less and videos must be 50 MB or less.",
        })
      }

      if (
        error.code ===
        "LIMIT_FILE_COUNT"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Too many files were uploaded.",
        })
      }

      if (
        error.code ===
        "LIMIT_UNEXPECTED_FILE"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Unexpected upload field. Please use the exercise image and video upload controls.",
        })
      }

      return res.status(400).json({
        success: false,
        message:
          error.message ||
          "Unable to process uploaded file.",
      })
    }

    /*
    |--------------------------------------------------------------------------
    | General Upload / File Errors
    |--------------------------------------------------------------------------
    */

    if (
      error?.message
        ?.toLowerCase?.()
        .includes(
          "invalid image",
        )
    ) {
      return res.status(400).json({
        success: false,
        message:
          error.message,
      })
    }

    if (
      error?.message
        ?.toLowerCase?.()
        .includes(
          "invalid video",
        )
    ) {
      return res.status(400).json({
        success: false,
        message:
          error.message,
      })
    }

    return res.status(
      error.status || 500,
    ).json({
      success: false,

      message:
        error.message ||
        "Internal server error.",
    })
  },
)

/*
|--------------------------------------------------------------------------
| Start Server
|--------------------------------------------------------------------------
*/

const startServer =
  async () => {
    try {
      await connectDB()

      /*
      |--------------------------------------------------------------------------
      | Workout Notification Jobs
      |--------------------------------------------------------------------------
      */

      startWorkoutNotificationJobs()

      app.listen(
        PORT,
        () => {
          console.log(
            `GB Gym Platform API running on port ${PORT}`,
          )

          console.log(
            `GB uploads available at /uploads`,
          )

          console.log(
            "Allowed CORS origins:",
            allowedOrigins,
          )
        },
      )
    } catch (error) {
      console.error(
        "Unable to start GB Gym Platform API:",
        error,
      )

      process.exit(1)
    }
  }

startServer()