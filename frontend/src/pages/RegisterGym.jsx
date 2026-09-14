import { useState } from "react"
import { useNavigate } from "react-router-dom"
import Field from "../components/Field"

export default function RegisterGym() {
  const [form, setForm] = useState({
    gymName: "",
    ownerName: "",
    email: "",
    password: "",
    phone: "",
    country: "Nigeria",
  })
  const [error, setError] = useState("")

  const navigate = useNavigate()

  const updateField = (key, value) => {
    setForm((current) => ({
      ...current,
      [key]: value,
    }))
  }

  const submit = (event) => {
    event.preventDefault()
    setError("")

    if (!form.gymName.trim()) {
      setError("Please enter your gym name.")
      return
    }

    if (!form.ownerName.trim()) {
      setError("Please enter the gym owner's name.")
      return
    }

    if (!form.email.trim()) {
      setError("Please enter the owner's email address.")
      return
    }

    if (!form.password) {
      setError("Please create a password.")
      return
    }

    navigate("/register-gym/plan", {
      state: {
        registration: {
          ...form,
          gymName: form.gymName.trim(),
          ownerName: form.ownerName.trim(),
          email: form.email.trim().toLowerCase(),
          phone: form.phone.trim(),
          country: form.country.trim() || "Nigeria",
        },
      },
    })
  }

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={submit}>
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#D9FF3F] text-sm font-black text-[#020617]">
            GB
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              GB Gym Platform
            </p>
            <p className="text-sm text-slate-300">Gym registration</p>
          </div>
        </div>

        <div className="mb-8">
          <div className="mb-3 flex items-center justify-between text-xs font-semibold">
            <span className="text-white">Step 1 of 2</span>
            <span className="text-slate-500">Gym details</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
            <div className="h-full w-1/2 rounded-full bg-[#D9FF3F]" />
          </div>
        </div>

        <h1>Register Your Gym</h1>

        <p className="muted">
          Tell us about your gym and create the owner account.
          You will choose your GB SaaS plan on the next step.
        </p>

        <div className="mt-6 space-y-1">
          {[
            "gymName",
            "ownerName",
            "email",
            "password",
            "phone",
            "country",
          ].map((key) => (
            <Field
              key={key}
              label={
                key === "gymName"
                  ? "Gym name"
                  : key === "ownerName"
                    ? "Owner name"
                    : key.charAt(0).toUpperCase() + key.slice(1)
              }
              type={
                key === "email"
                  ? "email"
                  : key === "password"
                    ? "password"
                    : "text"
              }
              value={form[key]}
              onChange={(event) =>
                updateField(key, event.target.value)
              }
            />
          ))}
        </div>

        {error && <div className="alert error">{error}</div>}

        <button
          className="btn primary"
          type="submit"
        >
          Continue to Choose a Plan
        </button>

        <p className="mt-4 text-center text-xs text-slate-500">
          Your information will be used to create your gym workspace.
        </p>
      </form>
    </div>
  )
}
