import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import Field from "../components/Field"
import { platform, gyms } from "../api/api"
import { err } from "../utils/helpers"

export default function RegisterGym() {
  const [plans, setPlans] = useState([])
  const [form, setForm] = useState({
    gymName: "",
    ownerName: "",
    email: "",
    password: "",
    phone: "",
    country: "Nigeria",
    planId: "",
  })
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)

  const navigate = useNavigate()

  useEffect(() => {
    let cancelled = false

    const loadPlans = async () => {
      try {
        const response = await platform.publicPlans()

        if (cancelled) return

        const nextPlans = response?.plans || []

        setPlans(nextPlans)

        if (nextPlans[0]) {
          setForm((current) => ({
            ...current,
            planId: current.planId || nextPlans[0]._id,
          }))
        }
      } catch {
        if (!cancelled) {
          setError(
            "Unable to load subscription plans. Please try again.",
          )
        }
      }
    }

    loadPlans()

    return () => {
      cancelled = true
    }
  }, [])

  const updateField = (key, value) => {
    setForm((current) => ({
      ...current,
      [key]: value,
    }))
  }

  const submit = async (event) => {
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

    if (!form.planId) {
      setError("Please select a subscription plan.")
      return
    }

    setBusy(true)

    try {
      const response = await gyms.register({
        ...form,
        gymName: form.gymName.trim(),
        ownerName: form.ownerName.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
        country: form.country.trim() || "Nigeria",
      })

      /*
       * A new gym must not be allowed into the platform
       * before its SaaS subscription is paid.
       *
       * The backend should return Paystack's authorization
       * URL when registration has successfully created the
       * pending gym/subscription.
       */
      if (response?.authorization_url) {
        window.location.href = response.authorization_url
        return
      }

      /*
       * Do NOT send a newly registered gym owner to the
       * normal GB Platform login when there is no payment
       * URL. That would allow an unpaid gym to continue
       * through the login flow.
       *
       * Instead, take the owner to the subscription page
       * if the backend returned a usable gym/subscription
       * context.
       */
      const gymSlug =
        response?.gym?.slug ||
        response?.slug ||
        response?.gymSlug ||
        ""

      const subscriptionId =
        response?.subscription?._id ||
        response?.subscription?.id ||
        response?.subscriptionId ||
        ""

      if (gymSlug) {
        navigate("/subscription", {
          replace: true,
          state: {
            gymSlug,
            subscriptionId,
            email: form.email.trim().toLowerCase(),
            message:
              "Your gym has been created. Complete the subscription payment before signing in.",
          },
        })

        return
      }

      /*
       * If the backend did not return a payment URL or
       * subscription context, stop the flow rather than
       * accidentally allowing login.
       */
      setError(
        "Gym registration was created, but the subscription payment could not be started. Please contact support or try registering again.",
      )
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

        <p className="muted">
          Create your GB gym workspace and owner account.
          You will need to complete your SaaS subscription
          before accessing the gym administration dashboard.
        </p>

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
                  : key.charAt(0).toUpperCase() +
                    key.slice(1)
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

        <Field
          label="GB SaaS plan"
          type="select"
          options={plans.map((plan) => ({
            value: plan._id,
            label: `${plan.name} — ${plan.price} ${plan.currency}/${plan.billingCycle}`,
          }))}
          value={form.planId}
          onChange={(event) =>
            updateField(
              "planId",
              event.target.value,
            )
          }
        />

        {error && (
          <div className="alert error">
            {error}
          </div>
        )}

        <button
          className="btn primary"
          type="submit"
          disabled={busy}
        >
          {busy
            ? "Creating gym..."
            : "Create gym & Continue to Payment"}
        </button>
      </form>
    </div>
  )
}