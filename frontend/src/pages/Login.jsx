import { useEffect, useState } from "react"
import {
  Link,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom"
import { useAuth } from "../context/AuthContext.jsx"
import { gyms } from "../api/api.js"

const GYM_ENTRY_KEY = "gb_entry_gym"

export default function Login({
  gymSlug: gymSlugProp = "",
}) {
  const navigate = useNavigate()
  const location = useLocation()
  const params = new URLSearchParams(
    location.search,
  )

  const { gymSlug: routeGymSlug = "" } =
    useParams()

  /*
   * Priority:
   * 1. gymSlug supplied by the gym-scoped App route
   * 2. gymSlug from the URL query
   * 3. stored gym entry
   *
   * This keeps the QR-code gym context intact.
   */
  const gymSlug =
    String(
      gymSlugProp ||
        routeGymSlug ||
        params.get("gym") ||
        sessionStorage.getItem(
          GYM_ENTRY_KEY,
        ) ||
        localStorage.getItem(
          GYM_ENTRY_KEY,
        ) ||
        "",
    ).trim()

  const isGymLogin =
    Boolean(gymSlug)

  const isAdminLogin =
    location.pathname === "/admin-login"

  const { login, loading: authLoading } =
    useAuth()

  const [gymName, setGymName] =
    useState("Gym")
  const [gymLogo, setGymLogo] =
    useState("")
  const [gymLoading, setGymLoading] =
    useState(false)

  const [email, setEmail] =
    useState("")
  const [password, setPassword] =
    useState("")
  const [error, setError] =
    useState("")
  const [loading, setLoading] =
    useState(false)

  /*
   * Persist the gym context whenever this is
   * a gym-scoped login.
   */
  useEffect(() => {
    if (!isGymLogin) {
      return
    }

    sessionStorage.setItem(
      GYM_ENTRY_KEY,
      gymSlug,
    )

    localStorage.setItem(
      GYM_ENTRY_KEY,
      gymSlug,
    )
  }, [
    gymSlug,
    isGymLogin,
  ])

  /*
   * Load the gym branding.
   */
  useEffect(() => {
    let mounted = true

    const loadGym = async () => {
      if (!isGymLogin) {
        setGymName("Gym")
        setGymLogo("")
        return
      }

      try {
        setGymLoading(true)

        const response =
          await gyms.entry(gymSlug)

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
        } else {
          setGymName("Gym")
          setGymLogo("")
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
  }, [
    gymSlug,
    isGymLogin,
  ])

  const handleSubmit = async (
    event,
  ) => {
    event.preventDefault()
    setError("")

    if (
      !email.trim() ||
      !password
    ) {
      setError(
        "Please enter your email and password.",
      )
      return
    }

    try {
      setLoading(true)

      /*
       * CRITICAL:
       *
       * If this login came from a gym QR code,
       * always send that gym's slug to the backend.
       *
       * The same email may be used by the person,
       * but the gymSlug determines the gym context.
       */
      const result = await login(
        email
          .trim()
          .toLowerCase(),
        password,
        isGymLogin
          ? gymSlug
          : "",
      )

      const loggedInUser =
        result?.user

      if (!loggedInUser) {
        throw new Error(
          "Login succeeded, but no user information was returned.",
        )
      }

      const role =
        loggedInUser?.role

      /*
       * ================================================================
       * GYM-SCOPED LOGIN
       * ================================================================
       */

      if (isGymLogin) {
        const loggedInGymSlug =
          loggedInUser?.gym?.slug ||
          loggedInUser?.gymSlug ||
          ""

        /*
         * Prevent an account belonging to another
         * gym from entering this gym portal.
         */
        if (
          loggedInGymSlug &&
          loggedInGymSlug.toLowerCase() !==
            gymSlug.toLowerCase()
        ) {
          setError(
            `This account does not belong to ${gymName}. Please use the correct gym login.`,
          )
          return
        }

        /*
         * Platform owner accounts must use
         * the GB Platform login.
         */
        if (
          role ===
          "platform_owner"
        ) {
          setError(
            "Platform owner accounts must sign in through the GB Platform login.",
          )
          return
        }

        /*
         * Gym member.
         */
        if (
          role === "member"
        ) {
          navigate(
            "/dashboard",
            {
              replace: true,
            },
          )
          return
        }

        /*
         * Trainer accounts use the gym-specific
         * trainer login.
         */
        if (
          role === "trainer"
        ) {
          setError(
            "Trainer accounts should use the Trainer Login for this gym.",
          )
          return
        }

        /*
         * Gym administrator / gym owner.
         *
         * The registration controller creates the
         * gym owner with role = "admin".
         *
         * Therefore a gym-scoped admin is allowed
         * into the administrator dashboard.
         */
        if (
          role === "admin"
        ) {
          navigate(
            "/admin",
            {
              replace: true,
            },
          )
          return
        }

        setError(
          "Your account does not have a valid role for this gym.",
        )

        return
      }

      /*
       * ================================================================
       * GENERIC GB PLATFORM LOGIN
       * ================================================================
       *
       * This section is reached only when there
       * is no gym context.
       */

      if (
        role ===
        "platform_owner"
      ) {
        navigate(
          "/platform",
          {
            replace: true,
          },
        )
        return
      }

      if (
        role === "admin"
      ) {
        navigate(
          "/admin",
          {
            replace: true,
          },
        )
        return
      }

      if (
        role === "trainer"
      ) {
        navigate(
          "/trainer",
          {
            replace: true,
          },
        )
        return
      }

      if (
        role === "member"
      ) {
        navigate(
          "/dashboard",
          {
            replace: true,
          },
        )
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
        loginError?.response
          ?.data?.message ||
          loginError?.message ||
          "Unable to log in. Please check your email and password.",
      )
    } finally {
      setLoading(false)
    }
  }

  /*
   * ================================================================
   * LOADING
   * ================================================================
   */

  if (
    authLoading ||
    gymLoading
  ) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#020617] px-4 text-white">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#D9FF3F] text-xl font-black text-[#020617]">
            {gymName
              ?.charAt(0)
              ?.toUpperCase() ||
              "G"}
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

  /*
   * ================================================================
   * LOGIN PAGE
   * ================================================================
   */

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
                      ?.toUpperCase() ||
                    "G"
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
                  Sign in to your{" "}
                  {gymName} account
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
                  Sign in to your GB
                  account
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
                  setEmail(
                    event.target.value,
                  )
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
                  setPassword(
                    event.target.value,
                  )
                }
                placeholder="Enter your password"
                autoComplete="current-password"
                disabled={loading}
                className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-4 text-white outline-none transition focus:border-[#D9FF3F] disabled:cursor-not-allowed disabled:opacity-60"
              />
            </div>

            {location.state
              ?.message && (
              <div className="rounded-xl border border-[#D9FF3F]/20 bg-[#D9FF3F]/5 px-4 py-3 text-sm text-[#D9FF3F]">
                {
                  location.state
                    .message
                }
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
                  New to{" "}
                  {gymName}?
                </span>{" "}

                <Link
                  to={`/gym/${encodeURIComponent(
                    gymSlug,
                  )}/register`}
                  className="font-bold text-[#D9FF3F] transition hover:text-[#E7FF72]"
                >
                  Create Your
                  Account
                </Link>

                <div className="mt-4">
                  <Link
                    to={`/gym/${encodeURIComponent(
                      gymSlug,
                    )}`}
                    className="font-semibold text-slate-500 transition hover:text-white"
                  >
                    ← Back to{" "}
                    {gymName}
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
                  Register Your
                  Gym
                </Link>
              </>
            )}
          </div>
        </section>
      </div>
    </main>
  )
}
