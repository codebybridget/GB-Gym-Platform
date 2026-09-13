import { useEffect, useState } from "react"
import PageHeader from "../../components/PageHeader"
import Loading from "../../components/Loading"
import { subscriptions } from "../../api/api"
import { money, date, err } from "../../utils/helpers"
import { useGym } from "../../context/GymContext"

export default function Subscription() {
  const { gym } = useGym() || {}

  const gymName =
    gym?.name?.trim() || "Your gym"

  const [subscription, setSubscription] = useState(null)
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [choosing, setChoosing] = useState("")

  const load = async () => {
    setLoading(true)
    setError("")

    try {
      const [current, available] = await Promise.all([
        subscriptions.current(),
        subscriptions.plans(),
      ])

      setSubscription(current?.subscription || null)
      setPlans(available?.plans || [])
    } catch (e) {
      setError(err(e))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const choose = async (plan) => {
    try {
      setChoosing(plan._id)
      setError("")

      const response = await subscriptions.initialize({
        planId: plan._id,
      })

      if (response?.authorization_url) {
        window.location.href = response.authorization_url
      } else {
        await load()
      }
    } catch (e) {
      setError(err(e))
    } finally {
      setChoosing("")
    }
  }

  return (
    <>
      <PageHeader
        title="GB Subscription"
        description={`Your ${gymName} SaaS subscription to the GB platform. It is separate from member membership revenue.`}
        action={
          <button className="btn ghost" onClick={load}>
            Refresh
          </button>
        }
      />

      {error && <div className="alert error">{error}</div>}

      {loading ? (
        <Loading />
      ) : (
        <>
          {subscription ? (
            <div className="card">
              <h2>
                {subscription.planName ||
                  subscription.plan?.name ||
                  "GB Plan"}
              </h2>

              <p>
                Status: <b>{subscription.status}</b>
              </p>

              <p>
                Amount:{" "}
                {money(subscription.amount, subscription.currency)}
              </p>

              <p>
                Current period ends:{" "}
                {date(subscription.currentPeriodEnd)}
              </p>

              {subscription.nextBillingDate && (
                <p>
                  Next billing date:{" "}
                  {date(subscription.nextBillingDate)}
                </p>
              )}
            </div>
          ) : (
            <div className="card">
              <h3>No current GB subscription</h3>

              <p className="muted">
                Choose a SaaS plan below to activate or change your gym
                subscription.
              </p>
            </div>
          )}

          <div className="cards">
            {plans.map((plan) => (
              <div className="card" key={plan._id}>
                <h3>{plan.name}</h3>

                <p>
                  {money(plan.price, plan.currency)} /{" "}
                  {plan.billingCycle}
                </p>

                <p className="muted">{plan.description}</p>

                <button
                  className="btn primary"
                  disabled={Boolean(choosing)}
                  onClick={() => choose(plan)}
                >
                  {choosing === plan._id
                    ? "Opening payment..."
                    : plan._id === subscription?.plan?._id
                    ? "Current plan"
                    : "Choose plan"}
                </button>
              </div>
            ))}
          </div>

          {!plans.length && (
            <div className="empty">
              No active GB SaaS plans are available.
            </div>
          )}
        </>
      )}
    </>
  )
}