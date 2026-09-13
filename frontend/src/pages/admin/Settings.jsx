import { useEffect, useMemo, useRef, useState } from "react"
import QRCode from "qrcode"
import {
  Bell,
  Check,
  Clock3,
  Dumbbell,
  Globe2,
  ImagePlus,
  Link2,
  Download,
  Printer,
  Save,
  ShieldCheck,
  UserRound,
  CreditCard,
  Eye,
  EyeOff,
  X,
  Mail,
} from "lucide-react"
import PageHeader from "../../components/PageHeader"
import { gyms } from "../../api/api"
import { useGym } from "../../context/GymContext"

const TIMEZONES = [
  ["Africa/Lagos", "Africa/Lagos — Nigeria"],
  ["Africa/Accra", "Africa/Accra — Ghana"],
  ["Africa/Nairobi", "Africa/Nairobi — Kenya"],
  ["Europe/London", "Europe/London — United Kingdom"],
  ["America/New_York", "America/New_York — Eastern Time"],
]

const defaults = {
  timezone: "Africa/Lagos",
  workoutDurationMinutes: 60,
  restBetweenSetsSeconds: 60,
  notifications: {
    email: true,
    workoutReminders: true,
    progressAlerts: true,
    newMemberAlerts: true,
  },
  security: {
    requireConfirmation: true,
    automaticLogout: false,
    automaticLogoutMinutes: 60,
  },
}

const readSettings = (value = {}) => ({
  ...defaults,
  ...value,
  notifications: {
    ...defaults.notifications,
    ...(value.notifications || {}),
  },
  security: {
    ...defaults.security,
    ...(value.security || {}),
  },
})

function Section({
  icon: Icon,
  eyebrow,
  title,
  description,
  children,
}) {
  return (
    <section
      className="settings-section"
      style={styles.section}
    >
      <div
        className="settings-section-head"
        style={styles.sectionHead}
      >
        <div style={styles.sectionIcon}>
          <Icon size={20} strokeWidth={2} />
        </div>

        <div style={styles.sectionTitleWrap}>
          <div style={styles.eyebrow}>
            {eyebrow}
          </div>

          <h2 style={styles.sectionTitle}>
            {title}
          </h2>

          <p style={styles.sectionDescription}>
            {description}
          </p>
        </div>
      </div>

      <div
        className="settings-section-content"
        style={styles.sectionContent}
      >
        {children}
      </div>
    </section>
  )
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  disabled = false,
  min,
}) {
  return (
    <label style={styles.field}>
      <span style={styles.fieldLabel}>
        {label}
      </span>

      <input
        type={type}
        value={value ?? ""}
        onChange={(e) =>
          onChange(e.target.value)
        }
        placeholder={placeholder}
        disabled={disabled}
        min={min}
        style={{
          ...styles.input,
          ...(disabled
            ? styles.inputDisabled
            : {}),
        }}
      />
    </label>
  )
}

function SelectField({
  label,
  value,
  onChange,
  children,
}) {
  return (
    <label style={styles.field}>
      <span style={styles.fieldLabel}>
        {label}
      </span>

      <select
        value={value}
        onChange={(e) =>
          onChange(e.target.value)
        }
        style={styles.input}
      >
        {children}
      </select>
    </label>
  )
}

function Toggle({
  checked,
  onChange,
  label,
  description,
}) {
  return (
    <label
      className="settings-toggle-row"
      style={styles.toggleRow}
    >
      <div style={styles.toggleText}>
        <strong style={styles.toggleLabel}>
          {label}
        </strong>

        <small
          style={styles.toggleDescription}
        >
          {description}
        </small>
      </div>

      <input
        type="checkbox"
        checked={!!checked}
        onChange={(e) =>
          onChange(e.target.checked)
        }
        style={styles.toggleInput}
      />

      <span
        aria-hidden="true"
        style={{
          ...styles.toggle,
          ...(checked
            ? styles.toggleActive
            : {}),
        }}
      >
        <span
          style={{
            ...styles.toggleKnob,
            ...(checked
              ? styles.toggleKnobActive
              : {}),
          }}
        />
      </span>
    </label>
  )
}

export default function Settings() {
  const { gym, setGym } = useGym()

  const [form, setForm] = useState(
    gym || {}
  )

  const [settings, setSettings] =
    useState(
      readSettings(gym?.settings)
    )

  const [saving, setSaving] =
    useState(false)

  const [uploading, setUploading] =
    useState(false)

  const [message, setMessage] =
    useState("")

  const [error, setError] =
    useState("")

  const [qrDataUrl, setQrDataUrl] =
    useState("")

  const [copied, setCopied] =
    useState(false)

  const [paymentSettings, setPaymentSettings] =
    useState({
      provider: "paystack",
      enabled: false,
      publicKey: "",
      secretKey: "",
      configured: false,
      testMode: true,
    })

  const [paymentSaving, setPaymentSaving] =
    useState(false)

  const [showPaymentSecret, setShowPaymentSecret] =
    useState(false)

  const [emailSettings, setEmailSettings] =
    useState({
      enabled: false,
      provider: "platform",
      senderName: "",
      senderEmail: "",
      replyToEmail: "",
      smtpHost: "",
      smtpPort: 587,
      smtpUser: "",
      smtpPassword: "",
      smtpSecure: true,
      trainerOtpEnabled: true,
      memberEmailsEnabled: true,
      passwordResetEmailsEnabled: true,
      configured: false,
    })

  const [emailSaving, setEmailSaving] =
    useState(false)

  const [emailTesting, setEmailTesting] =
    useState(false)

  const [testEmail, setTestEmail] =
    useState("")

  const [showEmailPassword, setShowEmailPassword] =
    useState(false)

  const fileRef = useRef(null)

  useEffect(() => {
    setForm(gym || {})
    setSettings(
      readSettings(gym?.settings)
    )
  }, [gym])

  useEffect(() => {
    let mounted = true

    const loadPaymentSettings =
      async () => {
        try {
          const response =
            await gyms.paymentSettings()

          const value =
            response?.paymentSettings ||
            {}

          if (mounted) {
            setPaymentSettings(
              (current) => ({
                ...current,
                ...value,
                secretKey: "",
              })
            )
          }
        } catch (e) {
          console.error(
            "Unable to load payment settings:",
            e
          )
        }
      }

    if (gym?._id || gym?.id) {
      loadPaymentSettings()
    }

    return () => {
      mounted = false
    }
  }, [gym?._id, gym?.id])

  useEffect(() => {
    let mounted = true

    const loadEmailSettings =
      async () => {
        try {
          const response =
            await gyms.emailSettings()

          const value =
            response?.emailSettings ||
            {}

          if (mounted) {
            setEmailSettings(
              (current) => ({
                ...current,
                ...value,
                smtpPassword: "",
              })
            )
          }
        } catch (e) {
          console.error(
            "Unable to load email settings:",
            e
          )
        }
      }

    if (gym?._id || gym?.id) {
      loadEmailSettings()
    }

    return () => {
      mounted = false
    }
  }, [gym?._id, gym?.id])

  const savePaymentSettings =
    async () => {
      setPaymentSaving(true)
      setMessage("")
      setError("")

      try {
        const response =
          await gyms.updatePaymentSettings({
            provider:
              paymentSettings.provider ||
              "paystack",
            enabled: Boolean(
              paymentSettings.enabled
            ),
            publicKey:
              paymentSettings.publicKey ||
              "",
            ...(paymentSettings.secretKey.trim()
              ? {
                  secretKey:
                    paymentSettings.secretKey.trim(),
                }
              : {}),
            testMode: Boolean(
              paymentSettings.testMode
            ),
          })

        const saved =
          response?.paymentSettings ||
          {}

        setPaymentSettings(
          (current) => ({
            ...current,
            ...saved,
            secretKey: "",
          })
        )

        setMessage(
          "Payment settings saved successfully."
        )
      } catch (e) {
        setError(
          e?.response?.data?.message ||
            e?.message ||
            "Unable to save payment settings."
        )
      } finally {
        setPaymentSaving(false)
      }
    }

  const saveEmailSettings =
    async () => {
      setEmailSaving(true)
      setMessage("")
      setError("")

      try {
        const payload = {
          enabled: Boolean(
            emailSettings.enabled
          ),
          provider:
            emailSettings.provider ||
            "platform",
          senderName:
            emailSettings.senderName ||
            "",
          senderEmail:
            emailSettings.senderEmail ||
            "",
          replyToEmail:
            emailSettings.replyToEmail ||
            "",
          smtpHost:
            emailSettings.smtpHost ||
            "",
          smtpPort:
            Number(emailSettings.smtpPort) ||
            587,
          ...(emailSettings.smtpPassword.trim()
            ? {
                smtpPassword:
                  emailSettings.smtpPassword.trim(),
              }
            : {}),
          smtpUser:
            emailSettings.smtpUser ||
            "",
          smtpSecure: Boolean(
            emailSettings.smtpSecure
          ),
          trainerOtpEnabled: Boolean(
            emailSettings.trainerOtpEnabled
          ),
          memberEmailsEnabled: Boolean(
            emailSettings.memberEmailsEnabled
          ),
          passwordResetEmailsEnabled:
            Boolean(
              emailSettings.passwordResetEmailsEnabled
            ),
        }

        const response =
          await gyms.updateEmailSettings(
            payload
          )

        const saved =
          response?.emailSettings ||
          {}

        setEmailSettings(
          (current) => ({
            ...current,
            ...saved,
            smtpPassword: "",
          })
        )

        setMessage(
          "Email settings saved successfully."
        )
      } catch (e) {
        setError(
          e?.response?.data?.message ||
            e?.message ||
            "Unable to save email settings."
        )
      } finally {
        setEmailSaving(false)
      }
    }

  const sendTestEmail =
    async () => {
      const recipient =
        testEmail.trim()

      if (!recipient) {
        setError(
          "Enter an email address for the test email."
        )
        return
      }

      setEmailTesting(true)
      setMessage("")
      setError("")

      try {
        await gyms.testEmailSettings({
          to: recipient,
        })

        setMessage(
          `Test email sent to ${recipient}.`
        )
      } catch (e) {
        setError(
          e?.response?.data?.message ||
            e?.message ||
            "Unable to send the test email."
        )
      } finally {
        setEmailTesting(false)
      }
    }

  const timezoneLabel = useMemo(
    () =>
      TIMEZONES.find(
        ([value]) =>
          value === settings.timezone
      )?.[1] ||
      settings.timezone,
    [settings.timezone]
  )

  /*
   * IMPORTANT:
   * The QR code must open the gym entry page,
   * not the general GB login page.
   *
   * Correct:
   * /gym/:gymSlug
   *
   * Example:
   * /gym/peakfit-wellness-center
   */
  const memberPortalUrl = useMemo(() => {
    if (!gym?.slug) return ""

    const baseUrl =
      window.location.origin.replace(
        /\/$/,
        ""
      )

    return `${baseUrl}/gym/${encodeURIComponent(
      gym.slug
    )}`
  }, [gym?.slug])

  useEffect(() => {
    let cancelled = false

    const generateQr =
      async () => {
        if (!memberPortalUrl) {
          setQrDataUrl("")
          return
        }

        try {
          const dataUrl =
            await QRCode.toDataURL(
              memberPortalUrl,
              {
                width: 420,
                margin: 3,
                errorCorrectionLevel:
                  "H",
                color: {
                  dark: "#07100b",
                  light: "#ffffff",
                },
              }
            )

          if (!cancelled) {
            setQrDataUrl(dataUrl)
          }
        } catch {
          if (!cancelled) {
            setQrDataUrl("")
          }
        }
      }

    generateQr()

    return () => {
      cancelled = true
    }
  }, [memberPortalUrl])

  const copyMemberPortalLink =
    async () => {
      if (!memberPortalUrl) return

      try {
        await navigator.clipboard.writeText(
          memberPortalUrl
        )

        setCopied(true)

        window.setTimeout(() => {
          setCopied(false)
        }, 1800)
      } catch {
        setError(
          "Unable to copy the gym portal link."
        )
      }
    }

  const downloadMemberQr = () => {
    if (!qrDataUrl || !gym?.name) {
      return
    }

    const link =
      document.createElement("a")

    link.href = qrDataUrl

    link.download = `${gym.name
      .replace(/[^a-z0-9]+/gi, "-")
      .toLowerCase()}-member-qr.png`

    document.body.appendChild(link)
    link.click()
    link.remove()
  }

  const printMemberQr = () => {
    if (!qrDataUrl || !gym?.name) {
      return
    }

    const printWindow =
      window.open(
        "",
        "_blank",
        "width=720,height=820"
      )

    if (!printWindow) {
      setError(
        "Please allow pop-ups to print the member QR code."
      )
      return
    }

    const safeGymName =
      String(gym.name).replace(
        /[<>&"']/g,
        ""
      )

    printWindow.document.write(`
      <!doctype html>
      <html>
        <head>
          <title>${safeGymName} — Gym QR Code</title>

          <style>
            * {
              box-sizing: border-box;
            }

            body {
              margin: 0;
              min-height: 100vh;
              display: flex;
              align-items: center;
              justify-content: center;
              font-family: Arial, sans-serif;
              background: #ffffff;
              color: #07100b;
            }

            .sheet {
              width: 100%;
              max-width: 620px;
              padding: 48px;
              text-align: center;
            }

            img {
              width: 360px;
              height: 360px;
              max-width: 80vw;
              max-height: 80vw;
              display: block;
              margin: 30px auto;
            }

            h1 {
              margin: 0;
              font-size: 30px;
            }

            p {
              color: #4b5563;
              line-height: 1.6;
            }

            .url {
              margin-top: 22px;
              padding: 12px 16px;
              border: 1px solid #d1d5db;
              border-radius: 10px;
              word-break: break-all;
              font-size: 12px;
            }

            @media print {
              .sheet {
                padding: 20px;
              }
            }
          </style>
        </head>

        <body>
          <div class="sheet">
            <h1>${safeGymName}</h1>

            <p>
              Scan this QR code to access the gym portal.
            </p>

            <img
              src="${qrDataUrl}"
              alt="Gym portal QR code"
            />

            <p>
              Scan with your phone camera to continue.
            </p>

            <div class="url">
              ${memberPortalUrl}
            </div>
          </div>

          <script>
            window.onload = function () {
              window.print()
            }
          </script>
        </body>
      </html>
    `)

    printWindow.document.close()
  }

  const setField = (
    key,
    value
  ) => {
    setForm((current) => ({
      ...current,
      [key]: value,
    }))
  }

  const setNested = (
    group,
    key,
    value
  ) => {
    setSettings((current) => ({
      ...current,
      [group]: {
        ...current[group],
        [key]: value,
      },
    }))
  }

  const updateBranding = (
    key,
    value
  ) => {
    setForm((current) => ({
      ...current,
      branding: {
        ...(current.branding || {}),
        [key]: value,
      },
    }))
  }

  const save = async () => {
    setSaving(true)
    setMessage("")
    setError("")

    try {
      const response =
        await gyms.update({
          name: form.name || "",
          email: form.email || "",
          phone: form.phone || "",
          address: form.address || "",
          city: form.city || "",
          state: form.state || "",
          country:
            form.country || "Nigeria",
          socialMedia:
            form.socialMedia || {},
          branding: {
            ...(form.branding || {}),
            primaryColor:
              form.branding?.primaryColor ||
              "#d7ff32",
            secondaryColor:
              form.branding?.secondaryColor ||
              "#ffe600",
          },
          settings,
        })

      const updated =
        response?.gym || response

      if (updated) {
        setGym(updated)
      }

      setMessage(
        "Settings saved successfully."
      )
    } catch (e) {
      setError(
        e?.response?.data?.message ||
          e?.message ||
          "Unable to save settings."
      )
    } finally {
      setSaving(false)
    }
  }

  const uploadLogo =
    async (file) => {
      if (!file) return

      if (!file.type.startsWith("image/")) {
        setError(
          "Please select an image file."
        )
        return
      }

      if (
        file.size >
        5 * 1024 * 1024
      ) {
        setError(
          "Gym logo must be 5 MB or smaller."
        )
        return
      }

      setUploading(true)
      setMessage("")
      setError("")

      try {
        const response =
          await gyms.uploadLogo(file)

        const updated =
          response?.gym || response

        if (updated) {
          setGym(updated)
        }

        setMessage(
          "Gym logo uploaded successfully."
        )
      } catch (e) {
        setError(
          e?.response?.data?.message ||
            e?.message ||
            "Unable to upload gym logo."
        )
      } finally {
        setUploading(false)

        if (fileRef.current) {
          fileRef.current.value = ""
        }
      }
    }

  const primaryColor =
    form.branding?.primaryColor ||
    "#d7ff32"

  const secondaryColor =
    form.branding?.secondaryColor ||
    "#ffe600"

  return (
    <div
      className="settings-page"
      style={styles.page}
    >
      <style>{`
        * {
          box-sizing: border-box;
        }

        .settings-page {
          overflow-x: hidden;
        }

        .settings-section {
          min-width: 0;
        }

        .settings-save {
          white-space: nowrap;
        }

        .settings-logo-card {
          min-width: 0;
        }

        .settings-color-panel {
          min-width: 0;
        }

        .settings-color-input {
          min-width: 0;
        }

        .settings-email-layout,
        .settings-member-layout,
        .settings-payment-layout {
          min-width: 0;
        }

        .settings-button {
          transition:
            transform 160ms ease,
            background 160ms ease,
            border-color 160ms ease;
        }

        .settings-button:active {
          transform: scale(0.98);
        }

        .settings-button:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }

        .settings-upload-button:hover {
          border-color: #d7ff32 !important;
          background: rgba(215,255,50,0.08) !important;
        }

        .settings-input:focus,
        .settings-color-text:focus,
        .settings-payment-input:focus,
        .settings-test-input:focus {
          border-color: #d7ff32 !important;
          box-shadow: 0 0 0 3px rgba(215,255,50,0.07);
        }

        .settings-toggle-row:last-child {
          border-bottom: none !important;
        }

        @media (min-width: 700px) {
          .settings-section-content {
            padding: 26px 28px 30px !important;
          }

          .settings-section-head {
            padding: 26px 28px 22px !important;
          }

          .settings-grid-three {
            grid-template-columns:
              repeat(2, minmax(0, 1fr)) !important;
          }

          .settings-grid-two {
            grid-template-columns:
              repeat(2, minmax(0, 1fr)) !important;
          }

          .settings-branding-layout {
            grid-template-columns:
              minmax(0, 0.95fr)
              minmax(0, 1.05fr) !important;
          }

          .settings-logo-card {
            flex-direction: row !important;
            align-items: center !important;
            text-align: left !important;
          }

          .settings-upload-button {
            width: auto !important;
          }

          .settings-color-grid {
            grid-template-columns:
              repeat(2, minmax(0, 1fr)) !important;
          }

          .settings-email-layout {
            grid-template-columns:
              minmax(0, 0.72fr)
              minmax(0, 1.28fr) !important;
          }

          .settings-email-grid {
            grid-template-columns:
              repeat(2, minmax(0, 1fr)) !important;
          }

          .settings-member-layout {
            grid-template-columns:
              minmax(0, 0.85fr)
              minmax(0, 1.15fr) !important;
          }

          .settings-payment-layout {
            grid-template-columns:
              minmax(0, 0.75fr)
              minmax(0, 1.25fr) !important;
          }

          .settings-security-row {
            grid-template-columns:
              minmax(0, 1fr) 180px !important;
          }

          .settings-save {
            width: auto !important;
          }
        }

        @media (min-width: 1000px) {
          .settings-grid-three {
            grid-template-columns:
              repeat(3, minmax(0, 1fr)) !important;
          }

          .settings-email-grid {
            grid-template-columns:
              repeat(3, minmax(0, 1fr)) !important;
          }
        }

        @media (max-width: 699px) {
          .settings-page {
            width: 100% !important;
            max-width: 100% !important;
            padding-bottom: 28px !important;
          }

          .settings-section {
            margin-top: 16px !important;
            border-radius: 16px !important;
          }

          .settings-section-head {
            padding: 18px 16px !important;
            gap: 12px !important;
          }

          .settings-section-content {
            padding: 17px 14px 20px !important;
          }

          .settings-section-head h2 {
            font-size: 18px !important;
          }

          .settings-section-head p {
            font-size: 12px !important;
          }

          .settings-section-icon {
            width: 40px !important;
            height: 40px !important;
            min-width: 40px !important;
          }

          .settings-logo-card {
            flex-direction: column !important;
            align-items: center !important;
            text-align: center !important;
            padding: 18px !important;
            gap: 14px !important;
          }

          .settings-logo-preview {
            width: 92px !important;
            height: 92px !important;
            min-width: 92px !important;
            border-radius: 16px !important;
          }

          .settings-logo-details {
            width: 100% !important;
          }

          .settings-upload-button {
            width: 100% !important;
            height: 46px !important;
            justify-content: center !important;
          }

          .settings-color-panel {
            padding: 18px !important;
          }

          .settings-color-input {
            width: 100% !important;
          }

          .settings-color-picker {
            width: 48px !important;
            min-width: 48px !important;
            height: 46px !important;
          }

          .settings-color-text {
            height: 46px !important;
          }

          .settings-input {
            height: 46px !important;
            font-size: 14px !important;
          }

          .settings-info-card {
            padding: 15px !important;
          }

          .settings-toggle-row {
            min-height: 76px !important;
            padding: 15px 14px !important;
            gap: 12px !important;
          }

          .settings-toggle-description {
            font-size: 11px !important;
          }

          .settings-security-minutes {
            padding: 15px 14px !important;
          }

          .settings-email-status,
          .settings-member-details,
          .settings-qr-card,
          .settings-payment-status {
            padding: 17px !important;
          }

          .settings-qr-preview {
            width: min(100%, 250px) !important;
            margin-top: 18px !important;
          }

          .settings-qr-header {
            flex-direction: column !important;
          }

          .settings-qr-status {
            align-self: flex-start !important;
          }

          .settings-qr-actions {
            flex-direction: column !important;
          }

          .settings-qr-actions button {
            width: 100% !important;
          }

          .settings-email-actions {
            flex-direction: column !important;
            align-items: stretch !important;
          }

          .settings-test-email-box {
            width: 100% !important;
            flex-direction: column !important;
            align-items: stretch !important;
          }

          .settings-test-email-box input,
          .settings-test-email-box button {
            width: 100% !important;
          }

          .settings-payment-save {
            width: 100% !important;
          }

          .settings-system-card {
            align-items: flex-start !important;
            padding: 17px !important;
          }

          .settings-system-icon {
            width: 40px !important;
            height: 40px !important;
            min-width: 40px !important;
          }

          .settings-save {
            width: 100% !important;
            justify-content: center !important;
          }
        }

        @media (max-width: 380px) {
          .settings-section-head {
            padding: 16px 13px !important;
          }

          .settings-section-content {
            padding: 14px 11px 17px !important;
          }

          .settings-logo-card,
          .settings-color-panel,
          .settings-email-status,
          .settings-member-details,
          .settings-qr-card,
          .settings-payment-status {
            padding: 14px !important;
          }

          .settings-section-head h2 {
            font-size: 17px !important;
          }

          .settings-logo-preview {
            width: 84px !important;
            height: 84px !important;
            min-width: 84px !important;
          }
        }
      `}</style>

      <PageHeader
        title="Settings"
        description="Manage the preferences, identity and default operating behaviour for this gym."
        action={
          <button
            className="btn primary settings-save settings-button"
            onClick={save}
            disabled={saving}
            style={styles.saveButton}
          >
            <Save size={17} />

            {saving
              ? "Saving..."
              : "Save Changes"}
          </button>
        }
      />

      {error && (
        <div style={styles.errorAlert}>
          <X size={17} />
          <span>{error}</span>
        </div>
      )}

      {message && (
        <div style={styles.successAlert}>
          <Check size={17} />
          <span>{message}</span>
        </div>
      )}

      <Section
        icon={UserRound}
        eyebrow="GYM PROFILE"
        title="Organisation details"
        description="Basic information displayed throughout your gym administration area."
      >
        <div
          className="settings-grid-three"
          style={styles.gridThree}
        >
          <Field
            label="GYM NAME"
            value={form.name || ""}
            onChange={(value) =>
              setField("name", value)
            }
            placeholder="Your gym name"
          />

          <Field
            label="CONTACT EMAIL"
            value={form.email || ""}
            onChange={(value) =>
              setField("email", value)
            }
            placeholder="admin@gym.com"
            type="email"
          />

          <Field
            label="PHONE NUMBER"
            value={form.phone || ""}
            onChange={(value) =>
              setField("phone", value)
            }
            placeholder="+234..."
          />

          <Field
            label="ADDRESS"
            value={form.address || ""}
            onChange={(value) =>
              setField("address", value)
            }
            placeholder="Street address"
          />

          <Field
            label="CITY"
            value={form.city || ""}
            onChange={(value) =>
              setField("city", value)
            }
            placeholder="City"
          />

          <Field
            label="STATE / REGION"
            value={form.state || ""}
            onChange={(value) =>
              setField("state", value)
            }
            placeholder="State"
          />

          <Field
            label="COUNTRY"
            value={
              form.country || "Nigeria"
            }
            onChange={(value) =>
              setField("country", value)
            }
            placeholder="Nigeria"
          />
        </div>
      </Section>

      <Section
        icon={ImagePlus}
        eyebrow="BRANDING"
        title="Gym appearance"
        description="Upload the gym logo and choose the colours used across your gym workspace."
      >
        <div
          className="settings-branding-layout"
          style={styles.brandingLayout}
        >
          <div
            className="settings-logo-card"
            style={styles.logoCard}
          >
            <div
              className="settings-logo-preview"
              style={styles.logoPreview}
            >
              {form.logoUrl ? (
                <img
                  src={form.logoUrl}
                  alt={`${form.name || "Gym"} logo`}
                  style={styles.logoImage}
                />
              ) : (
                <Dumbbell size={34} />
              )}
            </div>

            <div
              className="settings-logo-details"
              style={styles.logoDetails}
            >
              <div style={styles.logoTitle}>
                Gym logo
              </div>

              <p
                style={
                  styles.logoDescription
                }
              >
                PNG, JPG, WEBP or GIF.
                <br />
                Maximum 5 MB.
              </p>

              <input
                ref={fileRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                hidden
                onChange={(e) =>
                  uploadLogo(
                    e.target.files?.[0]
                  )
                }
              />

              <button
                type="button"
                className="settings-upload-button settings-button"
                onClick={() =>
                  fileRef.current?.click()
                }
                disabled={uploading}
                style={
                  styles.uploadButton
                }
              >
                <ImagePlus size={17} />

                {uploading
                  ? "Uploading..."
                  : form.logoUrl
                    ? "Replace logo"
                    : "Upload logo"}
              </button>
            </div>
          </div>

          <div
            className="settings-color-panel"
            style={styles.colorPanel}
          >
            <div
              style={
                styles.colorPanelTitle
              }
            >
              Brand colours
            </div>

            <p
              style={
                styles.colorPanelDescription
              }
            >
              Choose the colours used
              throughout this gym's
              workspace.
            </p>

            <div
              className="settings-color-grid"
              style={styles.colorGrid}
            >
              <label style={styles.field}>
                <span
                  style={
                    styles.fieldLabel
                  }
                >
                  PRIMARY COLOUR
                </span>

                <div
                  className="settings-color-input"
                  style={
                    styles.colorInputWrap
                  }
                >
                  <input
                    className="settings-color-picker"
                    type="color"
                    value={primaryColor}
                    onChange={(e) =>
                      updateBranding(
                        "primaryColor",
                        e.target.value
                      )
                    }
                    style={
                      styles.colorPicker
                    }
                  />

                  <input
                    className="settings-color-text"
                    value={primaryColor}
                    onChange={(e) =>
                      updateBranding(
                        "primaryColor",
                        e.target.value
                      )
                    }
                    style={
                      styles.colorTextInput
                    }
                  />
                </div>
              </label>

              <label style={styles.field}>
                <span
                  style={
                    styles.fieldLabel
                  }
                >
                  SECONDARY COLOUR
                </span>

                <div
                  className="settings-color-input"
                  style={
                    styles.colorInputWrap
                  }
                >
                  <input
                    className="settings-color-picker"
                    type="color"
                    value={secondaryColor}
                    onChange={(e) =>
                      updateBranding(
                        "secondaryColor",
                        e.target.value
                      )
                    }
                    style={
                      styles.colorPicker
                    }
                  />

                  <input
                    className="settings-color-text"
                    value={secondaryColor}
                    onChange={(e) =>
                      updateBranding(
                        "secondaryColor",
                        e.target.value
                      )
                    }
                    style={
                      styles.colorTextInput
                    }
                  />
                </div>
              </label>
            </div>

            <div
              style={styles.brandPreview}
            >
              <div
                style={{
                  ...styles.brandPreviewLogo,
                  borderColor:
                    primaryColor,
                }}
              >
                {form.logoUrl ? (
                  <img
                    src={form.logoUrl}
                    alt=""
                    style={
                      styles.brandPreviewImage
                    }
                  />
                ) : (
                  <Dumbbell size={19} />
                )}
              </div>

              <div
                style={
                  styles.brandPreviewText
                }
              >
                <strong>
                  {form.name ||
                    "Your gym"}
                </strong>

                <span>
                  Mobile app branding
                  preview
                </span>
              </div>

              <div
                style={{
                  ...styles.brandPreviewAccent,
                  background:
                    primaryColor,
                }}
              />

              <div
                style={{
                  ...styles.brandPreviewAccentSmall,
                  background:
                    secondaryColor,
                }}
              />
            </div>
          </div>
        </div>
      </Section>

      <Section
        icon={Globe2}
        eyebrow="REGIONAL"
        title="Time & regional preferences"
        description="Control the timezone used when displaying dates and training schedules."
      >
        <div
          className="settings-grid-two"
          style={styles.gridTwo}
        >
          <SelectField
            label="TIMEZONE"
            value={settings.timezone}
            onChange={(value) =>
              setSettings(
                (current) => ({
                  ...current,
                  timezone: value,
                })
              )
            }
          >
            {TIMEZONES.map(
              ([value, label]) => (
                <option
                  key={value}
                  value={value}
                >
                  {label}
                </option>
              )
            )}
          </SelectField>

          <div
            className="settings-info-card"
            style={styles.infoCard}
          >
            <div style={styles.infoIcon}>
              <Clock3 size={20} />
            </div>

            <div>
              <strong
                style={styles.infoTitle}
              >
                Current application
                timezone
              </strong>

              <span
                style={styles.infoText}
              >
                {timezoneLabel}
              </span>
            </div>
          </div>
        </div>
      </Section>

      <Section
        icon={Dumbbell}
        eyebrow="TRAINING DEFAULTS"
        title="Workout preferences"
        description="Default values used when trainers create or assign workouts."
      >
        <div
          className="settings-grid-two"
          style={styles.gridTwo}
        >
          <Field
            label="DEFAULT WORKOUT DURATION (MINUTES)"
            value={
              settings.workoutDurationMinutes
            }
            onChange={(value) =>
              setSettings(
                (current) => ({
                  ...current,
                  workoutDurationMinutes:
                    Number(value) || 0,
                })
              )
            }
            type="number"
            min="1"
          />

          <Field
            label="DEFAULT REST BETWEEN SETS (SECONDS)"
            value={
              settings.restBetweenSetsSeconds
            }
            onChange={(value) =>
              setSettings(
                (current) => ({
                  ...current,
                  restBetweenSetsSeconds:
                    Number(value) || 0,
                })
              )
            }
            type="number"
            min="0"
          />
        </div>
      </Section>

      <Section
        icon={Bell}
        eyebrow="NOTIFICATIONS"
        title="Administration alerts"
        description="Choose which operational notifications should be enabled."
      >
        <div style={styles.toggleList}>
          <Toggle
            checked={
              settings.notifications.email
            }
            onChange={(value) =>
              setNested(
                "notifications",
                "email",
                value
              )
            }
            label="Email notifications"
            description="Allow the administration system to send email notifications."
          />

          <Toggle
            checked={
              settings.notifications
                .workoutReminders
            }
            onChange={(value) =>
              setNested(
                "notifications",
                "workoutReminders",
                value
              )
            }
            label="Workout reminders"
            description="Enable reminders related to assigned member workouts."
          />

          <Toggle
            checked={
              settings.notifications
                .progressAlerts
            }
            onChange={(value) =>
              setNested(
                "notifications",
                "progressAlerts",
                value
              )
            }
            label="Progress alerts"
            description="Surface important workout completion and progress events."
          />

          <Toggle
            checked={
              settings.notifications
                .newMemberAlerts
            }
            onChange={(value) =>
              setNested(
                "notifications",
                "newMemberAlerts",
                value
              )
            }
            label="New member alerts"
            description="Notify administrators when a new member is registered."
          />
        </div>
      </Section>

      <Section
        icon={Mail}
        eyebrow="EMAIL & COMMUNICATIONS"
        title="Gym email delivery"
        description="Configure how this gym sends trainer, member and password-reset emails."
      >
        <div
          className="settings-email-layout"
          style={styles.emailLayout}
        >
          <div
            className="settings-email-status"
            style={styles.emailStatusCard}
          >
            <div
              style={styles.emailStatusIcon}
            >
              <Mail size={21} />
            </div>

            <div>
              <strong
                style={
                  styles.emailStatusTitle
                }
              >
                {emailSettings.enabled
                  ? "Gym email delivery enabled"
                  : "Gym email delivery disabled"}
              </strong>

              <p
                style={
                  styles.emailStatusText
                }
              >
                {emailSettings.provider ===
                "smtp"
                  ? emailSettings.configured
                    ? "Custom SMTP is configured for this gym."
                    : "Custom SMTP is selected but has not been configured yet."
                  : "Emails use the GB platform mail service unless Custom SMTP is selected."}
              </p>
            </div>
          </div>

          <div style={styles.emailForm}>
            <div
              className="settings-email-grid"
              style={styles.emailFormGrid}
            >
              <label
                style={
                  styles.paymentLabel
                }
              >
                Email Provider

                <select
                  value={
                    emailSettings.provider
                  }
                  onChange={(e) =>
                    setEmailSettings(
                      (current) => ({
                        ...current,
                        provider:
                          e.target.value,
                      })
                    )
                  }
                  style={
                    styles.paymentInput
                  }
                >
                  <option value="platform">
                    GB Platform Email
                  </option>

                  <option value="smtp">
                    Custom Gym SMTP
                  </option>
                </select>
              </label>

              <label
                style={
                  styles.paymentToggleRow
                }
              >
                <input
                  type="checkbox"
                  checked={Boolean(
                    emailSettings.enabled
                  )}
                  onChange={(e) =>
                    setEmailSettings(
                      (current) => ({
                        ...current,
                        enabled:
                          e.target.checked,
                      })
                    )
                  }
                />

                <span>
                  Enable gym email
                  delivery
                </span>
              </label>
            </div>

            <div
              className="settings-email-grid"
              style={styles.emailFormGrid}
            >
              <label
                style={
                  styles.paymentLabel
                }
              >
                Sender Name

                <input
                  value={
                    emailSettings.senderName
                  }
                  onChange={(e) =>
                    setEmailSettings(
                      (current) => ({
                        ...current,
                        senderName:
                          e.target.value,
                      })
                    )
                  }
                  placeholder={
                    form.name ||
                    "Your Gym"
                  }
                  style={
                    styles.paymentInput
                  }
                />
              </label>

              <label
                style={
                  styles.paymentLabel
                }
              >
                Sender Email

                <input
                  type="email"
                  value={
                    emailSettings.senderEmail
                  }
                  onChange={(e) =>
                    setEmailSettings(
                      (current) => ({
                        ...current,
                        senderEmail:
                          e.target.value,
                      })
                    )
                  }
                  placeholder="info@yourgym.com"
                  style={
                    styles.paymentInput
                  }
                />
              </label>

              <label
                style={
                  styles.paymentLabel
                }
              >
                Reply-To Email

                <input
                  type="email"
                  value={
                    emailSettings.replyToEmail
                  }
                  onChange={(e) =>
                    setEmailSettings(
                      (current) => ({
                        ...current,
                        replyToEmail:
                          e.target.value,
                      })
                    )
                  }
                  placeholder="support@yourgym.com"
                  style={
                    styles.paymentInput
                  }
                />
              </label>
            </div>

            {emailSettings.provider ===
              "smtp" && (
              <div
                style={styles.smtpPanel}
              >
                <div
                  style={
                    styles.smtpPanelTitle
                  }
                >
                  Custom SMTP
                  connection
                </div>

                <p
                  style={
                    styles.smtpPanelDescription
                  }
                >
                  Use the SMTP details
                  supplied by your email
                  provider. The password
                  is never displayed after
                  it has been saved.
                </p>

                <div
                  className="settings-email-grid"
                  style={
                    styles.emailFormGrid
                  }
                >
                  <label
                    style={
                      styles.paymentLabel
                    }
                  >
                    SMTP Host

                    <input
                      value={
                        emailSettings.smtpHost
                      }
                      onChange={(e) =>
                        setEmailSettings(
                          (current) => ({
                            ...current,
                            smtpHost:
                              e.target.value,
                          })
                        )
                      }
                      placeholder="smtp.yourprovider.com"
                      style={
                        styles.paymentInput
                      }
                    />
                  </label>

                  <label
                    style={
                      styles.paymentLabel
                    }
                  >
                    SMTP Port

                    <input
                      type="number"
                      min="1"
                      max="65535"
                      value={
                        emailSettings.smtpPort
                      }
                      onChange={(e) =>
                        setEmailSettings(
                          (current) => ({
                            ...current,
                            smtpPort:
                              Number(
                                e.target.value
                              ) || 587,
                          })
                        )
                      }
                      style={
                        styles.paymentInput
                      }
                    />
                  </label>

                  <label
                    style={
                      styles.paymentLabel
                    }
                  >
                    SMTP Username

                    <input
                      value={
                        emailSettings.smtpUser
                      }
                      onChange={(e) =>
                        setEmailSettings(
                          (current) => ({
                            ...current,
                            smtpUser:
                              e.target.value,
                          })
                        )
                      }
                      placeholder="SMTP username"
                      style={
                        styles.paymentInput
                      }
                      autoComplete="username"
                    />
                  </label>

                  <label
                    style={
                      styles.paymentLabel
                    }
                  >
                    SMTP Password

                    <div
                      style={
                        styles.paymentSecretWrap
                      }
                    >
                      <input
                        type={
                          showEmailPassword
                            ? "text"
                            : "password"
                        }
                        value={
                          emailSettings.smtpPassword
                        }
                        onChange={(e) =>
                          setEmailSettings(
                            (current) => ({
                              ...current,
                              smtpPassword:
                                e.target.value,
                            })
                          )
                        }
                        placeholder={
                          emailSettings.configured
                            ? "Saved securely — enter only to replace"
                            : "SMTP password"
                        }
                        style={
                          styles.paymentSecretInput
                        }
                        autoComplete="new-password"
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setShowEmailPassword(
                            (value) =>
                              !value
                          )
                        }
                        style={
                          styles.paymentEyeButton
                        }
                      >
                        {showEmailPassword ? (
                          <EyeOff
                            size={17}
                          />
                        ) : (
                          <Eye size={17} />
                        )}
                      </button>
                    </div>
                  </label>
                </div>

                <label
                  style={
                    styles.paymentToggleRow
                  }
                >
                  <input
                    type="checkbox"
                    checked={Boolean(
                      emailSettings.smtpSecure
                    )}
                    onChange={(e) =>
                      setEmailSettings(
                        (current) => ({
                          ...current,
                          smtpSecure:
                            e.target.checked,
                        })
                      )
                    }
                  />

                  <span>
                    Use secure SMTP
                    connection (TLS/SSL)
                  </span>
                </label>
              </div>
            )}

            <div
              style={styles.emailFeatures}
            >
              <div
                style={
                  styles.emailFeaturesTitle
                }
              >
                Email categories
              </div>

              <Toggle
                checked={
                  emailSettings.trainerOtpEnabled
                }
                onChange={(value) =>
                  setEmailSettings(
                    (current) => ({
                      ...current,
                      trainerOtpEnabled:
                        value,
                    })
                  )
                }
                label="Trainer login codes"
                description="Send six-digit trainer login codes through the configured email service."
              />

              <Toggle
                checked={
                  emailSettings.memberEmailsEnabled
                }
                onChange={(value) =>
                  setEmailSettings(
                    (current) => ({
                      ...current,
                      memberEmailsEnabled:
                        value,
                    })
                  )
                }
                label="Member emails"
                description="Allow workout and member-related emails to be delivered."
              />

              <Toggle
                checked={
                  emailSettings.passwordResetEmailsEnabled
                }
                onChange={(value) =>
                  setEmailSettings(
                    (current) => ({
                      ...current,
                      passwordResetEmailsEnabled:
                        value,
                    })
                  )
                }
                label="Password reset emails"
                description="Allow members and administrators to receive password reset emails."
              />
            </div>

            <div
              className="settings-email-actions"
              style={styles.emailActions}
            >
              <button
                type="button"
                className="btn primary settings-button"
                onClick={
                  saveEmailSettings
                }
                disabled={emailSaving}
                style={
                  styles.paymentSaveButton
                }
              >
                <Save size={17} />

                {emailSaving
                  ? "Saving..."
                  : "Save Email Settings"}
              </button>

              <div
                className="settings-test-email-box"
                style={
                  styles.testEmailBox
                }
              >
                <input
                  type="email"
                  value={testEmail}
                  onChange={(e) =>
                    setTestEmail(
                      e.target.value
                    )
                  }
                  placeholder="test@example.com"
                  className="settings-test-input"
                  style={
                    styles.testEmailInput
                  }
                />

                <button
                  type="button"
                  className="btn settings-button"
                  onClick={
                    sendTestEmail
                  }
                  disabled={emailTesting}
                  style={
                    styles.secondaryAction
                  }
                >
                  <Mail size={17} />

                  {emailTesting
                    ? "Sending..."
                    : "Send Test Email"}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div
          style={
            styles.emailSecurityNote
          }
        >
          <ShieldCheck size={18} />

          <span>
            Custom SMTP passwords are
            encrypted on the server and
            are never returned to the
            browser. Each gym can
            maintain its own email
            configuration.
          </span>
        </div>
      </Section>

      <Section
        icon={ShieldCheck}
        eyebrow="SECURITY"
        title="Administrator security"
        description="Set basic safeguards for sensitive administration actions."
      >
        <div style={styles.toggleList}>
          <Toggle
            checked={
              settings.security
                .requireConfirmation
            }
            onChange={(value) =>
              setNested(
                "security",
                "requireConfirmation",
                value
              )
            }
            label="Require confirmation for sensitive actions"
            description="Ask for confirmation before status changes or destructive operations."
          />

          <div
            className="settings-security-row"
            style={styles.securityRow}
          >
            <div
              style={styles.securityToggle}
            >
              <Toggle
                checked={
                  settings.security
                    .automaticLogout
                }
                onChange={(value) =>
                  setNested(
                    "security",
                    "automaticLogout",
                    value
                  )
                }
                label="Automatic logout"
                description="End inactive administrator sessions after the selected period."
              />
            </div>

            <div
              className="settings-security-minutes"
              style={
                styles.minutesField
              }
            >
              <Field
                label="MINUTES"
                value={
                  settings.security
                    .automaticLogoutMinutes
                }
                onChange={(value) =>
                  setNested(
                    "security",
                    "automaticLogoutMinutes",
                    Number(value) || 5
                  )
                }
                type="number"
                min="5"
                disabled={
                  !settings.security
                    .automaticLogout
                }
              />
            </div>
          </div>
        </div>
      </Section>

      <Section
        icon={Link2}
        eyebrow="GYM MEMBER PORTAL"
        title="Gym access QR code"
        description="Give members and trainers a direct, gym-specific way to access this gym's portal."
      >
        <div
          className="settings-member-layout"
          style={
            styles.memberAppLayout
          }
        >
          <div
            className="settings-qr-card"
            style={styles.qrCard}
          >
            <div
              className="settings-qr-header"
              style={styles.qrHeader}
            >
              <div>
                <div
                  style={styles.qrTitle}
                >
                  Gym QR code
                </div>

                <p
                  style={
                    styles.qrDescription
                  }
                >
                  Members and trainers
                  can scan this code with
                  their phone camera to
                  open this gym's portal.
                </p>
              </div>

              <div
                className="settings-qr-status"
                style={styles.qrStatus}
              >
                <span
                  style={
                    styles.qrStatusDot
                  }
                />

                Gym linked
              </div>
            </div>

            <div
              className="settings-qr-preview"
              style={styles.qrPreview}
            >
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt={`${gym?.name || "Gym"} portal QR code`}
                  style={styles.qrImage}
                />
              ) : (
                <div
                  style={styles.qrLoading}
                >
                  {gym?.slug
                    ? "Generating QR code..."
                    : "Gym slug unavailable"}
                </div>
              )}
            </div>

            <div
              style={styles.qrGymName}
            >
              {gym?.name || "Your gym"}
            </div>

            <div
              style={styles.qrHint}
            >
              This QR code is unique
              to this gym.
            </div>
          </div>

          <div
            className="settings-member-details"
            style={
              styles.memberAppDetails
            }
          >
            <div
              style={styles.memberAppIntro}
            >
              <div
                style={
                  styles.memberAppIcon
                }
              >
                <Link2 size={20} />
              </div>

              <div>
                <div
                  style={
                    styles.memberAppTitle
                  }
                >
                  Gym portal link
                </div>

                <p
                  style={
                    styles.memberAppDescription
                  }
                >
                  The QR code opens this
                  address and identifies
                  the gym before the
                  member or trainer signs
                  in.
                </p>
              </div>
            </div>

            <div style={styles.urlBox}>
              <span
                style={styles.urlLabel}
              >
                GYM PORTAL URL
              </span>

              <div
                style={styles.urlValue}
              >
                {memberPortalUrl ||
                  "Gym slug is not available yet."}
              </div>
            </div>

            <div
              className="settings-qr-actions"
              style={styles.qrActions}
            >
              <button
                type="button"
                className="btn settings-button"
                onClick={
                  copyMemberPortalLink
                }
                disabled={
                  !memberPortalUrl
                }
                style={
                  styles.secondaryAction
                }
              >
                <Link2 size={17} />

                {copied
                  ? "Copied"
                  : "Copy Link"}
              </button>

              <button
                type="button"
                className="btn settings-button"
                onClick={
                  downloadMemberQr
                }
                disabled={!qrDataUrl}
                style={
                  styles.secondaryAction
                }
              >
                <Download size={17} />
                Download QR
              </button>

              <button
                type="button"
                className="btn primary settings-button"
                onClick={printMemberQr}
                disabled={!qrDataUrl}
                style={
                  styles.qrPrintAction
                }
              >
                <Printer size={17} />
                Print QR
              </button>
            </div>

            <div
              style={styles.installNote}
            >
              <strong
                style={
                  styles.installNoteStrong
                }
              >
                Gym member and trainer
                experience
              </strong>

              <span>
                Scan → open the gym
                portal → choose Member
                Login, Register as Member,
                or Trainer Sign In.
              </span>
            </div>

            <div
              style={styles.deploymentNote}
            >
              <ShieldCheck size={18} />

              <span>
                The link automatically
                uses the current application
                domain. After hosting,
                newly generated QR codes
                will use the production
                domain.
              </span>
            </div>
          </div>
        </div>
      </Section>

      <Section
        icon={CreditCard}
        eyebrow="MEMBER PAYMENTS"
        title="Gym payment account"
        description="Connect this gym's Paystack account for member membership payments. Platform Owner billing remains separate."
      >
        <div
          className="settings-payment-layout"
          style={styles.paymentGrid}
        >
          <div
            className="settings-payment-status"
            style={
              styles.paymentStatusCard
            }
          >
            <div
              style={
                styles.paymentStatusIcon
              }
            >
              <CreditCard size={21} />
            </div>

            <div>
              <strong
                style={
                  styles.paymentStatusTitle
                }
              >
                {paymentSettings.configured
                  ? "Paystack configured"
                  : "Paystack not configured"}
              </strong>

              <p
                style={
                  styles.paymentStatusText
                }
              >
                {paymentSettings.configured
                  ? "The gym has a saved Paystack secret key. The secret is never displayed in the browser."
                  : "Add this gym's Paystack credentials before enabling member payments."}
              </p>
            </div>
          </div>

          <div
            style={styles.paymentForm}
          >
            <label
              style={styles.paymentLabel}
            >
              Provider

              <select
                value={
                  paymentSettings.provider
                }
                onChange={(e) =>
                  setPaymentSettings(
                    (current) => ({
                      ...current,
                      provider:
                        e.target.value,
                    })
                  )
                }
                style={
                  styles.paymentInput
                }
              >
                <option value="paystack">
                  Paystack
                </option>

                <option value="none">
                  None
                </option>
              </select>
            </label>

            <label
              style={styles.paymentLabel}
            >
              Paystack Public Key

              <input
                value={
                  paymentSettings.publicKey
                }
                onChange={(e) =>
                  setPaymentSettings(
                    (current) => ({
                      ...current,
                      publicKey:
                        e.target.value,
                    })
                  )
                }
                placeholder="pk_test_... or pk_live_..."
                className="settings-payment-input"
                style={
                  styles.paymentInput
                }
              />
            </label>

            <label
              style={styles.paymentLabel}
            >
              Paystack Secret Key

              <div
                style={
                  styles.paymentSecretWrap
                }
              >
                <input
                  type={
                    showPaymentSecret
                      ? "text"
                      : "password"
                  }
                  value={
                    paymentSettings.secretKey
                  }
                  onChange={(e) =>
                    setPaymentSettings(
                      (current) => ({
                        ...current,
                        secretKey:
                          e.target.value,
                      })
                    )
                  }
                  placeholder={
                    paymentSettings.configured
                      ? "Saved securely — enter only to replace"
                      : "sk_test_... or sk_live_..."
                  }
                  style={
                    styles.paymentSecretInput
                  }
                  autoComplete="new-password"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPaymentSecret(
                      (value) =>
                        !value
                    )
                  }
                  style={
                    styles.paymentEyeButton
                  }
                >
                  {showPaymentSecret ? (
                    <EyeOff size={17} />
                  ) : (
                    <Eye size={17} />
                  )}
                </button>
              </div>
            </label>

            <label
              style={
                styles.paymentToggleRow
              }
            >
              <input
                type="checkbox"
                checked={Boolean(
                  paymentSettings.testMode
                )}
                onChange={(e) =>
                  setPaymentSettings(
                    (current) => ({
                      ...current,
                      testMode:
                        e.target.checked,
                    })
                  )
                }
              />

              <span>
                Use Paystack test mode
              </span>
            </label>

            <label
              style={
                styles.paymentToggleRow
              }
            >
              <input
                type="checkbox"
                checked={Boolean(
                  paymentSettings.enabled
                )}
                onChange={(e) =>
                  setPaymentSettings(
                    (current) => ({
                      ...current,
                      enabled:
                        e.target.checked,
                    })
                  )
                }
              />

              <span>
                Enable member membership
                payments
              </span>
            </label>

            <button
              type="button"
              className="btn primary settings-button settings-payment-save"
              onClick={
                savePaymentSettings
              }
              disabled={
                paymentSaving
              }
              style={
                styles.paymentSaveButton
              }
            >
              <Save size={17} />

              {paymentSaving
                ? "Saving..."
                : "Save Payment Settings"}
            </button>
          </div>
        </div>

        <div
          style={
            styles.paymentSecurityNote
          }
        >
          <ShieldCheck size={18} />

          <span>
            Your Paystack secret key is
            encrypted on the server and is
            never returned to the frontend.
            Member payments are routed using
            the gym account associated with
            the member.
          </span>
        </div>
      </Section>

      <Section
        icon={Globe2}
        eyebrow="SYSTEM"
        title="Administration environment"
        description="This workspace is isolated to your gym tenant. Platform Owner settings are managed separately by GB."
      >
        <div
          className="settings-system-card"
          style={styles.systemCard}
        >
          <div
            className="settings-system-icon"
            style={styles.systemIcon}
          >
            <ShieldCheck size={21} />
          </div>

          <div>
            <strong
              style={styles.systemTitle}
            >
              Tenant-isolated workspace
            </strong>

            <p
              style={styles.systemText}
            >
              Members, trainers,
              programs, exercises,
              schedules, attendance and
              gym revenue remain scoped to{" "}
              {form.name ||
                "this gym"}.
            </p>
          </div>
        </div>
      </Section>
    </div>
  )
}

const styles = {
  page: {
    width: "100%",
    maxWidth: "1440px",
    margin: "0 auto",
    paddingBottom: "40px",
    color: "#f4f7fb",
  },

  section: {
    width: "100%",
    marginTop: "18px",
    background:
      "linear-gradient(145deg, #101721 0%, #0b1119 100%)",
    border:
      "1px solid rgba(255,255,255,0.08)",
    borderRadius: "16px",
    overflow: "hidden",
    boxShadow:
      "0 12px 32px rgba(0,0,0,0.15)",
  },

  sectionHead: {
    display: "flex",
    alignItems: "flex-start",
    gap: "13px",
    padding: "18px 14px",
    borderBottom:
      "1px solid rgba(255,255,255,0.07)",
  },

  sectionIcon: {
    width: "40px",
    height: "40px",
    minWidth: "40px",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background:
      "rgba(215,255,50,0.09)",
    border:
      "1px solid rgba(215,255,50,0.20)",
    color: "#d7ff32",
  },

  sectionTitleWrap: {
    minWidth: 0,
  },

  eyebrow: {
    color: "#d7ff32",
    fontSize: "9px",
    fontWeight: 900,
    letterSpacing: "1.5px",
    marginBottom: "4px",
  },

  sectionTitle: {
    margin: 0,
    fontSize: "18px",
    lineHeight: 1.25,
    fontWeight: 800,
    color: "#ffffff",
  },

  sectionDescription: {
    margin: "6px 0 0",
    color: "#8290a3",
    fontSize: "12px",
    lineHeight: 1.55,
  },

  sectionContent: {
    padding: "17px 14px 20px",
  },

  gridThree: {
    display: "grid",
    gridTemplateColumns:
      "minmax(0, 1fr)",
    gap: "17px",
  },

  gridTwo: {
    display: "grid",
    gridTemplateColumns:
      "minmax(0, 1fr)",
    gap: "17px",
    alignItems: "stretch",
  },

  field: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    minWidth: 0,
  },

  fieldLabel: {
    color: "#aab6c7",
    fontSize: "9px",
    fontWeight: 800,
    letterSpacing: "0.8px",
  },

  input: {
    width: "100%",
    height: "46px",
    boxSizing: "border-box",
    padding: "0 13px",
    borderRadius: "11px",
    border:
      "1px solid #25303e",
    outline: "none",
    background: "#080e16",
    color: "#f5f7fa",
    fontSize: "14px",
    transition:
      "border-color 160ms ease, box-shadow 160ms ease",
  },

  inputDisabled: {
    opacity: 0.45,
    cursor: "not-allowed",
  },

  brandingLayout: {
    display: "grid",
    gridTemplateColumns:
      "minmax(0, 1fr)",
    gap: "16px",
    alignItems: "stretch",
  },

  logoCard: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
    gap: "14px",
    minWidth: 0,
    padding: "18px",
    borderRadius: "15px",
    background: "#080e16",
    border:
      "1px solid #202b38",
  },

  logoPreview: {
    width: "92px",
    height: "92px",
    minWidth: "92px",
    borderRadius: "16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    background:
      "linear-gradient(145deg, rgba(215,255,50,0.10), rgba(255,230,0,0.04))",
    border:
      "1px solid rgba(215,255,50,0.24)",
    color: "#d7ff32",
  },

  logoImage: {
    width: "100%",
    height: "100%",
    objectFit: "contain",
    display: "block",
  },

  logoDetails: {
    minWidth: 0,
    width: "100%",
  },

  logoTitle: {
    fontSize: "16px",
    fontWeight: 800,
    color: "#ffffff",
  },

  logoDescription: {
    margin: "6px 0 14px",
    color: "#77869a",
    fontSize: "11px",
    lineHeight: 1.55,
  },

  uploadButton: {
    width: "100%",
    height: "46px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    padding: "0 15px",
    borderRadius: "10px",
    background: "#121b25",
    border:
      "1px solid #334052",
    color: "#ffffff",
    fontWeight: 800,
    cursor: "pointer",
  },

  colorPanel: {
    padding: "18px",
    borderRadius: "15px",
    background: "#080e16",
    border:
      "1px solid #202b38",
    minWidth: 0,
  },

  colorPanelTitle: {
    fontSize: "16px",
    fontWeight: 800,
    color: "#ffffff",
  },

  colorPanelDescription: {
    margin: "6px 0 17px",
    color: "#77869a",
    fontSize: "11px",
    lineHeight: 1.5,
  },

  colorGrid: {
    display: "grid",
    gridTemplateColumns:
      "minmax(0, 1fr)",
    gap: "16px",
  },

  colorInputWrap: {
    display: "flex",
    gap: "8px",
    width: "100%",
  },

  colorPicker: {
    width: "48px",
    height: "46px",
    minWidth: "48px",
    padding: "3px",
    borderRadius: "10px",
    border:
      "1px solid #25303e",
    background: "#080e16",
    cursor: "pointer",
  },

  colorTextInput: {
    flex: 1,
    minWidth: 0,
    height: "46px",
    boxSizing: "border-box",
    padding: "0 12px",
    borderRadius: "10px",
    border:
      "1px solid #25303e",
    outline: "none",
    background: "#080e16",
    color: "#ffffff",
    fontSize: "13px",
  },

  brandPreview: {
    marginTop: "17px",
    padding: "12px",
    borderRadius: "12px",
    background: "#0b121a",
    border:
      "1px solid #202b38",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    minWidth: 0,
  },

  brandPreviewLogo: {
    width: "38px",
    height: "38px",
    minWidth: "38px",
    borderRadius: "10px",
    overflow: "hidden",
    border: "1px solid",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#d7ff32",
    background: "#080e16",
  },

  brandPreviewImage: {
    width: "100%",
    height: "100%",
    objectFit: "contain",
  },

  brandPreviewText: {
    minWidth: 0,
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: "3px",
  },

  brandPreviewAccent: {
    width: "10px",
    height: "34px",
    borderRadius: "5px",
  },

  brandPreviewAccentSmall: {
    width: "10px",
    height: "24px",
    borderRadius: "5px",
  },

  infoCard: {
    minHeight: "46px",
    padding: "15px",
    boxSizing: "border-box",
    borderRadius: "13px",
    background: "#080e16",
    border:
      "1px solid #202b38",
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },

  infoIcon: {
    width: "40px",
    height: "40px",
    minWidth: "40px",
    borderRadius: "11px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background:
      "rgba(255,230,0,0.08)",
    color: "#ffe600",
    border:
      "1px solid rgba(255,230,0,0.16)",
  },

  infoTitle: {
    display: "block",
    color: "#e8edf3",
    fontSize: "12px",
    marginBottom: "4px",
  },

  infoText: {
    display: "block",
    color: "#7e8da1",
    fontSize: "11px",
  },

  toggleList: {
    display: "flex",
    flexDirection: "column",
    border:
      "1px solid #202b38",
    borderRadius: "13px",
    overflow: "hidden",
    background: "#080e16",
  },

  toggleRow: {
    minHeight: "76px",
    boxSizing: "border-box",
    padding: "15px 14px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
    borderBottom:
      "1px solid #1c2632",
    cursor: "pointer",
  },

  toggleText: {
    minWidth: 0,
    flex: 1,
  },

  toggleLabel: {
    display: "block",
    color: "#f4f7fb",
    fontSize: "13px",
    fontWeight: 700,
  },

  toggleDescription: {
    display: "block",
    marginTop: "4px",
    color: "#748398",
    fontSize: "11px",
    lineHeight: 1.45,
  },

  toggleInput: {
    position: "absolute",
    opacity: 0,
    pointerEvents: "none",
  },

  toggle: {
    width: "46px",
    height: "26px",
    minWidth: "46px",
    padding: "3px",
    boxSizing: "border-box",
    borderRadius: "999px",
    background: "#27313d",
    border:
      "1px solid #3b4654",
    transition: "all 160ms ease",
  },

  toggleActive: {
    background: "#d7ff32",
    borderColor: "#d7ff32",
  },

  toggleKnob: {
    display: "block",
    width: "18px",
    height: "18px",
    borderRadius: "50%",
    background: "#8995a5",
    transition:
      "transform 160ms ease, background 160ms ease",
  },

  toggleKnobActive: {
    transform: "translateX(20px)",
    background: "#07100b",
  },

  emailLayout: {
    display: "grid",
    gridTemplateColumns:
      "minmax(0, 1fr)",
    gap: "16px",
    alignItems: "start",
  },

  emailStatusCard: {
    display: "flex",
    alignItems: "flex-start",
    gap: "12px",
    padding: "17px",
    borderRadius: "14px",
    background:
      "rgba(215,255,50,0.045)",
    border:
      "1px solid rgba(215,255,50,0.14)",
  },

  emailStatusIcon: {
    width: "42px",
    height: "42px",
    minWidth: "42px",
    borderRadius: "11px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background:
      "rgba(215,255,50,0.10)",
    color: "#d7ff32",
  },

  emailStatusTitle: {
    display: "block",
    color: "#ffffff",
    fontSize: "13px",
  },

  emailStatusText: {
    margin: "5px 0 0",
    color: "#7e8da1",
    fontSize: "11px",
    lineHeight: 1.6,
  },

  emailForm: {
    display: "flex",
    flexDirection: "column",
    gap: "15px",
    minWidth: 0,
  },

  emailFormGrid: {
    display: "grid",
    gridTemplateColumns:
      "minmax(0, 1fr)",
    gap: "14px",
  },

  smtpPanel: {
    padding: "16px",
    borderRadius: "13px",
    background: "#0b121b",
    border:
      "1px solid #263241",
    display: "flex",
    flexDirection: "column",
    gap: "14px",
  },

  smtpPanelTitle: {
    color: "#ffffff",
    fontSize: "13px",
    fontWeight: 800,
  },

  smtpPanelDescription: {
    margin: "-6px 0 0",
    color: "#77869a",
    fontSize: "10px",
    lineHeight: 1.55,
  },

  emailFeatures: {
    border:
      "1px solid #202b38",
    borderRadius: "13px",
    overflow: "hidden",
    background: "#080e16",
  },

  emailFeaturesTitle: {
    padding: "14px",
    color: "#ffffff",
    fontSize: "12px",
    fontWeight: 800,
    borderBottom:
      "1px solid #1c2632",
  },

  emailActions: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: "13px",
  },

  testEmailBox: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    flex: "1 1 300px",
    justifyContent: "flex-end",
  },

  testEmailInput: {
    flex: "1 1 180px",
    minWidth: 0,
    height: "43px",
    boxSizing: "border-box",
    padding: "0 12px",
    borderRadius: "10px",
    border:
      "1px solid #334052",
    background: "#0a1119",
    color: "#ffffff",
    outline: "none",
  },

  emailSecurityNote: {
    marginTop: "16px",
    padding: "13px",
    borderRadius: "11px",
    background:
      "rgba(215,255,50,0.04)",
    border:
      "1px solid rgba(215,255,50,0.12)",
    display: "flex",
    alignItems: "flex-start",
    gap: "8px",
    color: "#8795a7",
    fontSize: "10px",
    lineHeight: 1.55,
  },

  securityRow: {
    display: "grid",
    gridTemplateColumns:
      "minmax(0, 1fr)",
  },

  securityToggle: {
    minWidth: 0,
  },

  minutesField: {
    padding: "15px 14px",
    display: "flex",
    alignItems: "center",
  },

  memberAppLayout: {
    display: "grid",
    gridTemplateColumns:
      "minmax(0, 1fr)",
    gap: "16px",
    alignItems: "stretch",
  },

  qrCard: {
    minWidth: 0,
    padding: "17px",
    borderRadius: "15px",
    background: "#080e16",
    border:
      "1px solid #202b38",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },

  qrHeader: {
    width: "100%",
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: "12px",
  },

  qrTitle: {
    color: "#ffffff",
    fontSize: "15px",
    fontWeight: 800,
  },

  qrDescription: {
    margin: "6px 0 0",
    color: "#77869a",
    fontSize: "11px",
    lineHeight: 1.55,
  },

  qrStatus: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    flexShrink: 0,
    padding: "6px 9px",
    borderRadius: "999px",
    background:
      "rgba(215,255,50,0.08)",
    border:
      "1px solid rgba(215,255,50,0.16)",
    color: "#d7ff32",
    fontSize: "9px",
    fontWeight: 800,
    letterSpacing: "0.4px",
  },

  qrStatusDot: {
    width: "6px",
    height: "6px",
    borderRadius: "50%",
    background: "#d7ff32",
  },

  qrPreview: {
    width: "min(100%, 250px)",
    aspectRatio: "1 / 1",
    marginTop: "18px",
    padding: "13px",
    borderRadius: "15px",
    background: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxSizing: "border-box",
  },

  qrImage: {
    display: "block",
    width: "100%",
    height: "100%",
    objectFit: "contain",
  },

  qrLoading: {
    color: "#4b5563",
    fontSize: "12px",
    textAlign: "center",
    padding: "18px",
  },

  qrGymName: {
    marginTop: "14px",
    color: "#ffffff",
    fontSize: "17px",
    fontWeight: 800,
    textAlign: "center",
  },

  qrHint: {
    marginTop: "4px",
    color: "#77869a",
    fontSize: "10px",
    textAlign: "center",
  },

  memberAppDetails: {
    minWidth: 0,
    padding: "17px",
    borderRadius: "15px",
    background: "#080e16",
    border:
      "1px solid #202b38",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
  },

  memberAppIntro: {
    display: "flex",
    alignItems: "flex-start",
    gap: "12px",
  },

  memberAppIcon: {
    width: "42px",
    height: "42px",
    minWidth: "42px",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background:
      "rgba(215,255,50,0.09)",
    border:
      "1px solid rgba(215,255,50,0.20)",
    color: "#d7ff32",
  },

  memberAppTitle: {
    color: "#ffffff",
    fontSize: "15px",
    fontWeight: 800,
  },

  memberAppDescription: {
    margin: "5px 0 0",
    color: "#77869a",
    fontSize: "11px",
    lineHeight: 1.55,
  },

  urlBox: {
    marginTop: "18px",
    padding: "13px",
    borderRadius: "11px",
    background: "#0c131c",
    border:
      "1px solid #25303e",
  },

  urlLabel: {
    display: "block",
    color: "#8e9caf",
    fontSize: "8px",
    fontWeight: 900,
    letterSpacing: "1px",
    marginBottom: "7px",
  },

  urlValue: {
    color: "#e9edf3",
    fontSize: "11px",
    lineHeight: 1.5,
    wordBreak: "break-all",
  },

  qrActions: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
    marginTop: "15px",
  },

  secondaryAction: {
    height: "42px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "7px",
    padding: "0 13px",
    borderRadius: "10px",
    background: "#151e29",
    border:
      "1px solid #334052",
    color: "#ffffff",
    fontWeight: 700,
    cursor: "pointer",
  },

  qrPrintAction: {
    height: "42px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "7px",
    padding: "0 14px",
    borderRadius: "10px",
    background: "#d7ff32",
    border:
      "1px solid #d7ff32",
    color: "#07100b",
    fontWeight: 900,
    cursor: "pointer",
  },

  installNote: {
    marginTop: "18px",
    padding: "13px",
    borderRadius: "11px",
    background:
      "rgba(255,230,0,0.045)",
    border:
      "1px solid rgba(255,230,0,0.12)",
    display: "flex",
    flexDirection: "column",
    gap: "5px",
    color: "#8795a7",
    fontSize: "10px",
    lineHeight: 1.55,
  },

  installNoteStrong: {
    color: "#ffe600",
    fontSize: "11px",
  },

  deploymentNote: {
    marginTop: "10px",
    padding: "12px",
    borderRadius: "11px",
    background:
      "rgba(215,255,50,0.045)",
    border:
      "1px solid rgba(215,255,50,0.12)",
    display: "flex",
    alignItems: "flex-start",
    gap: "8px",
    color: "#91a0b2",
    fontSize: "10px",
    lineHeight: 1.55,
  },

  paymentGrid: {
    display: "grid",
    gridTemplateColumns:
      "minmax(0, 1fr)",
    gap: "16px",
  },

  paymentStatusCard: {
    display: "flex",
    alignItems: "flex-start",
    gap: "12px",
    padding: "17px",
    borderRadius: "14px",
    background:
      "rgba(215,255,50,0.045)",
    border:
      "1px solid rgba(215,255,50,0.14)",
  },

  paymentStatusIcon: {
    width: "42px",
    height: "42px",
    minWidth: "42px",
    borderRadius: "11px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background:
      "rgba(215,255,50,0.10)",
    color: "#d7ff32",
  },

  paymentStatusTitle: {
    display: "block",
    color: "#ffffff",
    fontSize: "13px",
  },

  paymentStatusText: {
    margin: "5px 0 0",
    color: "#7e8da1",
    fontSize: "11px",
    lineHeight: 1.6,
  },

  paymentForm: {
    display: "flex",
    flexDirection: "column",
    gap: "14px",
    minWidth: 0,
  },

  paymentLabel: {
    display: "flex",
    flexDirection: "column",
    gap: "7px",
    color: "#b7c1cf",
    fontSize: "11px",
    fontWeight: 700,
  },

  paymentInput: {
    width: "100%",
    minHeight: "44px",
    padding: "0 12px",
    borderRadius: "10px",
    border:
      "1px solid #334052",
    background: "#0a1119",
    color: "#ffffff",
    outline: "none",
  },

  paymentSecretWrap: {
    display: "flex",
    alignItems: "center",
    borderRadius: "10px",
    border:
      "1px solid #334052",
    background: "#0a1119",
    overflow: "hidden",
  },

  paymentSecretInput: {
    flex: 1,
    minWidth: 0,
    height: "44px",
    padding: "0 12px",
    border: "none",
    background: "transparent",
    color: "#ffffff",
    outline: "none",
  },

  paymentEyeButton: {
    width: "44px",
    height: "44px",
    border: "none",
    background: "transparent",
    color: "#8b98a9",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  },

  paymentToggleRow: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    color: "#aeb9c8",
    fontSize: "11px",
    cursor: "pointer",
  },

  paymentSaveButton: {
    alignSelf: "flex-start",
    minHeight: "43px",
    background: "#d7ff32",
    color: "#07100b",
    border: "none",
    fontWeight: 900,
  },

  paymentSecurityNote: {
    marginTop: "16px",
    padding: "13px",
    borderRadius: "11px",
    background:
      "rgba(215,255,50,0.04)",
    border:
      "1px solid rgba(215,255,50,0.12)",
    display: "flex",
    alignItems: "flex-start",
    gap: "8px",
    color: "#8795a7",
    fontSize: "10px",
    lineHeight: 1.55,
  },

  systemCard: {
    display: "flex",
    alignItems: "flex-start",
    gap: "13px",
    padding: "17px",
    borderRadius: "14px",
    background:
      "linear-gradient(135deg, rgba(215,255,50,0.06), rgba(255,230,0,0.025))",
    border:
      "1px solid rgba(215,255,50,0.14)",
  },

  systemIcon: {
    width: "40px",
    height: "40px",
    minWidth: "40px",
    borderRadius: "11px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background:
      "rgba(215,255,50,0.09)",
    color: "#d7ff32",
  },

  systemTitle: {
    display: "block",
    color: "#ffffff",
    fontSize: "13px",
  },

  systemText: {
    margin: "5px 0 0",
    color: "#7e8da1",
    fontSize: "11px",
    lineHeight: 1.5,
  },

  saveButton: {
    minHeight: "42px",
    padding: "0 15px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "7px",
    background: "#d7ff32",
    color: "#07100b",
    border: "none",
    borderRadius: "10px",
    fontWeight: 900,
  },

  errorAlert: {
    marginTop: "16px",
    padding: "12px 14px",
    display: "flex",
    alignItems: "flex-start",
    gap: "8px",
    borderRadius: "11px",
    background:
      "rgba(255,70,80,0.08)",
    border:
      "1px solid rgba(255,70,80,0.22)",
    color: "#ff7b84",
    fontSize: "12px",
    lineHeight: 1.45,
  },

  successAlert: {
    marginTop: "16px",
    padding: "12px 14px",
    display: "flex",
    alignItems: "flex-start",
    gap: "8px",
    borderRadius: "11px",
    background:
      "rgba(215,255,50,0.07)",
    border:
      "1px solid rgba(215,255,50,0.20)",
    color: "#d7ff32",
    fontSize: "12px",
    lineHeight: 1.45,
  },
}