import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import Field from "../components/Field"
import { platform, gyms } from "../api/api"
import { err } from "../utils/helpers"

export default function RegisterGym() {
  const [plans, setPlans] = useState([])
  const [form, setForm] = useState({ gymName: "", ownerName: "", email: "", password: "", phone: "", country: "Nigeria", planId: "" })
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    let cancelled = false
    platform.publicPlans().then((response) => {
      if (cancelled) return
      const nextPlans = response?.plans || []
      setPlans(nextPlans)
      if (nextPlans[0]) setForm((current) => ({ ...current, planId: nextPlans[0]._id }))
    }).catch(() => {})
    return () => { cancelled = true }
  }, [])

  const submit = async (event) => {
    event.preventDefault()
    setError("")
    setBusy(true)
    try {
      const response = await gyms.register(form)
      if (response?.authorization_url) {
        window.location.href = response.authorization_url
        return
      }
      navigate("/login", { replace: true, state: { message: "Your gym has been created. Sign in with your GB account to continue." } })
    } catch (requestError) {
      setError(err(requestError))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={submit}>
        <h1>Register Your Gym</h1>
        <p className="muted">Create your GB gym workspace and owner account.</p>
        {["gymName", "ownerName", "email", "password", "phone", "country"].map((key) => (
          <Field key={key} label={key === "gymName" ? "Gym name" : key === "ownerName" ? "Owner name" : key.charAt(0).toUpperCase() + key.slice(1)} type={key === "email" ? "email" : key === "password" ? "password" : "text"} value={form[key]} onChange={(event) => setForm({ ...form, [key]: event.target.value })} />
        ))}
        <Field label="GB SaaS plan" type="select" options={plans.map((plan) => ({ value: plan._id, label: `${plan.name} — ${plan.price} ${plan.currency}/${plan.billingCycle}` }))} value={form.planId} onChange={(event) => setForm({ ...form, planId: event.target.value })} />
        {error && <div className="alert error">{error}</div>}
        <button className="btn primary" type="submit" disabled={busy}>{busy ? "Creating gym..." : "Create gym"}</button>
      </form>
    </div>
  )
}
