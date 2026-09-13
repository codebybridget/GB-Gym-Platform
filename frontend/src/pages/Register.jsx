import { useState } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"

import { registerUser } from "../api/api.js"

export default function Register() {
  const navigate = useNavigate()
  const location = useLocation()

  const searchParams = new URLSearchParams(location.search)

  const gymSlug =
    searchParams.get("gym") ||
    sessionStorage.getItem("gb_entry_gym") ||
    ""

  const storedGymName =
    sessionStorage.getItem("gb_entry_gym_name") || ""

  const [showForm, setShowForm] = useState(false)

  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const gymDisplayName =
    storedGymName.trim() ||
    formatGymName(gymSlug) ||
    "Your Gym"

  const buildLoginPath = () => {
    if (gymSlug.trim()) {
      return `/login?gym=${encodeURIComponent(
        gymSlug.trim(),
      )}`
    }

    return "/login"
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError("")

    if (
      !firstName.trim() ||
      !lastName.trim() ||
      !email.trim() ||
      !password
    ) {
      setError(
        "First name, last name, email and password are required.",
      )
      return
    }

    if (password.length < 6) {
      setError(
        "Password must be at least 6 characters.",
      )
      return
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.")
      return
    }

    if (!gymSlug.trim()) {
      setError(
        "A gym could not be identified. Please use the registration link or QR code provided by your gym.",
      )
      return
    }

    try {
      setLoading(true)

      const data = await registerUser({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim().toLowerCase(),
        password,
        phone: phone.trim(),
        gymSlug: gymSlug.trim(),
      })

      if (!data?.success) {
        throw new Error(
          data?.message ||
            "Unable to create account.",
        )
      }

      navigate(buildLoginPath(), {
        replace: true,
        state: {
          message: `Your member account for ${gymDisplayName} has been created. Please sign in.`,
        },
      })
    } catch (registerError) {
      console.error(
        "Registration error:",
        registerError,
      )

      const message =
        registerError?.response?.data?.message ||
        registerError?.message ||
        "Unable to create account."

      setError(message)
    } finally {
      setLoading(false)
    }
  }

  if (!showForm) {
    return (
      <div className="min-h-screen bg-[#020617] px-4 py-8 text-white">
        <div className="flex min-h-[calc(100vh-4rem)] w-full items-center justify-center">
          <div className="w-full max-w-2xl rounded-[2rem] border border-white/10 bg-[#111322] px-8 py-11 shadow-2xl sm:px-11 sm:py-12">
            <div className="text-center">
              <div className="mx-auto mb-7 flex h-[90px] w-[90px] items-center justify-center rounded-[1.4rem] bg-lime-400 text-3xl font-black text-black">
                {getInitials(
                  gymDisplayName,
                )}
              </div>

              <p className="text-xs font-black uppercase tracking-[0.25em] text-lime-400">
                {gymDisplayName}
              </p>

              <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-[40px]">
                Create Your Account
              </h1>

              <p className="mt-4 text-lg text-slate-400">
                Create your {gymDisplayName} member account.
              </p>

              {gymSlug && (
                <p className="mt-3 text-xs text-slate-500">
                  Gym: {gymSlug}
                </p>
              )}
            </div>

            <div className="mt-12">
              <button
                type="button"
                onClick={() =>
                  setShowForm(true)
                }
                className="w-full rounded-2xl bg-lime-400 px-6 py-5 text-xl font-medium text-slate-950 transition hover:bg-lime-300"
              >
                Create an Account
              </button>

              <div className="mt-8 text-center">
                <Link
                  to={buildLoginPath()}
                  className="text-lg font-medium text-slate-300 underline underline-offset-4 transition hover:text-white"
                >
                  Already have an account? Sign In
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#020617] px-4 py-8 text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-2xl items-center justify-center">
        <div className="w-full rounded-3xl border border-white/10 bg-[#111322] p-8 shadow-2xl sm:p-10">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-lime-400 text-xl font-black text-black">
              {getInitials(
                gymDisplayName,
              )}
            </div>

            <p className="text-xs font-black uppercase tracking-[0.2em] text-lime-400">
              {gymDisplayName}
            </p>

            <h1 className="mt-2 text-3xl font-bold">
              Create Member Account
            </h1>

            <p className="mt-2 text-base text-slate-400">
              Join {gymDisplayName} and start your fitness journey.
            </p>
          </div>

          {gymSlug && (
            <div className="mb-6 rounded-2xl border border-lime-400/10 bg-lime-400/5 px-4 py-3 text-center">
              <p className="text-[10px] font-black uppercase tracking-wider text-lime-400">
                Joining Gym
              </p>

              <p className="mt-1 text-sm font-bold text-white">
                {gymDisplayName}
              </p>
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="space-y-5"
          >
            <div>
              <label
                htmlFor="firstName"
                className="mb-2 block text-sm font-semibold text-slate-300"
              >
                First Name
              </label>

              <input
                id="firstName"
                type="text"
                value={firstName}
                onChange={(event) =>
                  setFirstName(
                    event.target.value,
                  )
                }
                placeholder="Enter your first name"
                autoComplete="given-name"
                disabled={loading}
                className="w-full rounded-xl border border-white/10 bg-slate-900/70 px-4 py-3.5 text-white outline-none transition placeholder:text-slate-500 focus:border-lime-400 focus:ring-2 focus:ring-lime-400/10 disabled:cursor-not-allowed disabled:opacity-60"
              />
            </div>

            <div>
              <label
                htmlFor="lastName"
                className="mb-2 block text-sm font-semibold text-slate-300"
              >
                Last Name
              </label>

              <input
                id="lastName"
                type="text"
                value={lastName}
                onChange={(event) =>
                  setLastName(
                    event.target.value,
                  )
                }
                placeholder="Enter your last name"
                autoComplete="family-name"
                disabled={loading}
                className="w-full rounded-xl border border-white/10 bg-slate-900/70 px-4 py-3.5 text-white outline-none transition placeholder:text-slate-500 focus:border-lime-400 focus:ring-2 focus:ring-lime-400/10 disabled:cursor-not-allowed disabled:opacity-60"
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-semibold text-slate-300"
              >
                Email
              </label>

              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) =>
                  setEmail(
                    event.target.value,
                  )
                }
                placeholder="Enter your email"
                autoComplete="email"
                disabled={loading}
                className="w-full rounded-xl border border-white/10 bg-slate-900/70 px-4 py-3.5 text-white outline-none transition placeholder:text-slate-500 focus:border-lime-400 focus:ring-2 focus:ring-lime-400/10 disabled:cursor-not-allowed disabled:opacity-60"
              />
            </div>

            <div>
              <label
                htmlFor="phone"
                className="mb-2 block text-sm font-semibold text-slate-300"
              >
                Phone{" "}
                <span className="ml-1 text-slate-500">
                  (optional)
                </span>
              </label>

              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={(event) =>
                  setPhone(
                    event.target.value,
                  )
                }
                placeholder="Enter your phone number"
                autoComplete="tel"
                disabled={loading}
                className="w-full rounded-xl border border-white/10 bg-slate-900/70 px-4 py-3.5 text-white outline-none transition placeholder:text-slate-500 focus:border-lime-400 focus:ring-2 focus:ring-lime-400/10 disabled:cursor-not-allowed disabled:opacity-60"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-semibold text-slate-300"
              >
                Password
              </label>

              <input
                id="password"
                type="password"
                value={password}
                onChange={(event) =>
                  setPassword(
                    event.target.value,
                  )
                }
                placeholder="Create a password"
                autoComplete="new-password"
                disabled={loading}
                className="w-full rounded-xl border border-white/10 bg-slate-900/70 px-4 py-3.5 text-white outline-none transition placeholder:text-slate-500 focus:border-lime-400 focus:ring-2 focus:ring-lime-400/10 disabled:cursor-not-allowed disabled:opacity-60"
              />
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="mb-2 block text-sm font-semibold text-slate-300"
              >
                Confirm Password
              </label>

              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(event) =>
                  setConfirmPassword(
                    event.target.value,
                  )
                }
                placeholder="Confirm your password"
                autoComplete="new-password"
                disabled={loading}
                className="w-full rounded-xl border border-white/10 bg-slate-900/70 px-4 py-3.5 text-white outline-none transition placeholder:text-slate-500 focus:border-lime-400 focus:ring-2 focus:ring-lime-400/10 disabled:cursor-not-allowed disabled:opacity-60"
              />
            </div>

            {error && (
              <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-lime-400 px-4 py-3.5 font-bold text-slate-950 transition hover:bg-lime-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading
                ? "Creating account..."
                : `Join ${gymDisplayName}`}
            </button>
          </form>

          <div className="mt-7 text-center">
            <button
              type="button"
              onClick={() =>
                setShowForm(false)
              }
              className="text-sm font-semibold text-slate-300 underline underline-offset-4 hover:text-white"
            >
              Back
            </button>

            <span className="mx-3 text-slate-600">
              |
            </span>

            <Link
              to={buildLoginPath()}
              className="text-sm font-semibold text-slate-300 underline underline-offset-4 hover:text-white"
            >
              Already have an account? Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
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