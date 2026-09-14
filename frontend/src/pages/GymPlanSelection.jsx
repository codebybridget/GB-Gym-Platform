import { useEffect, useMemo, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { platform, gyms, setGymEntrySlug } from "../api/api"
import { err } from "../utils/helpers"

function formatPrice(plan) {
  const price = Number(plan?.price ?? 0)
  const currency = plan?.currency || "NGN"
  const cycle = plan?.billingCycle || "monthly"

  try {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(price)
  } catch {
    return `${price} ${currency}`
  }
}

function getCycleLabel(cycle) {
  const value = String(cycle || "monthly").toLowerCase()
  if (value.includes("year")) return "year"
  if (value.includes("week")) return "week"
  if (value.includes("day")) return "day"
  return "month"
}

function getFeatures(plan) {
  if (Array.isArray(plan?.features)) {
    return plan.features.filter(Boolean).slice(0, 6)
  }

  if (typeof plan?.features === "string") {
    return plan.features
      .split(/[,\n]/)
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, 6)
  }

  return []
}

export default function GymPlanSelection() {
  const location = useLocation()
  const navigate = useNavigate()
  const registration = location.state?.registration

  const [plans, setPlans] = useState([])
  const [selectedPlanId, setSelectedPlanId] = useState("")
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!registration) {
      navigate("/register-gym", { replace: true })
      return
    }

    let cancelled = false

    const loadPlans = async () => {
      setLoading(true)
      setError("")

      try {
        const response = await platform.publicPlans()
        if (cancelled) return

        const nextPlans = Array.isArray(response?.plans)
          ? response.plans
          : []

        setPlans(nextPlans)

        const defaultPlan = nextPlans.find(
          (plan) => plan?.isDefault || plan?.recommended,
        ) || nextPlans[0]

        if (defaultPlan?._id) {
          setSelectedPlanId(defaultPlan._id)
        }
      } catch (requestError) {
        if (!cancelled) {
          setError(err(requestError) || "Unable to load subscription plans. Please try again.")
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadPlans()

    return () => {
      cancelled = true
    }
  }, [navigate, registration])

  const selectedPlan = useMemo(
    () => plans.find((plan) => plan?._id === selectedPlanId),
    [plans, selectedPlanId],
  )

  const continueToPayment = async () => {
    setError("")

    if (!registration) {
      navigate("/register-gym", { replace: true })
      return
    }

    if (!selectedPlanId) {
      setError("Please select a subscription plan.")
      return
    }

    setBusy(true)

    try {
      const response = await gyms.register({
        ...registration,
        planId: selectedPlanId,
      })

      const gymSlug =
        response?.gym?.slug ||
        response?.slug ||
        response?.gymSlug ||
        ""

      if (gymSlug) {
        setGymEntrySlug(gymSlug)
      }

      if (response?.authorization_url) {
        window.location.href = response.authorization_url
        return
      }

      if (gymSlug && response?.requiresPayment === false) {
        navigate(`/gym/${encodeURIComponent(gymSlug)}/login`, {
          replace: true,
          state: {
            message:
              "Your gym has been created successfully. You can now sign in.",
          },
        })
        return
      }

      setError(
        "Gym registration was created, but the subscription payment could not be started. Please contact support or try registering again.",
      )
    } catch (requestError) {
      setError(err(requestError))
    } finally {
      setBusy(false)
    }
  }

  if (!registration) return null

  return (
    <div className="min-h-screen bg-[#020617] px-4 py-8 text-white sm:px-6">
      <div className="mx-auto w-full max-w-6xl">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#D9FF3F] text-base font-black text-[#020617]">
            GB
          </div>

          <div className="mb-5 flex items-center justify-center gap-3 text-xs font-semibold">
            <span className="text-slate-500">01 Gym details</span>
            <span className="h-px w-10 bg-white/10" />
            <span className="text-[#D9FF3F]">02 Choose your plan</span>
          </div>

          <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">
            Choose your GB SaaS plan
          </h1>
          <p className="mt-4 text-sm leading-6 text-slate-400 sm:text-base">
            Select the plan that fits your gym. You will be securely redirected to Paystack to complete payment.
          </p>
        </div>

        {error && (
          <div className="mx-auto mt-8 max-w-3xl rounded-2xl border border-red-400/20 bg-red-500/10 px-5 py-4 text-sm text-red-200">
            {error}
          </div>
        )}

        {loading ? (
          <div className="mt-12 flex justify-center">
            <div className="rounded-2xl border border-white/10 bg-white/5 px-6 py-5 text-sm text-slate-400">
              Loading available plans...
            </div>
          </div>
        ) : plans.length === 0 ? (
          <div className="mx-auto mt-12 max-w-xl rounded-3xl border border-white/10 bg-white/5 p-8 text-center">
            <h2 className="text-xl font-semibold">No plans are available</h2>
            <p className="mt-2 text-sm text-slate-400">
              Subscription plans are currently unavailable. Please try again later.
            </p>
            <button
              type="button"
              onClick={() => navigate("/register-gym")}
              className="mt-6 rounded-xl border border-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Back to registration
            </button>
          </div>
        ) : (
          <>
            <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {plans.map((plan) => {
                const isSelected = plan?._id === selectedPlanId
                const features = getFeatures(plan)
                const cycle = getCycleLabel(plan?.billingCycle)
                const recommended = Boolean(plan?.isDefault || plan?.recommended || plan?.popular)

                return (
                  <button
                    key={plan._id}
                    type="button"
                    onClick={() => setSelectedPlanId(plan._id)}
                    className={`relative flex min-h-[360px] flex-col rounded-3xl border p-6 text-left transition duration-200 ${
                      isSelected
                        ? "border-[#D9FF3F] bg-[#D9FF3F]/10 shadow-[0_0_0_1px_rgba(217,255,63,0.25)]"
                        : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/[0.07]"
                    }`}
                  >
                    {recommended && (
                      <span className="absolute right-5 top-5 rounded-full bg-[#D9FF3F] px-3 py-1 text-[10px] font-black uppercase tracking-wider text-[#020617]">
                        Recommended
                      </span>
                    )}

                    <div className="pr-24">
                      <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
                        GB SaaS
                      </p>
                      <h2 className="mt-2 text-2xl font-bold">
                        {plan?.name || "Plan"}
                      </h2>
                    </div>

                    <div className="mt-7">
                      <span className="text-3xl font-bold">
                        {formatPrice(plan)}
                      </span>
                      <span className="ml-2 text-sm text-slate-500">
                        / {cycle}
                      </span>
                    </div>

                    {plan?.description && (
                      <p className="mt-3 text-sm leading-6 text-slate-400">
                        {plan.description}
                      </p>
                    )}

                    <div className="mt-6 flex-1 border-t border-white/10 pt-5">
                      {features.length > 0 ? (
                        <ul className="space-y-3 text-sm text-slate-300">
                          {features.map((feature, index) => (
                            <li key={`${plan._id}-feature-${index}`} className="flex gap-3">
                              <span className="mt-0.5 text-[#D9FF3F]">✓</span>
                              <span>{feature}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-slate-500">
                          Plan details available during checkout.
                        </p>
                      )}
                    </div>

                    <div className="mt-6 flex items-center gap-2 text-sm font-semibold">
                      <span
                        className={`flex h-5 w-5 items-center justify-center rounded-full border ${
                          isSelected
                            ? "border-[#D9FF3F] bg-[#D9FF3F] text-[#020617]"
                            : "border-white/20"
                        }`}
                      >
                        {isSelected ? "✓" : ""}
                      </span>
                      {isSelected ? "Selected" : "Select this plan"}
                    </div>
                  </button>
                )
              })}
            </div>

            <div className="mx-auto mt-8 max-w-2xl rounded-3xl border border-white/10 bg-white/5 p-5 sm:p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">
                    Selected plan
                  </p>
                  <p className="mt-1 font-semibold text-white">
                    {selectedPlan?.name || "Select a plan above"}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={continueToPayment}
                  disabled={busy || !selectedPlanId}
                  className="w-full rounded-2xl bg-[#D9FF3F] px-6 py-4 text-sm font-bold text-[#020617] transition hover:bg-[#E7FF72] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                >
                  {busy ? "Preparing secure payment..." : "Continue to Secure Payment"}
                </button>
              </div>

              <p className="mt-4 text-center text-xs leading-5 text-slate-500 sm:text-left">
                Payment is processed securely through Paystack. Your gym will be activated after successful payment verification.
              </p>
            </div>

            <div className="mx-auto mt-5 flex max-w-2xl justify-center">
              <button
                type="button"
                disabled={busy}
                onClick={() => navigate("/register-gym", { replace: false })}
                className="text-sm font-medium text-slate-500 transition hover:text-white disabled:opacity-50"
              >
                ← Back to gym details
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
