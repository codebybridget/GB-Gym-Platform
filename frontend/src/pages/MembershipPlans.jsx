import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  getMembershipPlans,
  initializePayment,
} from "../api/api.js"
import { useAuth } from "../context/AuthContext.jsx"

const formatPrice = (price, currency = "NGN") => {
  const amount = Number(price || 0)

  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount)
}

const getPlanId = (plan) => {
  return plan?._id || plan?.id
}

const getPlansFromResponse = (data) => {
  if (Array.isArray(data)) {
    return data
  }

  if (Array.isArray(data?.plans)) {
    return data.plans
  }

  if (Array.isArray(data?.membershipPlans)) {
    return data.membershipPlans
  }

  return []
}

export default function MembershipPlans() {
  const navigate = useNavigate()
  const { logout } = useAuth()

  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [payingPlanId, setPayingPlanId] = useState(null)
  const [error, setError] = useState("")

  useEffect(() => {
    const loadPlans = async () => {
      try {
        setLoading(true)
        setError("")

        const data = await getMembershipPlans()
        const availablePlans = getPlansFromResponse(data)

        setPlans(
          availablePlans.filter(
            (plan) => plan?.isActive !== false,
          ),
        )
      } catch (err) {
        console.error("Unable to load membership plans:", err)

        setError(
          err?.response?.data?.message ||
            err?.message ||
            "Unable to load membership plans.",
        )
      } finally {
        setLoading(false)
      }
    }

    loadPlans()
  }, [])

  const handleBackToLogin = async () => {
    try {
      await logout()
    } catch (err) {
      console.error("Logout failed:", err)
    } finally {
      window.location.replace("/login")
    }
  }

  const handlePayment = async (plan) => {
    const planId = getPlanId(plan)

    if (!planId) {
      setError("This membership plan does not have a valid ID.")
      return
    }

    try {
      setError("")
      setPayingPlanId(planId)

      const data = await initializePayment(planId)

      const authorizationUrl =
        data?.authorizationUrl ||
        data?.data?.authorization_url ||
        data?.authorization_url

      if (!authorizationUrl) {
        throw new Error(
          "Paystack did not return a payment URL.",
        )
      }

      window.location.href = authorizationUrl
    } catch (err) {
      console.error("Payment initialization failed:", err)

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to initialize payment.",
      )

      setPayingPlanId(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <button
            type="button"
            onClick={handleBackToLogin}
            aria-label="Back to Login"
            title="Back to Login"
            className="mb-6 flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-2xl font-medium leading-none text-white transition hover:bg-white/10"
          >
            ←
          </button>

          <div className="flex min-h-[60vh] items-center justify-center">
            <div className="text-center">
              <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-gray-300 border-t-lime-400" />
              <p className="text-gray-400">
                Loading membership plans...
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <button
          type="button"
          onClick={handleBackToLogin}
          aria-label="Back to Login"
          title="Back to Login"
          className="mb-6 flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-2xl font-medium leading-none text-white transition hover:bg-white/10"
        >
          ←
        </button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">
            Membership Plans
          </h1>

          <p className="mt-2 text-gray-400">
            Choose a membership plan that works for you.
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-300">
            {error}
          </div>
        )}

        {plans.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
            <p className="text-gray-400">
              No membership plans are currently available.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {plans.map((plan) => {
              const planId = getPlanId(plan)
              const features = Array.isArray(plan.features)
                ? plan.features
                : []

              const isPaying = payingPlanId === planId

              return (
                <div
                  key={planId}
                  className="flex flex-col rounded-2xl border border-white/10 bg-white/5 p-6 shadow-lg"
                >
                  <h2 className="text-2xl font-bold text-white">
                    {plan.name}
                  </h2>

                  {plan.description && (
                    <p className="mt-3 text-sm leading-6 text-gray-400">
                      {plan.description}
                    </p>
                  )}

                  <div className="mt-6">
                    <span className="text-3xl font-bold text-lime-400">
                      {formatPrice(
                        plan.price,
                        plan.currency || "NGN",
                      )}
                    </span>
                  </div>

                  {plan.durationDays && (
                    <p className="mt-2 text-sm text-gray-400">
                      {plan.durationDays} day
                      {Number(plan.durationDays) === 1
                        ? ""
                        : "s"}
                    </p>
                  )}

                  {features.length > 0 && (
                    <div className="mt-6 flex-1">
                      <p className="mb-3 font-semibold text-white">
                        Includes:
                      </p>

                      <ul className="space-y-2">
                        {features.map((feature, index) => (
                          <li
                            key={`${planId}-feature-${index}`}
                            className="flex gap-2 text-sm text-gray-300"
                          >
                            <span className="text-lime-400">
                              ✓
                            </span>

                            <span>
                              {typeof feature === "string"
                                ? feature
                                : feature?.name ||
                                  feature?.title ||
                                  String(feature)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => handlePayment(plan)}
                    disabled={isPaying}
                    className="mt-8 w-full rounded-xl bg-lime-400 px-5 py-3 font-semibold text-black transition hover:bg-lime-300 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isPaying
                      ? "Connecting to Paystack..."
                      : "Pay Now"}
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
