import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import { gyms } from "../api/api"
import { useAuth } from "./AuthContext"

const GymContext = createContext({
  gym: null,
  loading: false,
  error: "",
  refreshGym: async () => null,
  setGym: () => {},
})

export function GymProvider({ children }) {
  const { user, loading: authLoading } = useAuth()
  const [gym, setGym] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const refreshGym = useCallback(async () => {
    if (authLoading || !user) {
      setGym(null)
      setError("")
      return null
    }

    // The platform owner is not a tenant user and therefore has no current gym.
    if (user.role === "platform_owner") {
      setGym(null)
      setError("")
      return null
    }

    try {
      setLoading(true)
      setError("")
      const data = await gyms.current()
      const current = data?.gym || data || null
      setGym(current)
      return current
    } catch (err) {
      console.error("Unable to load current gym:", err)
      setGym(null)
      setError(err?.response?.data?.message || err?.message || "Unable to load gym information.")
      return null
    } finally {
      setLoading(false)
    }
  }, [authLoading, user])

  useEffect(() => {
    refreshGym()
  }, [refreshGym])

  const value = useMemo(() => ({
    gym,
    loading,
    error,
    refreshGym,
    setGym,
  }), [gym, loading, error, refreshGym])

  return <GymContext.Provider value={value}>{children}</GymContext.Provider>
}

export function useGym() {
  return useContext(GymContext)
}

export default GymContext
