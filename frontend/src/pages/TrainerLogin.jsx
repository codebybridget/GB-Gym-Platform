import { useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { auth, setAccessToken } from "../api/api.js"

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api"

export default function TrainerLogin() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [email, setEmail] = useState("")
  const [gymSlug, setGymSlug] = useState(params.get("gym") || sessionStorage.getItem("gb_entry_gym") || "")
  const [code, setCode] = useState("")
  const [step, setStep] = useState("email")
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const requestCode = async (event) => {
    event.preventDefault()
    setError("")
    setMessage("")

    if (!email.trim()) {
      setError("Please enter your trainer email.")
      return
    }

    try {
      setLoading(true)
      const data = await auth.requestTrainerLoginCode(email.trim(), gymSlug.trim())
      setMessage(data?.message || "Login code sent to your email.")
      setStep("code")
    } catch (requestError) {
      setError(requestError?.response?.data?.message || requestError?.message || "Unable to send login code.")
    } finally {
      setLoading(false)
    }
  }

  const verifyCode = async (event) => {
    event.preventDefault()
    setError("")
    setMessage("")

    if (!/^\d{6}$/.test(code.trim())) {
      setError("Enter the six-digit verification code.")
      return
    }

    try {
      setLoading(true)
      const data = await auth.verifyTrainerLoginCode(email.trim(), code.trim(), gymSlug.trim())

      if (!data?.token || !data?.user) {
        throw new Error("Trainer login succeeded but no session was returned.")
      }

      setAccessToken(data.token)
      localStorage.setItem("user", JSON.stringify(data.user))
      window.location.href = "/trainer"
    } catch (verifyError) {
      setError(verifyError?.response?.data?.message || verifyError?.message || "Invalid login code.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-8 text-white">
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <div className="w-full max-w-xl rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-xl sm:p-10">
          <div className="text-center">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-xl font-black text-slate-950">
              CGF
            </div>
            <p className="text-xs font-black uppercase tracking-[0.25em] text-lime-400">
              Trainer Portal
            </p>
            <h1 className="mt-3 text-3xl font-black tracking-tight">
              Trainer Sign In
            </h1>
            <p className="mt-3 text-sm leading-6 text-slate-400">
              Use the email registered by CGF administration. We will send you a one-time login code.
            </p>
          </div>

          {step === "email" ? (
            <form onSubmit={requestCode} className="mt-8 space-y-5">
              <label className="block">
                <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-400">
                  Trainer Email
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="trainer@example.com"
                  autoComplete="email"
                  className="w-full rounded-2xl border border-white/10 bg-black px-4 py-4 text-white outline-none transition focus:border-lime-400"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-400">
                  Gym Code <span className="text-slate-600">(optional unless your email is used at multiple gyms)</span>
                </span>
                <input
                  type="text"
                  value={gymSlug}
                  onChange={(event) => setGymSlug(event.target.value.toLowerCase().trim())}
                  placeholder="e.g. gb-fitness"
                  autoComplete="organization"
                  className="w-full rounded-2xl border border-white/10 bg-black px-4 py-4 text-white outline-none transition focus:border-lime-400"
                />
              </label>

              {error ? <p className="text-sm text-red-400">{error}</p> : null}
              {message ? <p className="text-sm text-lime-400">{message}</p> : null}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl bg-lime-400 px-5 py-4 font-black text-slate-950 transition hover:bg-lime-300 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? "SENDING CODE..." : "SEND LOGIN CODE"}
              </button>

              <button
                type="button"
                onClick={() => navigate("/login")}
                className="w-full py-2 text-sm font-bold text-slate-400 hover:text-white"
              >
                Back to member login
              </button>
            </form>
          ) : (
            <form onSubmit={verifyCode} className="mt-8 space-y-5">
              <div className="rounded-2xl border border-lime-400/20 bg-lime-400/5 p-4 text-sm text-slate-300">
                We sent a six-digit code to <strong className="text-white">{email}</strong>.
              </div>

              <label className="block">
                <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-400">
                  Verification Code
                </span>
                <input
                  inputMode="numeric"
                  maxLength={6}
                  value={code}
                  onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))}
                  placeholder="000000"
                  autoComplete="one-time-code"
                  className="w-full rounded-2xl border border-white/10 bg-black px-4 py-5 text-center text-3xl font-black tracking-[0.5em] text-white outline-none transition focus:border-lime-400"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-400">
                  Gym Code <span className="text-slate-600">(optional unless your email is used at multiple gyms)</span>
                </span>
                <input
                  type="text"
                  value={gymSlug}
                  onChange={(event) => setGymSlug(event.target.value.toLowerCase().trim())}
                  placeholder="e.g. gb-fitness"
                  autoComplete="organization"
                  className="w-full rounded-2xl border border-white/10 bg-black px-4 py-4 text-white outline-none transition focus:border-lime-400"
                />
              </label>

              {error ? <p className="text-sm text-red-400">{error}</p> : null}
              {message ? <p className="text-sm text-lime-400">{message}</p> : null}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl bg-lime-400 px-5 py-4 font-black text-slate-950 transition hover:bg-lime-300 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? "VERIFYING..." : "CONTINUE TO TRAINER DASHBOARD"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setCode("")
                  setError("")
                  setMessage("")
                  setStep("email")
                }}
                className="w-full py-2 text-sm font-bold text-slate-400 hover:text-white"
              >
                Use a different email / request another code
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
