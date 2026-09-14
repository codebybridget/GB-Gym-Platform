import { useEffect, useState } from "react"
import {
  Link,
  useNavigate,
  useSearchParams,
} from "react-router-dom"

import { auth, gyms, setAccessToken } from "../api/api.js"

export default function TrainerLogin() {
  const navigate = useNavigate()
  const [params] = useSearchParams()

  const [gymSlug, setGymSlug] = useState(
    params.get("gym") ||
      sessionStorage.getItem("gb_entry_gym") ||
      "",
  )

  const [gymName, setGymName] =
    useState("Gym")

  const [gymLogo, setGymLogo] =
    useState("")

  const [gymLoading, setGymLoading] =
    useState(true)

  const [email, setEmail] =
    useState("")

  const [code, setCode] =
    useState("")

  const [step, setStep] =
    useState("email")

  const [message, setMessage] =
    useState("")

  const [error, setError] =
    useState("")

  const [loading, setLoading] =
    useState(false)

  /*
   * Preserve the gym portal when the trainer
   * arrives through a gym QR code/link.
   */
  useEffect(() => {
    const slug =
      params.get("gym") ||
      sessionStorage.getItem(
        "gb_entry_gym",
      ) ||
      ""

    if (slug.trim()) {
      sessionStorage.setItem(
        "gb_entry_gym",
        slug.trim(),
      )

      setGymSlug(slug.trim())
    }
  }, [params])

  /*
   * Load the actual gym name/logo.
   */
  useEffect(() => {
    let mounted = true

    const loadGym = async () => {
      if (!gymSlug.trim()) {
        if (mounted) {
          setGymLoading(false)
          setGymName("Gym")
          setGymLogo("")
        }

        return
      }

      try {
        setGymLoading(true)

        const response =
          await gyms.entry(
            gymSlug.trim(),
          )

        if (!mounted) {
          return
        }

        const gym =
          response?.data?.gym ||
          response?.gym ||
          response?.data

        if (gym) {
          setGymName(
            gym.name ||
              gym.gymName ||
              formatGymName(
                gymSlug,
              ) ||
              "Gym",
          )

          setGymLogo(
            gym.logoUrl ||
              gym.logo ||
              "",
          )
        } else {
          setGymName(
            formatGymName(
              gymSlug,
            ) || "Gym",
          )
        }
      } catch (gymError) {
        console.error(
          "Trainer gym loading error:",
          gymError,
        )

        if (mounted) {
          setGymName(
            formatGymName(
              gymSlug,
            ) || "Gym",
          )

          setGymLogo("")
        }
      } finally {
        if (mounted) {
          setGymLoading(false)
        }
      }
    }

    loadGym()

    return () => {
      mounted = false
    }
  }, [gymSlug])

  const requestCode = async (
    event,
  ) => {
    event.preventDefault()

    setError("")
    setMessage("")

    if (!gymSlug.trim()) {
      setError(
        "This trainer login must be opened from your gym's trainer link or QR code.",
      )
      return
    }

    if (!email.trim()) {
      setError(
        "Please enter your trainer email.",
      )
      return
    }

    try {
      setLoading(true)

      /*
       * The gym slug comes from the gym portal.
       * It is not entered manually by the trainer.
       */
      const data =
        await auth.requestTrainerLoginCode(
          email.trim().toLowerCase(),
          gymSlug.trim(),
        )

      setMessage(
        data?.message ||
          `Login code sent to your ${gymName} email.`,
      )

      setStep("code")
    } catch (requestError) {
      setError(
        requestError?.response?.data
          ?.message ||
          requestError?.message ||
          "Unable to send login code.",
      )
    } finally {
      setLoading(false)
    }
  }

  const verifyCode = async (
    event,
  ) => {
    event.preventDefault()

    setError("")
    setMessage("")

    if (!gymSlug.trim()) {
      setError(
        "This trainer login must be opened from your gym's trainer link or QR code.",
      )
      return
    }

    if (!/^\d{6}$/.test(code.trim())) {
      setError(
        "Enter the six-digit verification code.",
      )
      return
    }

    try {
      setLoading(true)

      const data =
        await auth.verifyTrainerLoginCode(
          email.trim().toLowerCase(),
          code.trim(),
          gymSlug.trim(),
        )

      if (
        !data?.token ||
        !data?.user
      ) {
        throw new Error(
          "Trainer login succeeded but no session was returned.",
        )
      }

      /*
       * Never allow a platform-owner account
       * to enter the trainer portal.
       */
      if (
        data.user.role ===
        "platform_owner"
      ) {
        throw new Error(
          "Platform owner accounts cannot sign in through a gym trainer portal.",
        )
      }

      /*
       * Confirm the authenticated trainer
       * belongs to the selected gym.
       */
      const authenticatedGymSlug =
        data.user?.gym?.slug ||
        data.user?.gymSlug ||
        ""

      if (
        authenticatedGymSlug &&
        authenticatedGymSlug !==
          gymSlug.trim()
      ) {
        throw new Error(
          `This trainer account does not belong to ${gymName}.`,
        )
      }

      if (
        data.user.role !==
        "trainer"
      ) {
        throw new Error(
          "This account is not registered as a trainer for this gym.",
        )
      }

      setAccessToken(
        data.token,
      )

      localStorage.setItem(
        "user",
        JSON.stringify(
          data.user,
        ),
      )

      /*
       * Keep the gym portal context for the
       * authenticated trainer session.
       */
      sessionStorage.setItem(
        "gb_entry_gym",
        gymSlug.trim(),
      )

      navigate("/trainer", {
        replace: true,
      })
    } catch (verifyError) {
      console.error(
        "Trainer verification error:",
        verifyError,
      )

      setError(
        verifyError?.response?.data
          ?.message ||
          verifyError?.message ||
          "Invalid login code.",
      )
    } finally {
      setLoading(false)
    }
  }

  const backToGym = () => {
    if (gymSlug.trim()) {
      navigate(
        `/gym/${encodeURIComponent(
          gymSlug.trim(),
        )}`,
      )

      return
    }

    navigate("/login")
  }

  if (gymLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#020617] px-4 text-white">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#D9FF3F] text-xl font-black text-[#020617]">
            GY
          </div>

          <p className="text-sm font-semibold text-slate-400">
            Loading gym...
          </p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#020617] px-4 py-8 text-white sm:px-6 lg:py-12">
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <section className="w-full max-w-xl rounded-[32px] border border-white/10 bg-[#111322] p-7 shadow-2xl sm:p-10">
          <div className="text-center">
            {gymLogo ? (
              <img
                src={gymLogo}
                alt={`${gymName} logo`}
                className="mx-auto mb-6 h-20 w-20 rounded-2xl object-cover shadow-xl"
              />
            ) : (
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-[#D9FF3F] text-xl font-black text-[#020617]">
                {getInitials(
                  gymName,
                )}
              </div>
            )}

            <p className="text-xs font-black uppercase tracking-[0.25em] text-[#D9FF3F]">
              {gymName}
            </p>

            <h1 className="mt-3 text-3xl font-black tracking-tight">
              Trainer Sign In
            </h1>

            <p className="mt-3 text-sm leading-6 text-slate-400">
              Sign in to the {gymName} Trainer Portal. A one-time verification code will be sent to your registered trainer email.
            </p>
          </div>

          {step === "email" ? (
            <form
              onSubmit={requestCode}
              className="mt-8 space-y-5"
            >
              <label className="block">
                <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-400">
                  Trainer Email
                </span>

                <input
                  type="email"
                  value={email}
                  onChange={(event) =>
                    setEmail(
                      event.target.value,
                    )
                  }
                  placeholder="trainer@example.com"
                  autoComplete="email"
                  disabled={loading}
                  className="w-full rounded-2xl border border-white/10 bg-[#020617] px-4 py-4 text-white outline-none transition placeholder:text-slate-600 focus:border-[#D9FF3F] focus:ring-2 focus:ring-[#D9FF3F]/10 disabled:cursor-not-allowed disabled:opacity-60"
                />
              </label>

              <div className="rounded-2xl border border-[#D9FF3F]/10 bg-[#D9FF3F]/5 px-4 py-4">
                <p className="text-xs font-black uppercase tracking-wider text-[#D9FF3F]">
                  Gym
                </p>

                <p className="mt-1 font-bold text-white">
                  {gymName}
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Your gym is automatically identified from this trainer portal.
                </p>
              </div>

              {error && (
                <p className="text-sm text-red-400">
                  {error}
                </p>
              )}

              {message && (
                <p className="text-sm text-[#D9FF3F]">
                  {message}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl bg-[#D9FF3F] px-5 py-4 font-black text-[#020617] transition hover:bg-[#E7FF72] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading
                  ? "SENDING CODE..."
                  : "SEND LOGIN CODE"}
              </button>

              <button
                type="button"
                onClick={backToGym}
                className="w-full py-2 text-sm font-bold text-slate-400 transition hover:text-white"
              >
                ← Back to {gymName}
              </button>
            </form>
          ) : (
            <form
              onSubmit={verifyCode}
              className="mt-8 space-y-5"
            >
              <div className="rounded-2xl border border-[#D9FF3F]/20 bg-[#D9FF3F]/5 p-4 text-sm text-slate-300">
                We sent a six-digit code to{" "}
                <strong className="text-white">
                  {email}
                </strong>
                .
              </div>

              <label className="block">
                <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-400">
                  Verification Code
                </span>

                <input
                  inputMode="numeric"
                  maxLength={6}
                  value={code}
                  onChange={(event) =>
                    setCode(
                      event.target.value
                        .replace(
                          /\D/g,
                          "",
                        ),
                    )
                  }
                  placeholder="000000"
                  autoComplete="one-time-code"
                  disabled={loading}
                  className="w-full rounded-2xl border border-white/10 bg-[#020617] px-4 py-5 text-center text-3xl font-black tracking-[0.5em] text-white outline-none transition placeholder:text-slate-700 focus:border-[#D9FF3F] focus:ring-2 focus:ring-[#D9FF3F]/10 disabled:cursor-not-allowed disabled:opacity-60"
                />
              </label>

              <div className="rounded-2xl border border-[#D9FF3F]/10 bg-[#D9FF3F]/5 px-4 py-4">
                <p className="text-xs font-black uppercase tracking-wider text-[#D9FF3F]">
                  Gym
                </p>

                <p className="mt-1 font-bold text-white">
                  {gymName}
                </p>
              </div>

              {error && (
                <p className="text-sm text-red-400">
                  {error}
                </p>
              )}

              {message && (
                <p className="text-sm text-[#D9FF3F]">
                  {message}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl bg-[#D9FF3F] px-5 py-4 font-black text-[#020617] transition hover:bg-[#E7FF72] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading
                  ? "VERIFYING..."
                  : "CONTINUE TO TRAINER DASHBOARD"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setCode("")
                  setError("")
                  setMessage("")
                  setStep("email")
                }}
                className="w-full py-2 text-sm font-bold text-slate-400 transition hover:text-white"
              >
                Use a different email / request another code
              </button>

              <button
                type="button"
                onClick={backToGym}
                className="w-full py-2 text-sm font-bold text-slate-500 transition hover:text-white"
              >
                ← Back to {gymName}
              </button>
            </form>
          )}

          <div className="mt-7 border-t border-white/10 pt-6 text-center">
            <Link
              to={
                gymSlug.trim()
                  ? `/login?gym=${encodeURIComponent(
                      gymSlug.trim(),
                    )}`
                  : "/login"
              }
              className="text-sm font-semibold text-slate-500 transition hover:text-white"
            >
              Member Login
            </Link>
          </div>
        </section>
      </div>
    </main>
  )
}

function formatGymName(slug) {
  if (!slug?.trim()) {
    return ""
  }

  return slug
    .trim()
    .split("-")
    .filter(Boolean)
    .map(
      (word) =>
        word.charAt(0).toUpperCase() +
        word.slice(1),
    )
    .join(" ")
}

function getInitials(name) {
  const words = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)

  if (!words.length) {
    return "GY"
  }

  if (words.length === 1) {
    return words[0]
      .slice(0, 2)
      .toUpperCase()
  }

  return `${words[0][0]}${words[1][0]}`.toUpperCase()
}