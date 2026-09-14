import { useEffect, useState } from "react"
import {
  Link,
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router-dom"
import { useAuth } from "../context/AuthContext.jsx"
import { gyms } from "../api/api.js"

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const [params] = useSearchParams()

  const [gymName, setGymName] = useState("Gym")
  const [gymLogo, setGymLogo] = useState("")
  const [gymLoading, setGymLoading] = useState(false)

  const gymSlug =
    params.get("gym") ||
    sessionStorage.getItem("gb_entry_gym") ||
    ""

  const isGymLogin = Boolean(gymSlug.trim())

  const isAdminLogin =
    location.pathname === "/admin-login"

  const { login, loading: authLoading } = useAuth()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  /*
   * Load the gym branding when the visitor came
   * through a gym-specific portal or QR code.
   */
  useEffect(() => {
    let mounted = true

    const loadGym = async () => {
      if (!gymSlug.trim()) {
        return
      }

      try {
        setGymLoading(true)

        const response = await gyms.entry(
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
              "Gym",
          )

          setGymLogo(
            gym.logoUrl ||
              gym.logo ||
              "",
          )
        }
      } catch (gymError) {
        console.error(
          "Gym entry loading error:",
          gymError,
        )

        if (mounted) {
          setGymName("Gym")
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

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError("")

    if (!email.trim() || !password) {
      setError(
        "Please enter your email and password.",
      )
      return
    }

    try {
      setLoading(true)

      /*
       * When a visitor came through a gym portal,
       * the gym slug is always passed to the backend.
       *
       * This prevents the login from becoming a
       * generic GB Platform login.
       */
      const result = await login(
        email.trim().toLowerCase(),
        password,
        gymSlug.trim(),
      )

      const loggedInUser = result?.user

      if (!loggedInUser) {
        throw new Error(
          "Login succeeded, but no user information was returned.",
        )
      }

      const role = loggedInUser?.role

      /*
       * GYM-SPECIFIC LOGIN
       *
       * A visitor who entered through:
       *
       * /gym/cgf-fitness
       *
       * must remain inside that gym's ecosystem.
       *
       * Platform owners are NEVER allowed to enter
       * through a gym QR/login page.
       */
      if (isGymLogin) {
        const loggedInGymSlug =
          loggedInUser?.gym?.slug ||
          loggedInUser?.gymSlug ||
          ""

        /*
         * If the backend returned a gym slug,
         * make sure it matches the gym portal
         * the visitor came from.
         */
        if (
          loggedInGymSlug &&
          loggedInGymSlug !== gymSlug.trim()
        ) {
          setError(
            `This account does not belong to ${gymName}. Please use the correct gym login.`,
          )
          return
        }

        /*
         * Platform owners must use the GB Platform
         * login, never a gym QR/login portal.
         */
        if (role === "platform_owner") {
          setError(
            "Platform owner accounts must sign in through the GB Platform login.",
          )
          return
        }

        /*
         * Gym members go to the gym/member dashboard.
         */
        if (role === "member") {
          navigate("/dashboard", {
            replace: true,
          })
          return
        }

        /*
         * Gym trainers should use the dedicated
         * trainer login flow.
         */
        if (role === "trainer") {
          setError(
            "Trainer accounts should use the Trainer Login for this gym.",
          )
          return
        }

        /*
         * Gym admins/owners should use the dedicated
         * admin login flow.
         */
        if (role === "admin") {
          setError(
            "Gym administrator accounts should use the Admin Login for this gym.",
          )
          return
        }

        setError(
          "Your account does not have a valid role for this gym.",
        )

        return
      }

      /*
       * GENERIC GB PLATFORM LOGIN
       *
       * This section only applies when there is
       * no gym slug.
       */
      if (role === "platform_owner") {
        navigate("/platform", {
          replace: true,
        })
        return
      }

      if (role === "admin") {
        navigate("/admin", {
          replace: true,
        })
        return
      }

      if (role === "trainer") {
        navigate("/trainer", {
          replace: true,
        })
        return
      }

      if (role === "member") {
        navigate("/dashboard", {
          replace: true,
        })
        return
      }

      setError(
        "Your account does not have a valid role. Please contact GB administration.",
      )
    } catch (loginError) {
      console.error(
        "Login error:",
        loginError,
      )

      setError(
        loginError?.response?.data?.message ||
          loginError?.message ||
          "Unable to log in. Please check your email and password.",
      )
    } finally {
      setLoading(false)
    }
  }

  if (authLoading || gymLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#020617] px-4 text-white">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#D9FF3F] text-xl font-black text-[#020617]">
            {gymName?.charAt(0)?.toUpperCase() || "G"}
          </div>

          <div className="text-sm font-semibold text-slate-400">
            {gymLoading
              ? "Loading gym..."
              : "Checking your session..."}
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#020617] px-4 py-8 text-white sm:px-6 lg:py-12">
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <section className="w-full max-w-[520px] rounded-[32px] border border-white/10 bg-[#111322] px-6 py-10 shadow-2xl sm:px-10">
          <div className="mb-8 text-center">
            {gymLogo ? (
              <img
                src={gymLogo}
                alt={`${gymName} logo`}
                className="mx-auto mb-6 h-20 w-20 rounded-2xl object-cover shadow-lg"
              />
            ) : (
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-[#D9FF3F] text-2xl font-black text-[#020617]">
                {isGymLogin
                  ? gymName
                      ?.charAt(0)
                      ?.toUpperCase() || "G"
                  : "GB"}
              </div>
            )}

            {isGymLogin ? (
              <>
                <p className="text-xs font-black uppercase tracking-[0.25em] text-[#D9FF3F]">
                  {gymName}
                </p>

                <h1 className="mt-3 text-4xl font-black tracking-tight">
                  Welcome Back
                </h1>

                <p className="mt-3 text-slate-400">
                  Sign in to your {gymName} account
                </p>
              </>
            ) : (
              <>
                <p className="text-xs font-black uppercase tracking-[0.25em] text-[#D9FF3F]">
                  GB Gym Platform
                </p>

                <h1 className="mt-3 text-4xl font-black tracking-tight">
                  Welcome Back
                </h1>

                <p className="mt-3 text-slate-400">
                  Sign in to your GB account
                </p>
              </>
            )}
          </div>

          <form
            onSubmit={handleSubmit}
            className="space-y-5"
          >
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
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                placeholder="Enter your email"
                autoComplete="username"
                disabled={loading}
                className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-4 text-white outline-none transition focus:border-[#D9FF3F] disabled:cursor-not-allowed disabled:opacity-60"
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
                onChange={(event) =>
                  setPassword(event.target.value)
                }
                placeholder="Enter your password"
                autoComplete="current-password"
                disabled={loading}
                className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-4 text-white outline-none transition focus:border-[#D9FF3F] disabled:cursor-not-allowed disabled:opacity-60"
              />
            </div>

            {location.state?.message && (
              <div className="rounded-xl border border-[#D9FF3F]/20 bg-[#D9FF3F]/5 px-4 py-3 text-sm text-[#D9FF3F]">
                {location.state.message}
              </div>
            )}

            <div className="flex items-center justify-end text-sm">
              <Link
                to={
                  isGymLogin
                    ? `/forgot-password?gym=${encodeURIComponent(
                        gymSlug,
                      )}`
                    : isAdminLogin
                      ? "/admin-forgot-password"
                      : "/forgot-password"
                }
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
              className="w-full rounded-xl bg-[#D9FF3F] px-4 py-4 font-black text-[#020617] transition hover:bg-[#E7FF72] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading
                ? "SIGNING IN..."
                : "SIGN IN"}
            </button>
          </form>

          <div className="mt-7 border-t border-white/10 pt-6 text-center text-sm">
            {isGymLogin ? (
              <>
                <span className="text-slate-500">
                  New to {gymName}?
                </span>{" "}
                <Link
                  to={`/register?gym=${encodeURIComponent(
                    gymSlug,
                  )}`}
                  className="font-bold text-[#D9FF3F] transition hover:text-[#E7FF72]"
                >
                  Create Your Account
                </Link>

                <div className="mt-4">
                  <Link
                    to={`/gym/${encodeURIComponent(
                      gymSlug,
                    )}`}
                    className="font-semibold text-slate-500 transition hover:text-white"
                  >
                    ← Back to {gymName}
                  </Link>
                </div>
              </>
            ) : (
              <>
                <span className="text-slate-500">
                  New gym?
                </span>{" "}
                <Link
                  to="/register-gym"
                  className="font-bold text-[#D9FF3F] transition hover:text-[#E7FF72]"
                >
                  Register Your Gym
                </Link>
              </>
            )}
          </div>
        </section>
      </div>
    </main>
  )
}