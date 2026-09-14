import { useEffect, useMemo, useState } from "react"
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom"
import {
  ArrowLeft,
  CheckCircle2,
  Dumbbell,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ShieldCheck,
  UserRound,
} from "lucide-react"
import { gyms } from "../api/api"
import { useAuth } from "../context/AuthContext"

const GYM_ENTRY_KEY = "gb_entry_gym"

function normalizeSlug(value) {
  return String(value || "").trim()
}

function getStoredGymSlug() {
  const sessionSlug = normalizeSlug(sessionStorage.getItem(GYM_ENTRY_KEY))
  if (sessionSlug) return sessionSlug

  const localSlug = normalizeSlug(localStorage.getItem(GYM_ENTRY_KEY))
  if (localSlug) return localSlug

  return ""
}

function saveGymSlug(slug) {
  const cleanSlug = normalizeSlug(slug)

  if (!cleanSlug) return

  sessionStorage.setItem(GYM_ENTRY_KEY, cleanSlug)
  localStorage.setItem(GYM_ENTRY_KEY, cleanSlug)
}

export default function TrainerLogin({ gymSlug: gymSlugProp = "" }) {
  const navigate = useNavigate()
  const { gymSlug: routeGymSlug } = useParams()
  const [searchParams] = useSearchParams()
  const auth = useAuth()

  const resolvedGymSlug = useMemo(() => {
    return (
      normalizeSlug(gymSlugProp) ||
      normalizeSlug(routeGymSlug) ||
      normalizeSlug(searchParams.get("gym")) ||
      getStoredGymSlug()
    )
  }, [gymSlugProp, routeGymSlug, searchParams])

  const [gymSlug, setGymSlug] = useState(resolvedGymSlug)
  const [gym, setGym] = useState(null)
  const [loadingGym, setLoadingGym] = useState(true)
  const [gymError, setGymError] = useState("")

  const [email, setEmail] = useState("")
  const [code, setCode] = useState("")
  const [step, setStep] = useState("email")

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const [showCode, setShowCode] = useState(false)

  useEffect(() => {
    const cleanSlug = normalizeSlug(resolvedGymSlug)

    if (!cleanSlug) {
      setGymSlug("")
      setGym(null)
      setLoadingGym(false)
      setGymError("Gym information is missing.")
      return
    }

    setGymSlug(cleanSlug)
    saveGymSlug(cleanSlug)
  }, [resolvedGymSlug])

  useEffect(() => {
    let cancelled = false

    async function loadGym() {
      const cleanSlug = normalizeSlug(resolvedGymSlug)

      if (!cleanSlug) {
        setLoadingGym(false)
        return
      }

      try {
        setLoadingGym(true)
        setGymError("")

        const response = await gyms.entry(cleanSlug)

        if (cancelled) return

        const data = response?.data?.gym || response?.data || null
        setGym(data)
      } catch (err) {
        if (cancelled) return

        setGym(null)
        setGymError(
          err?.response?.data?.message ||
            err?.message ||
            "Unable to load gym information.",
        )
      } finally {
        if (!cancelled) {
          setLoadingGym(false)
        }
      }
    }

    loadGym()

    return () => {
      cancelled = true
    }
  }, [resolvedGymSlug])

  const gymName = gym?.name || "Gym"

  const gymLogo =
    gym?.logo ||
    gym?.logoUrl ||
    gym?.logoURL ||
    gym?.branding?.logo ||
    ""

  const gymPrimaryColor =
    gym?.primaryColor ||
    gym?.branding?.primaryColor ||
    "#D7FF00"

  const loginPath = gymSlug
    ? `/gym/${encodeURIComponent(gymSlug)}/login`
    : "/login"

  const registerPath = gymSlug
    ? `/gym/${encodeURIComponent(gymSlug)}/register`
    : "/register"

  const gymEntryPath = gymSlug
    ? `/gym/${encodeURIComponent(gymSlug)}`
    : "/"

  const requestCode = async (event) => {
    event.preventDefault()

    const cleanEmail = email.trim().toLowerCase()
    const cleanSlug = normalizeSlug(gymSlug)

    if (!cleanEmail) {
      setError("Please enter your email address.")
      return
    }

    if (!cleanSlug) {
      setError("Gym information is missing. Please scan the gym QR code again.")
      return
    }

    setLoading(true)
    setError("")
    setSuccess("")

    try {
      if (!auth?.requestTrainerLoginCode) {
        throw new Error("Trainer login service is unavailable.")
      }

      await auth.requestTrainerLoginCode(cleanEmail, cleanSlug)

      setEmail(cleanEmail)
      setStep("code")
      setSuccess("A verification code has been sent to your email.")
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to send verification code.",
      )
    } finally {
      setLoading(false)
    }
  }

  const verifyCode = async (event) => {
    event.preventDefault()

    const cleanEmail = email.trim().toLowerCase()
    const cleanCode = code.trim()
    const cleanSlug = normalizeSlug(gymSlug)

    if (!cleanCode) {
      setError("Please enter the verification code.")
      return
    }

    if (!cleanSlug) {
      setError("Gym information is missing. Please scan the gym QR code again.")
      return
    }

    setLoading(true)
    setError("")
    setSuccess("")

    try {
      if (!auth?.verifyTrainerLoginCode) {
        throw new Error("Trainer verification service is unavailable.")
      }

      const response = await auth.verifyTrainerLoginCode(
        cleanEmail,
        cleanCode,
        cleanSlug,
      )

      const token =
        response?.accessToken ||
        response?.token ||
        response?.data?.accessToken ||
        response?.data?.token

      const user =
        response?.user ||
        response?.data?.user ||
        auth?.user ||
        null

      if (token) {
        localStorage.setItem("accessToken", token)
      }

      if (user) {
        localStorage.setItem("user", JSON.stringify(user))
      }

      saveGymSlug(cleanSlug)

      setSuccess("Login successful. Redirecting...")

      setTimeout(() => {
        navigate("/trainer", { replace: true })
      }, 500)
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Invalid or expired verification code.",
      )
    } finally {
      setLoading(false)
    }
  }

  const resendCode = async () => {
    const cleanEmail = email.trim().toLowerCase()
    const cleanSlug = normalizeSlug(gymSlug)

    if (!cleanEmail || !cleanSlug) {
      setError("Please enter your email and gym information.")
      return
    }

    setLoading(true)
    setError("")
    setSuccess("")

    try {
      if (!auth?.requestTrainerLoginCode) {
        throw new Error("Trainer login service is unavailable.")
      }

      await auth.requestTrainerLoginCode(cleanEmail, cleanSlug)

      setSuccess("A new verification code has been sent.")
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to resend verification code.",
      )
    } finally {
      setLoading(false)
    }
  }

  if (loadingGym) {
    return (
      <div className="min-h-screen bg-[#07111f] text-white flex items-center justify-center px-5">
        <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#0c1a2b] p-8 text-center shadow-2xl">
          <div
            className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl"
            style={{ backgroundColor: gymPrimaryColor }}
          >
            <Dumbbell className="h-8 w-8 text-[#07111f]" />
          </div>

          <div className="mx-auto mb-4 h-7 w-7 animate-spin rounded-full border-2 border-white/20 border-t-[#D7FF00]" />

          <p className="text-sm text-white/70">
            Loading gym information...
          </p>
        </div>
      </div>
    )
  }

  if (gymError && !gym) {
    return (
      <div className="min-h-screen bg-[#07111f] text-white flex items-center justify-center px-5">
        <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#0c1a2b] p-7 text-center shadow-2xl">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10">
            <ShieldCheck className="h-8 w-8 text-red-400" />
          </div>

          <h1 className="text-xl font-bold">
            Gym Not Found
          </h1>

          <p className="mt-3 text-sm leading-6 text-white/60">
            We could not load this gym. Please scan the gym QR code again or
            contact the gym administrator.
          </p>

          <Link
            to="/"
            className="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-2xl bg-[#D7FF00] px-5 font-bold text-[#07111f] transition hover:opacity-90"
          >
            Back to Home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#07111f] text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl items-center justify-center px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid w-full max-w-5xl overflow-hidden rounded-[2rem] border border-white/10 bg-[#0c1a2b] shadow-2xl lg:grid-cols-2">
          {/* Brand Panel */}
          <div className="relative hidden min-h-[650px] overflow-hidden bg-[#0a1727] p-10 lg:flex lg:flex-col lg:justify-between">
            <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-[#D7FF00]/10 blur-3xl" />
            <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-yellow-400/10 blur-3xl" />

            <div className="relative z-10">
              <Link
                to={gymEntryPath}
                className="inline-flex items-center gap-2 text-sm font-medium text-white/60 transition hover:text-white"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to {gymName}
              </Link>
            </div>

            <div className="relative z-10">
              <div className="mb-7 flex h-24 w-24 items-center justify-center overflow-hidden rounded-3xl border border-white/10 bg-white shadow-xl">
                {gymLogo ? (
                  <img
                    src={gymLogo}
                    alt={`${gymName} logo`}
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <Dumbbell
                    className="h-12 w-12 text-[#07111f]"
                    style={{ color: gymPrimaryColor }}
                  />
                )}
              </div>

              <p className="mb-3 text-sm font-bold uppercase tracking-[0.2em] text-[#D7FF00]">
                Trainer Portal
              </p>

              <h1 className="max-w-md text-4xl font-black leading-tight">
                Manage your gym training experience.
              </h1>

              <p className="mt-5 max-w-md text-base leading-7 text-white/60">
                Sign in securely to manage workouts, members, attendance,
                assignments, and your trainer activities.
              </p>
            </div>

            <div className="relative z-10 flex items-center gap-3 text-sm text-white/50">
              <ShieldCheck className="h-5 w-5 text-[#D7FF00]" />
              Secure gym-scoped trainer access
            </div>
          </div>

          {/* Login Panel */}
          <div className="p-5 sm:p-8 lg:p-10">
            <div className="mb-8 lg:hidden">
              <Link
                to={gymEntryPath}
                className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-white/60"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to {gymName}
              </Link>

              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl bg-white">
                  {gymLogo ? (
                    <img
                      src={gymLogo}
                      alt={`${gymName} logo`}
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    <Dumbbell
                      className="h-7 w-7"
                      style={{ color: gymPrimaryColor }}
                    />
                  )}
                </div>

                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#D7FF00]">
                    Trainer Portal
                  </p>
                  <h1 className="truncate text-xl font-black">
                    {gymName}
                  </h1>
                </div>
              </div>
            </div>

            <div className="mb-7">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#D7FF00]/10">
                {step === "email" ? (
                  <Mail className="h-6 w-6 text-[#D7FF00]" />
                ) : (
                  <LockKeyhole className="h-6 w-6 text-[#D7FF00]" />
                )}
              </div>

              <h2 className="text-2xl font-black sm:text-3xl">
                {step === "email"
                  ? "Trainer Login"
                  : "Enter Verification Code"}
              </h2>

              <p className="mt-2 text-sm leading-6 text-white/55">
                {step === "email"
                  ? `Sign in to ${gymName} using your trainer email.`
                  : `We sent a verification code to ${email}.`}
              </p>
            </div>

            {error && (
              <div className="mb-5 rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm leading-5 text-red-200">
                {error}
              </div>
            )}

            {success && (
              <div className="mb-5 flex items-start gap-3 rounded-2xl border border-[#D7FF00]/20 bg-[#D7FF00]/10 px-4 py-3 text-sm leading-5 text-[#D7FF00]">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
                <span>{success}</span>
              </div>
            )}

            {step === "email" ? (
              <form onSubmit={requestCode} className="space-y-5">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-white/80">
                    Trainer Email
                  </label>

                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/35" />

                    <input
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="trainer@example.com"
                      autoComplete="email"
                      disabled={loading}
                      className="h-14 w-full rounded-2xl border border-white/10 bg-[#07111f] pl-12 pr-4 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-[#D7FF00]/60 focus:ring-2 focus:ring-[#D7FF00]/10 disabled:opacity-60"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#D7FF00] px-5 font-black text-[#07111f] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <span className="h-5 w-5 animate-spin rounded-full border-2 border-[#07111f]/30 border-t-[#07111f]" />
                      Sending Code...
                    </>
                  ) : (
                    <>
                      Continue
                      <ArrowLeft className="h-5 w-5 rotate-180" />
                    </>
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={verifyCode} className="space-y-5">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-white/80">
                    Verification Code
                  </label>

                  <div className="relative">
                    <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/35" />

                    <input
                      type={showCode ? "text" : "password"}
                      value={code}
                      onChange={(event) => setCode(event.target.value)}
                      placeholder="Enter your code"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      disabled={loading}
                      className="h-14 w-full rounded-2xl border border-white/10 bg-[#07111f] pl-12 pr-12 text-center text-lg font-bold tracking-[0.35em] text-white outline-none transition placeholder:text-sm placeholder:font-normal placeholder:tracking-normal placeholder:text-white/25 focus:border-[#D7FF00]/60 focus:ring-2 focus:ring-[#D7FF00]/10 disabled:opacity-60"
                    />

                    <button
                      type="button"
                      onClick={() => setShowCode((value) => !value)}
                      className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-xl text-white/40 transition hover:bg-white/5 hover:text-white"
                      aria-label={showCode ? "Hide code" : "Show code"}
                    >
                      {showCode ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#D7FF00] px-5 font-black text-[#07111f] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <span className="h-5 w-5 animate-spin rounded-full border-2 border-[#07111f]/30 border-t-[#07111f]" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="h-5 w-5" />
                      Verify & Login
                    </>
                  )}
                </button>

                <div className="flex flex-col items-center gap-3 pt-1 sm:flex-row sm:justify-between">
                  <button
                    type="button"
                    onClick={() => {
                      setStep("email")
                      setCode("")
                      setError("")
                      setSuccess("")
                    }}
                    disabled={loading}
                    className="text-sm font-semibold text-white/55 transition hover:text-white disabled:opacity-50"
                  >
                    Use a different email
                  </button>

                  <button
                    type="button"
                    onClick={resendCode}
                    disabled={loading}
                    className="text-sm font-bold text-[#D7FF00] transition hover:opacity-80 disabled:opacity-50"
                  >
                    Resend code
                  </button>
                </div>
              </form>
            )}

            <div className="my-7 flex items-center gap-3">
              <div className="h-px flex-1 bg-white/10" />
              <span className="text-xs font-semibold uppercase tracking-wider text-white/30">
                Gym Access
              </span>
              <div className="h-px flex-1 bg-white/10" />
            </div>

            <div className="space-y-3">
              <Link
                to={loginPath}
                className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-5 text-sm font-bold text-white/80 transition hover:bg-white/[0.06] hover:text-white"
              >
                <UserRound className="h-4 w-4" />
                Member Login
              </Link>

              <Link
                to={registerPath}
                className="flex min-h-12 w-full items-center justify-center rounded-2xl px-5 text-sm font-bold text-white/50 transition hover:text-white"
              >
                New member? Create an account
              </Link>
            </div>

            <p className="mt-7 text-center text-xs leading-5 text-white/30">
              This login is securely scoped to{" "}
              <span className="font-semibold text-white/50">
                {gymName}
              </span>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}