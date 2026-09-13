import nodemailer from "nodemailer"

const smtpHost = String(
  process.env.SMTP_HOST || "",
).trim()

/*
|--------------------------------------------------------------------------
| Platform SMTP
|--------------------------------------------------------------------------
|
| Gmail SSL uses port 465.
| Port 587 was timing out on the current network.
|
*/

const smtpPort = Number(
  process.env.SMTP_PORT || 465,
)

const smtpUser = String(
  process.env.SMTP_USER || "",
).trim()

const smtpPass = String(
  process.env.SMTP_PASS || "",
)

const mailFrom =
  String(
    process.env.MAIL_FROM ||
      smtpUser ||
      "no-reply@gb-platform.local",
  ).trim()

let platformTransporter = null
let platformEmailWarningShown = false

const customTransporters = new Map()

function getPlatformTransporter() {
  if (!smtpHost || !smtpUser || !smtpPass) {
    if (!platformEmailWarningShown) {
      console.warn(
        "GB email service is not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER and SMTP_PASS.",
      )

      platformEmailWarningShown = true
    }

    return null
  }

  if (!platformTransporter) {
    platformTransporter =
      nodemailer.createTransport({
        host: smtpHost,

        /*
         * Gmail SSL:
         * 465 = secure SMTP
         */
        port: smtpPort,

        secure:
          smtpPort === 465,

        /*
         * Prefer IPv4.
         * The previous trainer-login failure first
         * attempted Gmail through IPv6 and failed with
         * ENETUNREACH.
         */
        family: 4,

        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      })
  }

  return platformTransporter
}

const normalizeEmail = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()

const isValidEmail = (value) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    normalizeEmail(value),
  )

const getGymEmailSettings = (gym) => {
  if (!gym) {
    return null
  }

  return (
    gym.emailSettings || null
  )
}

const shouldUseGymEmail = ({
  gym,
  category,
}) => {
  const settings =
    getGymEmailSettings(gym)

  if (!settings) {
    return false
  }

  if (
    settings.enabled !== true ||
    settings.provider !== "smtp"
  ) {
    return false
  }

  if (category === "test") {
    return true
  }

  if (category === "trainer_otp") {
    return (
      settings.trainerOtpEnabled !==
      false
    )
  }

  if (
    category === "member" ||
    category === "workout"
  ) {
    return (
      settings.memberEmailsEnabled !==
      false
    )
  }

  if (
    category === "password_reset"
  ) {
    return (
      settings.passwordResetEmailsEnabled !==
      false
    )
  }

  return true
}

async function decryptGymSmtpPassword(
  encryptedPassword,
) {
  const value = String(
    encryptedPassword || "",
  ).trim()

  if (!value) {
    return ""
  }

  const {
    decryptPaymentSecret,
  } = await import(
    "../utils/paymentEncryption.js"
  )

  if (
    typeof decryptPaymentSecret !==
    "function"
  ) {
    throw new Error(
      "Payment encryption service does not provide decryptPaymentSecret.",
    )
  }

  return decryptPaymentSecret(value)
}

async function getGymTransporter(
  gym,
) {
  const settings =
    getGymEmailSettings(gym)

  if (!settings) {
    throw new Error(
      "Gym email settings are not configured.",
    )
  }

  if (
    settings.enabled !== true
  ) {
    throw new Error(
      "Gym email service is disabled.",
    )
  }

  if (
    settings.provider !== "smtp"
  ) {
    throw new Error(
      "Gym custom SMTP is not selected.",
    )
  }

  const host = String(
    settings.smtpHost || "",
  ).trim()

  const user = String(
    settings.smtpUser || "",
  ).trim()

  const port = Number(
    settings.smtpPort || 465,
  )

  if (!host) {
    throw new Error(
      "Gym SMTP host is not configured.",
    )
  }

  if (!user) {
    throw new Error(
      "Gym SMTP username is not configured.",
    )
  }

  if (
    !Number.isInteger(port) ||
    port < 1 ||
    port > 65535
  ) {
    throw new Error(
      "Gym SMTP port is invalid.",
    )
  }

  const password =
    await decryptGymSmtpPassword(
      settings.smtpPasswordEncrypted,
    )

  if (!password) {
    throw new Error(
      "Gym SMTP password is not configured.",
    )
  }

  const cacheKey = [
    String(gym._id || ""),
    host,
    port,
    user,
    Boolean(settings.smtpSecure),
  ].join("|")

  if (
    customTransporters.has(cacheKey)
  ) {
    return customTransporters.get(
      cacheKey,
    )
  }

  const transporter =
    nodemailer.createTransport({
      host,

      port,

      secure:
        settings.smtpSecure === true ||
        port === 465,

      family: 4,

      auth: {
        user,
        pass: password,
      },
    })

  customTransporters.set(
    cacheKey,
    transporter,
  )

  return transporter
}

function getGymFromEmailSettings(
  gym,
) {
  return (
    gym?.emailSettings || {}
  )
}

function getSender(
  gym,
) {
  const settings =
    getGymFromEmailSettings(gym)

  const senderEmail =
    normalizeEmail(
      settings.senderEmail,
    )

  const senderName =
    String(
      settings.senderName ||
        gym?.name ||
        "GB Gym",
    ).trim()

  if (senderEmail) {
    return `"${senderName.replace(
      /"/g,
      "",
    )}" <${senderEmail}>`
  }

  return (
    mailFrom ||
    `"${senderName.replace(
      /"/g,
      "",
    )}" <no-reply@gb-platform.local>`
  )
}

function getReplyTo(gym) {
  const settings =
    getGymFromEmailSettings(gym)

  const replyTo =
    normalizeEmail(
      settings.replyToEmail,
    )

  return isValidEmail(replyTo)
    ? replyTo
    : undefined
}

export async function sendEmail({
  to,
  subject,
  html,
  text,
  gym = null,
  category = "platform",
}) {
  if (!to) {
    return {
      sent: false,
      reason: "missing_recipient",
    }
  }

  const recipient =
    normalizeEmail(to)

  if (!isValidEmail(recipient)) {
    return {
      sent: false,
      reason: "invalid_recipient",
    }
  }

  /*
   * Use the gym's own SMTP configuration
   * when enabled.
   */

  if (
    shouldUseGymEmail({
      gym,
      category,
    })
  ) {
    try {
      const mailer =
        await getGymTransporter(
          gym,
        )

      await mailer.sendMail({
        from: getSender(gym),
        to: recipient,
        subject,
        text,
        html,
        replyTo:
          getReplyTo(gym),
      })

      return {
        sent: true,
        provider: "gym",
      }
    } catch (error) {
      console.error(
        "Gym SMTP email error:",
        error,
      )

      return {
        sent: false,
        reason: "gym_smtp_error",
        error:
          error.message ||
          "Unable to send email using gym SMTP.",
      }
    }
  }

  /*
   * Central platform SMTP.
   */

  const mailer =
    getPlatformTransporter()

  if (!mailer) {
    return {
      sent: false,
      reason: "smtp_not_configured",
    }
  }

  await mailer.sendMail({
    from: mailFrom,
    to: recipient,
    subject,
    text,
    html,
  })

  return {
    sent: true,
    provider: "platform",
  }
}

export function workoutCompletedEmail({
  firstName,
  programName,
  workoutDate,
}) {
  const safeName =
    firstName || "Member"

  const safeProgram =
    programName ||
    "today's workout"

  const dateText = workoutDate
    ? new Date(
        workoutDate,
      ).toLocaleDateString(
        "en-NG",
        {
          dateStyle: "full",
        },
      )
    : "today"

  return {
    subject:
      "GB Workout Completed",

    text: `Hi ${safeName},

Great job! You successfully completed ${safeProgram} on ${dateText}.

Keep up the consistency.

GB`,

    html: `
      <div style="font-family:Arial,sans-serif;background:#0a0a0a;color:#ffffff;padding:32px">
        <div style="max-width:560px;margin:auto;background:#151515;border-radius:20px;padding:28px">
          <div style="font-size:14px;font-weight:800;color:#a3ff00;letter-spacing:2px">GB</div>

          <h1 style="margin:16px 0 8px">
            Workout Completed 🎉
          </h1>

          <p style="color:#b8b8b8;line-height:1.7">
            Hi ${safeName},
          </p>

          <p style="color:#b8b8b8;line-height:1.7">
            Great job! You successfully completed
            <strong style="color:#ffffff">
              ${safeProgram}
            </strong>
            on ${dateText}.
          </p>

          <p style="color:#a3ff00;font-weight:800">
            Keep up the consistency.
          </p>
        </div>
      </div>
    `,
  }
}

export function workoutReminderEmail({
  firstName,
  programName,
  workoutDate,
}) {
  const safeName =
    firstName || "Member"

  const safeProgram =
    programName ||
    "your scheduled workout"

  const dateText = workoutDate
    ? new Date(
        workoutDate,
      ).toLocaleDateString(
        "en-NG",
        {
          dateStyle: "full",
        },
      )
    : "today"

  return {
    subject:
      "GB Workout Reminder",

    text: `Hi ${safeName},

You did not complete ${safeProgram} scheduled for ${dateText}.

Don't worry. Get back on track with your next GB session.

GB`,

    html: `
      <div style="font-family:Arial,sans-serif;background:#0a0a0a;color:#ffffff;padding:32px">
        <div style="max-width:560px;margin:auto;background:#151515;border-radius:20px;padding:28px">
          <div style="font-size:14px;font-weight:800;color:#a3ff00;letter-spacing:2px">GB</div>

          <h1 style="margin:16px 0 8px">
            Workout Reminder
          </h1>

          <p style="color:#b8b8b8;line-height:1.7">
            Hi ${safeName},
          </p>

          <p style="color:#b8b8b8;line-height:1.7">
            You did not complete
            <strong style="color:#ffffff">
              ${safeProgram}
            </strong>
            scheduled for ${dateText}.
          </p>

          <p style="color:#a3ff00;font-weight:800">
            Don't worry. Get back on track with your next session.
          </p>
        </div>
      </div>
    `,
  }
}

export function trainerLoginCodeEmail({
  firstName,
  code,
  gymName = "your gym",
  expiresInMinutes = 10,
}) {
  const safeName =
    firstName || "Trainer"

  const safeCode =
    code || "------"

  return {
    subject:
      "Your GB Trainer Login Code",

    text: `Hi ${safeName},

Your GB trainer login code is: ${safeCode}

This code expires in ${expiresInMinutes} minutes and can only be used once.

If you did not request this code, you can ignore this email.

GB`,

    html: `
      <div style="font-family:Arial,sans-serif;background:#0a0a0a;color:#ffffff;padding:32px">
        <div style="max-width:560px;margin:auto;background:#151515;border-radius:20px;padding:28px">
          <div style="font-size:14px;font-weight:800;color:#a3ff00;letter-spacing:2px">GB</div>

          <h1 style="margin:16px 0 8px">
            Trainer Login Code
          </h1>

          <p style="color:#b8b8b8;line-height:1.7">
            Hi ${safeName},
          </p>

          <p style="color:#b8b8b8;line-height:1.7">
            Use the verification code below to sign in to your GB trainer account at
            <strong style="color:#ffffff">
              ${gymName}
            </strong>.
          </p>

          <div style="margin:24px 0;padding:18px;text-align:center;border-radius:14px;background:#0a0a0a;border:1px solid #2b2b2b">
            <div style="font-size:34px;font-weight:900;letter-spacing:8px;color:#a3ff00">
              ${safeCode}
            </div>
          </div>

          <p style="color:#b8b8b8;line-height:1.7">
            This code expires in
            <strong style="color:#ffffff">
              ${expiresInMinutes} minutes
            </strong>
            and can only be used once.
          </p>

          <p style="color:#777;line-height:1.7;font-size:13px">
            If you did not request this code, you can safely ignore this email.
          </p>
        </div>
      </div>
    `,
  }
}

export function passwordResetEmail({
  firstName,
  token,
  role = "member",
}) {
  const safeName =
    firstName || "GB User"

  const clientUrl =
    process.env.CLIENT_URL ||
    process.env.FRONTEND_URL ||
    "http://localhost:5173"

  const resetUrl =
    `${clientUrl.replace(
      /\/$/,
      "",
    )}/reset-password?token=${encodeURIComponent(
      token,
    )}&role=${encodeURIComponent(
      role,
    )}`

  return {
    subject:
      "Reset your GB Gym Platform password",

    text: `Hi ${safeName},

Use this link to reset your GB password: ${resetUrl}

This link expires in 30 minutes. If you did not request a password reset, you can ignore this email.

GB`,

    html: `
      <div style="font-family:Arial,sans-serif;background:#0a0a0a;color:#ffffff;padding:32px">
        <div style="max-width:560px;margin:auto;background:#151515;border-radius:20px;padding:28px">
          <div style="font-size:14px;font-weight:800;color:#a3ff00;letter-spacing:2px">
            GB
          </div>

          <h1 style="margin:16px 0 8px">
            Reset your password
          </h1>

          <p style="color:#b8b8b8;line-height:1.7">
            Hi ${safeName},
          </p>

          <p style="color:#b8b8b8;line-height:1.7">
            We received a request to reset your GB ${role} password.
          </p>

          <p>
            <a
              href="${resetUrl}"
              style="display:inline-block;background:#a3ff00;color:#071008;text-decoration:none;font-weight:800;padding:14px 20px;border-radius:12px"
            >
              Reset Password
            </a>
          </p>

          <p style="color:#777;line-height:1.7;font-size:13px">
            This link expires in 30 minutes. If you did not request this, you can safely ignore this email.
          </p>
        </div>
      </div>
    `,
  }
}