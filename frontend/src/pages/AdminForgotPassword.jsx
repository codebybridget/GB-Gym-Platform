import { useState } from "react"
import { Link } from "react-router-dom"
import Field from "../components/Field"
import { requestAdminPasswordReset } from "../api/api.js"
import { err } from "../utils/helpers"

export default function AdminForgotPassword() {
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const submit = async (event) => {
    event.preventDefault()
    setMessage("")
    setError("")
    if (!email.trim()) return setError("Enter your admin email.")
    try {
      setLoading(true)
      const response = await requestAdminPasswordReset(email.trim().toLowerCase())
      setMessage(response?.message || "If an eligible admin account exists, reset instructions have been sent.")
    } catch (requestError) {
      setError(err(requestError))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={submit}>
        <p className="platform-eyebrow"><i /> ADMIN ACCESS</p>
        <h1>Reset admin password</h1>
        <p className="muted">Enter the email for your GB Gym Owner/Admin account.</p>
        <Field label="Admin email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
        {message && <div className="alert">{message}</div>}
        {error && <div className="alert error">{error}</div>}
        <button className="btn primary" type="submit" disabled={loading}>
          {loading ? "Sending..." : "Send reset link"}
        </button>
        <div className="muted" style={{ marginTop: 12 }}>
          <Link to="/admin-login">Back to admin sign in</Link>
        </div>
      </form>
    </div>
  )
}
