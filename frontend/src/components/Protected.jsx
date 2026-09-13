import { Navigate, useLocation } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import Loading from "./Loading"

export default function Protected({ children, roles = [] }) {
  const { loading, isAuthenticated, user } = useAuth()
  const location = useLocation()

  if (loading) return <Loading />
  if (!isAuthenticated || !user) return <Navigate to="/login" state={{ from: location.pathname }} replace />

  const normalizedRole = String(user.role || "").trim().toLowerCase()
  const allowedRoles = roles.map((role) => String(role).trim().toLowerCase())
  if (allowedRoles.length && !allowedRoles.includes(normalizedRole)) {
    return <Navigate to="/" replace />
  }

  return children
}
