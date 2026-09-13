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
    const storedUser = localStorage.getItem("user")
    return storedUser ? JSON.parse(storedUser) : null
  } catch {
    localStorage.removeItem("user")
    return null
  }
}

const clearStoredAuthentication = () => {
  setAccessToken(null)
  localStorage.removeItem("user")
  localStorage.removeItem("gym")
  sessionStorage.removeItem("gb_entry_gym")
  localStorage.removeItem(SUBSCRIPTION_END_STORAGE_KEY)
  clearLegacyMemberStorage()
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(getStoredUser)
  const [token, setToken] = useState(getStoredToken)
  const [loading, setLoading] = useState(true)

  const logout = async () => {
    try {
      const { auth } = await import("../api/api.js")
      await auth.logout()
    } catch (error) {
      console.warn("Backend logout failed:", error)
    } finally {
      clearStoredAuthentication()
      setToken(null)
      setUser(null)
    }
  }

  useEffect(() => {
    let mounted = true

    const restoreAuthentication = async () => {
      const storedToken = getStoredToken()

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

        if (!data?.success || !data?.user) {
          throw new Error("Unable to restore user session.")
        }

        if (!mounted) return

        const currentToken = getStoredToken()
        if (!currentToken) {
          throw new Error("Authentication session could not be restored.")
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
        console.error("Session restore error:", error)

        if (mounted) {
          clearStoredAuthentication()
          setToken(null)
          setUser(null)
        }
      } finally {
        if (mounted) setLoading(false)
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
    gymSlug = "",
  ) => {
    try {
      clearLegacyMemberStorage()
      localStorage.removeItem(
        SUBSCRIPTION_END_STORAGE_KEY,
      )

      const data = await loginUser(
        email,
        password,
        gymSlug,
      )

      if (!data?.success) {
        throw new Error(
          data?.message || "Login failed.",
        )
      }

      const receivedToken =
        data?.token || data?.accessToken

      if (!receivedToken) {
        throw new Error(
          "Login succeeded but no authentication token was returned.",
        )
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

        if (!me?.success || !me?.user) {
          throw new Error(
            "Unable to retrieve authenticated user.",
          )
        }

        localStorage.setItem(
          "user",
          JSON.stringify(me.user),
        )

        setUser(me.user)

        if (me.user.role !== "member") {
          localStorage.removeItem(
            SUBSCRIPTION_END_STORAGE_KEY,
          )
          clearLegacyMemberStorage()
        }

        return {
          success: true,
          user: me.user,
          token: receivedToken,
        }
      } catch (meError) {
        console.error(
          "Post-login session check error:",
          meError,
        )

        if (data?.user) {
          return {
            success: true,
            user: data.user,
            token: receivedToken,
          }
        }

        throw meError
      }
    } catch (error) {
      console.error("Login error:", error)

      clearStoredAuthentication()
      setToken(null)
      setUser(null)

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
  }

  const role = user?.role || null

  const value = {
    user,
    token,
    role,
    loading,

    isAuthenticated: Boolean(token && user),

    isAdmin: role === "admin",
    isMember: role === "member",
    isTrainer: role === "trainer",
    isPlatformOwner: role === "platform_owner",

    login,
    logout,
    clearAuthentication,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error(
      "useAuth must be used inside an AuthProvider.",
    )
  }

  return context
}

export default AuthContext
