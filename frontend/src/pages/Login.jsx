import { useState } from "react"
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom"
import { useAuth } from "../context/AuthContext.jsx"

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const [params] = useSearchParams()
  const gymSlug = params.get("gym") || sessionStorage.getItem("gb_entry_gym") || ""
  const isAdminLogin = location.pathname === "/admin-login"
  const { login, loading: authLoading } = useAuth()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [gymCode, setGymCode] = useState(gymSlug)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const redirectByRole = (loggedInUser) => {
    const role = loggedInUser?.role

    if (role === "platform_owner") {
      navigate("/platform", { replace: true })
      return
    }

    if (role === "admin") {
      navigate("/admin", { replace: true })
      return
    }

    if (role === "trainer") {
      navigate("/trainer", { replace: true })
      return
    }

    if (role === "member") {
      navigate("/dashboard", { replace: true })
      return
    }

    setError("Your account does not have a valid role. Please contact GB administration.")
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError("")

    if (!email.trim() || !password) {
      setError("Please enter your email and password.")
      return
    }

    try {
      setLoading(true)

      const result = await login(
        email.trim().toLowerCase(),
        password,
        gymCode.trim(),
      )

      const loggedInUser = result?.user

      if (!loggedInUser) {
        throw new Error("Login succeeded, but no user information was returned.")
      }

      redirectByRole(loggedInUser)
    } catch (loginError) {
      console.error("GB login error:", loginError)
      setError(
        loginError?.response?.data?.message ||
          loginError?.message ||
          "Unable to log in. Please check your email and password.",
      )
    } finally {
      setLoading(false)
    }
  }

  if (authLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#020617] px-4 text-white">
        <div className="text-sm font-semibold text-slate-400">
          Checking your session...
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#020617] px-4 py-8 text-white sm:px-6 lg:py-12">
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <section className="w-full max-w-[520px] rounded-[32px] border border-white/10 bg-[#111322] px-6 py-10 shadow-2xl sm:px-10">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-lime-400 text-2xl font-black text-black">
              GB
            </div>

            <p className="text-xs font-black uppercase tracking-[0.25em] text-lime-400">
              GB Gym Platform
            </p>

            <h1 className="mt-3 text-4xl font-black tracking-tight">
              Welcome Back
            </h1>

            <p className="mt-3 text-slate-400">
              Sign in to your GB account
            </p>

            {gymSlug && (
              <p className="mt-2 text-xs text-slate-500">
                Gym: {gymSlug}
              </p>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="login-email"
                className="mb-2 block text-sm font-bold text-slate-300"
              >
                Email
              </label>

              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Enter your email"
                autoComplete="username"
                disabled={loading}
                className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-4 text-white outline-none transition focus:border-lime-400 disabled:cursor-not-allowed disabled:opacity-60"
              />
            </div>

            <div>
              <label
                htmlFor="login-password"
                className="mb-2 block text-sm font-bold text-slate-300"
              >
                Password
              </label>

              <input
                id="login-password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter your password"
                autoComplete="current-password"
                disabled={loading}
                className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-4 text-white outline-none transition focus:border-lime-400 disabled:cursor-not-allowed disabled:opacity-60"
              />
            </div>

            <div>
              <label htmlFor="login-gym-code" className="mb-2 block text-sm font-bold text-slate-300">
                Gym Code <span className="font-normal text-slate-500">(optional)</span>
              </label>
              <input
                id="login-gym-code"
                type="text"
                value={gymCode}
                onChange={(event) => setGymCode(event.target.value.toLowerCase().trim())}
                placeholder="Enter gym code if required"
                autoComplete="organization"
                disabled={loading}
                className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-4 text-white outline-none transition focus:border-lime-400 disabled:cursor-not-allowed disabled:opacity-60"
              />
            </div>

            {location.state?.message && (
              <div className="rounded-xl border border-lime-400/20 bg-lime-400/5 px-4 py-3 text-sm text-lime-300">
                {location.state.message}
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
              <Link
                to="/trainer-login"
                className="font-semibold text-lime-400 transition hover:text-lime-300"
              >
                Trainer sign in
              </Link>
              {isAdminLogin ? (
                <Link
                  to="/admin-forgot-password"
                  className="font-semibold text-slate-400 transition hover:text-white"
                >
                  Admin password reset
                </Link>
              ) : null}
              <Link
                to="/forgot-password"
                className="font-semibold text-slate-400 transition hover:text-white"
              >
                Forgot Password?
              </Link>
            </div>

            {error && (
              <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-lime-400 px-4 py-4 font-black text-black transition hover:bg-lime-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "SIGNING IN..." : "SIGN IN"}
            </button>
          </form>

          <div className="mt-7 border-t border-white/10 pt-6 text-center text-sm">
            <span className="text-slate-500">New gym?</span>{" "}
            <Link
              to="/register-gym"
              className="font-bold text-lime-400 transition hover:text-lime-300"
            >
              Register Your Gym
            </Link>
          </div>
        </section>
      </div>
    </main>
  )
}
