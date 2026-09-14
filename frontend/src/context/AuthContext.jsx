import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react"

import {
  loginUser,
  getMe,
  setAccessToken,
} from "../api/api.js"

const AuthContext = createContext(null)

const LEGACY_MEMBER_STORAGE_KEYS = [
  "cgf_workout_history",
  "cgf_progress_data",
  "cgf_member_profile",
]

const SUBSCRIPTION_END_STORAGE_KEY =
  "cgf_subscription_end_date"

const ENTRY_GYM_STORAGE_KEY =
  "gb_entry_gym"

const clearLegacyMemberStorage = () => {
  LEGACY_MEMBER_STORAGE_KEYS.forEach((key) => {
    localStorage.removeItem(key)
  })
}

const getStoredToken = () =>
  localStorage.getItem("gb_access_token") ||
  localStorage.getItem("token") ||
  localStorage.getItem("accessToken")

const getStoredUser = () => {
  try {
    const storedUser =
      localStorage.getItem("user")

    return storedUser
      ? JSON.parse(storedUser)
      : null
  } catch {
    localStorage.removeItem("user")
    return null
  }
}

const getStoredGymSlug = () =>
  sessionStorage.getItem(
    ENTRY_GYM_STORAGE_KEY,
  ) ||
  localStorage.getItem(
    ENTRY_GYM_STORAGE_KEY,
  ) ||
  ""

const clearStoredAuthentication = ({
  preserveGymEntry = false,
} = {}) => {
  setAccessToken(null)

  localStorage.removeItem("user")
  localStorage.removeItem("gym")
  localStorage.removeItem(
    SUBSCRIPTION_END_STORAGE_KEY,
  )

  clearLegacyMemberStorage()

  if (!preserveGymEntry) {
    sessionStorage.removeItem(
      ENTRY_GYM_STORAGE_KEY,
    )

    localStorage.removeItem(
      ENTRY_GYM_STORAGE_KEY,
    )
  }
}

export const AuthProvider = ({
  children,
}) => {
  const [user, setUser] =
    useState(getStoredUser)

  const [token, setToken] =
    useState(getStoredToken)

  const [loading, setLoading] =
    useState(true)

  const [gymSlug, setGymSlug] =
    useState(getStoredGymSlug)

  const logout = async () => {
    try {
      const { auth } =
        await import("../api/api.js")

      await auth.logout()
    } catch (error) {
      console.warn(
        "Backend logout failed:",
        error,
      )
    } finally {
      clearStoredAuthentication()
      setToken(null)
      setUser(null)
      setGymSlug("")
    }
  }

  useEffect(() => {
    let mounted = true

    const restoreAuthentication =
      async () => {
        const storedToken =
          getStoredToken()

        const storedGymSlug =
          getStoredGymSlug()

        /*
         * Keep the current gym portal context
         * if the visitor arrived through a QR code
         * or gym-specific URL.
         */
        if (mounted) {
          setGymSlug(storedGymSlug)
        }

        if (!storedToken) {
          if (mounted) {
            setToken(null)
            setUser(null)
            setLoading(false)
          }

          return
        }

        try {
          const data = await getMe()

          if (
            !data?.success ||
            !data?.user
          ) {
            throw new Error(
              "Unable to restore user session.",
            )
          }

          if (!mounted) {
            return
          }

          const currentToken =
            getStoredToken()

          if (!currentToken) {
            throw new Error(
              "Authentication session could not be restored.",
            )
          }

          /*
           * If the current session belongs to a
           * gym-specific portal, make sure the
           * authenticated user belongs to that gym.
           */
          if (storedGymSlug) {
            const authenticatedGymSlug =
              data.user?.gym?.slug ||
              data.user?.gymSlug ||
              ""

            if (
              authenticatedGymSlug &&
              authenticatedGymSlug !==
                storedGymSlug
            ) {
              clearStoredAuthentication({
                preserveGymEntry: true,
              })

              setToken(null)
              setUser(null)

              if (mounted) {
                setLoading(false)
              }

              return
            }

            /*
             * Platform owners should never inherit
             * a gym portal session.
             */
            if (
              data.user?.role ===
              "platform_owner"
            ) {
              clearStoredAuthentication({
                preserveGymEntry: true,
              })

              setToken(null)
              setUser(null)

              if (mounted) {
                setLoading(false)
              }

              return
            }
          }

          setAccessToken(currentToken)
          setToken(currentToken)
          setUser(data.user)

          localStorage.setItem(
            "user",
            JSON.stringify(data.user),
          )

          if (
            data.user.role !== "member"
          ) {
            localStorage.removeItem(
              SUBSCRIPTION_END_STORAGE_KEY,
            )

            clearLegacyMemberStorage()
          }
        } catch (error) {
          console.error(
            "Session restore error:",
            error,
          )

          if (mounted) {
            clearStoredAuthentication({
              preserveGymEntry: Boolean(
                storedGymSlug,
              ),
            })

            setToken(null)
            setUser(null)
          }
        } finally {
          if (mounted) {
            setLoading(false)
          }
        }
      }

    restoreAuthentication()

    return () => {
      mounted = false
    }
  }, [])

  const login = async (
    email,
    password,
    requestedGymSlug = "",
  ) => {
    try {
      clearLegacyMemberStorage()

      localStorage.removeItem(
        SUBSCRIPTION_END_STORAGE_KEY,
      )

      const normalizedGymSlug =
        requestedGymSlug?.trim() || ""

      /*
       * Preserve the gym portal context.
       */
      if (normalizedGymSlug) {
        sessionStorage.setItem(
          ENTRY_GYM_STORAGE_KEY,
          normalizedGymSlug,
        )

        setGymSlug(normalizedGymSlug)
      }

      const data = await loginUser(
        email,
        password,
        normalizedGymSlug,
      )

      if (!data?.success) {
        throw new Error(
          data?.message ||
            "Login failed.",
        )
      }

      const receivedToken =
        data?.token ||
        data?.accessToken

      if (!receivedToken) {
        throw new Error(
          "Login succeeded but no authentication token was returned.",
        )
      }

      /*
       * Do not allow a platform-owner account
       * to enter through a gym portal.
       */
      if (
        normalizedGymSlug &&
        data?.user?.role ===
          "platform_owner"
      ) {
        throw new Error(
          "Platform owner accounts must sign in through the GB Platform login.",
        )
      }

      /*
       * If the login response identifies a gym,
       * verify that it matches the gym portal.
       */
      if (normalizedGymSlug) {
        const responseGymSlug =
          data?.user?.gym?.slug ||
          data?.user?.gymSlug ||
          ""

        if (
          responseGymSlug &&
          responseGymSlug !==
            normalizedGymSlug
        ) {
          throw new Error(
            "This account does not belong to the selected gym.",
          )
        }
      }

      setAccessToken(receivedToken)
      setToken(receivedToken)

      if (data?.user) {
        localStorage.setItem(
          "user",
          JSON.stringify(data.user),
        )

        setUser(data.user)
      }

      try {
        const me = await getMe()

        if (
          !me?.success ||
          !me?.user
        ) {
          throw new Error(
            "Unable to retrieve authenticated user.",
          )
        }

        /*
         * Validate the gym again after the
         * authenticated session has been established.
         */
        if (normalizedGymSlug) {
          const authenticatedGymSlug =
            me.user?.gym?.slug ||
            me.user?.gymSlug ||
            ""

          if (
            authenticatedGymSlug &&
            authenticatedGymSlug !==
              normalizedGymSlug
          ) {
            throw new Error(
              "This account does not belong to the selected gym.",
            )
          }

          if (
            me.user?.role ===
            "platform_owner"
          ) {
            throw new Error(
              "Platform owner accounts must sign in through the GB Platform login.",
            )
          }
        }

        localStorage.setItem(
          "user",
          JSON.stringify(me.user),
        )

        setUser(me.user)

        if (
          me.user.role !== "member"
        ) {
          localStorage.removeItem(
            SUBSCRIPTION_END_STORAGE_KEY,
          )

          clearLegacyMemberStorage()
        }

        return {
          success: true,
          user: me.user,
          token: receivedToken,
          gymSlug:
            normalizedGymSlug,
        }
      } catch (meError) {
        console.error(
          "Post-login session check error:",
          meError,
        )

        /*
         * If the backend already returned the
         * authenticated user, retain that result.
         */
        if (data?.user) {
          return {
            success: true,
            user: data.user,
            token: receivedToken,
            gymSlug:
              normalizedGymSlug,
          }
        }

        throw meError
      }
    } catch (error) {
      console.error(
        "Login error:",
        error,
      )

      /*
       * Preserve the gym entry context after
       * a failed gym login so the user stays
       * inside the correct gym portal.
       */
      const currentGymSlug =
        requestedGymSlug?.trim() ||
        getStoredGymSlug()

      clearStoredAuthentication({
        preserveGymEntry: Boolean(
          currentGymSlug,
        ),
      })

      setToken(null)
      setUser(null)

      if (currentGymSlug) {
        setGymSlug(currentGymSlug)
      } else {
        setGymSlug("")
      }

      throw new Error(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to login.",
      )
    }
  }

  const clearAuthentication = () => {
    clearStoredAuthentication()
    setToken(null)
    setUser(null)
    setGymSlug("")
  }

  const role = user?.role || null

  const value = {
    user,
    token,
    role,
    loading,
    gymSlug,

    isAuthenticated: Boolean(
      token && user,
    ),

    isAdmin:
      role === "admin",

    isMember:
      role === "member",

    isTrainer:
      role === "trainer",

    isPlatformOwner:
      role === "platform_owner",

    isGymSession:
      Boolean(gymSlug),

    login,
    logout,
    clearAuthentication,
  }

  return (
    <AuthContext.Provider
      value={value}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context =
    useContext(AuthContext)

  if (!context) {
    throw new Error(
      "useAuth must be used inside an AuthProvider.",
    )
  }

  return context
}

export default AuthContext