import { useEffect, useMemo, useState } from "react"
import {
  ArrowRight,
  CalendarDays,
  Check,
  CheckCircle2,
  CreditCard,
  Crown,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  XCircle,
  Zap,
} from "lucide-react"
import PageHeader from "../../components/PageHeader"
import Loading from "../../components/Loading"
import { subscriptions } from "../../api/api"
import { money, date, err } from "../../utils/helpers"
import { useGym } from "../../context/GymContext"

export default function Subscription() {
  const { gym } = useGym() || {}

  const gymName = gym?.name?.trim() || "Your gym"

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

  const currentPlanId = subscription?.plan?._id || subscription?.planId

  const currentPlan = useMemo(() => {
    if (!subscription) return null

    return (
      plans.find((plan) => plan._id === currentPlanId) ||
      subscription.plan ||
      null
    )
  }, [plans, subscription, currentPlanId])

  const subscriptionStatus = String(
    subscription?.status || "",
  ).toLowerCase()

  const isActive = ["active", "trial"].includes(subscriptionStatus)
  const isPending = subscriptionStatus === "pending"
  const isCancelled = subscriptionStatus === "cancelled"
  const isExpired = ["expired", "past_due"].includes(subscriptionStatus)

  return (
    <div className="admin-subscription-page">
      <PageHeader
        title="GB Subscription"
        description={`Manage ${gymName}'s SaaS subscription to the GB platform. This is separate from your gym member memberships and member revenue.`}
        action={
          <button
            type="button"
            className="btn ghost"
            onClick={load}
            disabled={loading}
          >
            <RefreshCw
              size={15}
              className={loading ? "admin-subscription-spin" : ""}
            />
            Refresh
          </button>
        }
      />

      <div className="admin-subscription-content">
        {error && (
          <div className="alert error admin-subscription-alert">
            <XCircle size={17} />
            <span>{error}</span>
            <button
              type="button"
              onClick={() => setError("")}
              aria-label="Dismiss error"
              className="admin-subscription-alert-close"
            >
              ×
            </button>
          </div>
        )}

        {loading ? (
          <Loading />
        ) : (
          <>
            <section className="admin-subscription-hero">
              <div className="admin-subscription-hero-main">
                <div className="admin-subscription-eyebrow">
                  <span className="admin-subscription-live-dot" />
                  <ShieldCheck size={13} />
                  GB PLATFORM BILLING
                </div>

                <h2>
                  Keep your gym connected to the GB platform.
                </h2>

                <p>
                  Your SaaS subscription gives this gym access to the GB
                  Gym Platform. Choose the plan that best matches the size
                  and needs of your business.
                </p>

                <div className="admin-subscription-trust">
                  <span>
                    <CheckCircle2 size={13} />
                    Secure billing
                  </span>
                  <span>
                    <CheckCircle2 size={13} />
                    Flexible plans
                  </span>
                  <span>
                    <CheckCircle2 size={13} />
                    Gym account protected
                  </span>
                </div>
              </div>

              <div className="admin-subscription-hero-card">
                <div className="admin-subscription-hero-icon">
                  <Crown size={23} />
                </div>

                <div>
                  <span>Current account</span>
                  <strong>{gymName}</strong>
                  <small>
                    {subscription
                      ? "GB subscription connected"
                      : "No active GB subscription"}
                  </small>
                </div>
              </div>
            </section>

            {subscription ? (
              <section className="admin-subscription-current">
                <div className="admin-subscription-section-heading">
                  <div>
                    <div className="admin-subscription-section-label">
                      <Sparkles size={13} />
                      CURRENT SUBSCRIPTION
                    </div>

                    <h3>Your GB SaaS plan</h3>

                    <p>
                      Review your current billing status and subscription
                      period.
                    </p>
                  </div>

                  <StatusBadge status={subscription.status} />
                </div>

                <div className="admin-subscription-current-grid">
                  <div className="admin-subscription-plan-card">
                    <div className="admin-subscription-plan-card-top">
                      <div className="admin-subscription-plan-icon">
                        <Zap size={19} />
                      </div>

                      <div>
                        <span>Current plan</span>
                        <h4>
                          {subscription.planName ||
                            currentPlan?.name ||
                            "GB Plan"}
                        </h4>
                      </div>
                    </div>

                    <div className="admin-subscription-price">
                      <strong>
                        {money(
                          subscription.amount,
                          subscription.currency,
                        )}
                      </strong>
                      <span>
                        / {subscription.billingCycle || currentPlan?.billingCycle || "billing cycle"}
                      </span>
                    </div>

                    {currentPlan?.description && (
                      <p>{currentPlan.description}</p>
                    )}
                  </div>

                  <div className="admin-subscription-details">
                    <DetailItem
                      icon={CheckCircle2}
                      label="Subscription status"
                      value={subscription.status}
                      valueClass={isActive ? "success" : ""}
                    />

                    <DetailItem
                      icon={CreditCard}
                      label="Payment status"
                      value={subscription.paymentStatus || "—"}
                      valueClass={
                        String(subscription.paymentStatus || "").toLowerCase() ===
                        "paid"
                          ? "success"
                          : ""
                      }
                    />

                    <DetailItem
                      icon={CalendarDays}
                      label="Current period ends"
                      value={date(subscription.currentPeriodEnd)}
                    />

                    <DetailItem
                      icon={CalendarDays}
                      label="Next billing date"
                      value={
                        subscription.nextBillingDate
                          ? date(subscription.nextBillingDate)
                          : "—"
                      }
                    />
                  </div>
                </div>

                {isPending && (
                  <div className="admin-subscription-notice pending">
                    <CreditCard size={17} />
                    <div>
                      <strong>Payment is pending</strong>
                      <p>
                        Your subscription has been created but the payment
                        has not been confirmed yet.
                      </p>
                    </div>
                  </div>
                )}

                {isCancelled && (
                  <div className="admin-subscription-notice warning">
                    <XCircle size={17} />
                    <div>
                      <strong>Subscription cancelled</strong>
                      <p>
                        Choose an available plan below if you want to start
                        or continue your GB platform subscription.
                      </p>
                    </div>
                  </div>
                )}

                {isExpired && (
                  <div className="admin-subscription-notice warning">
                    <CalendarDays size={17} />
                    <div>
                      <strong>Subscription requires renewal</strong>
                      <p>
                        Select a plan below to start the payment process for
                        your next GB SaaS subscription period.
                      </p>
                    </div>
                  </div>
                )}
              </section>
            ) : (
              <section className="admin-subscription-empty-current">
                <div className="admin-subscription-empty-icon">
                  <CreditCard size={23} />
                </div>

                <div>
                  <div className="admin-subscription-section-label">
                    SUBSCRIPTION REQUIRED
                  </div>

                  <h3>No current GB subscription</h3>

                  <p>
                    Choose one of the available SaaS plans below to activate
                    your gym's GB platform subscription.
                  </p>
                </div>
              </section>
            )}

            <section className="admin-subscription-plans">
              <div className="admin-subscription-plans-heading">
                <div>
                  <div className="admin-subscription-section-label">
                    <Sparkles size={13} />
                    AVAILABLE PLANS
                  </div>

                  <h3>Choose the right plan for your gym</h3>

                  <p>
                    Compare the available GB SaaS plans and continue to
                    secure payment when you're ready.
                  </p>
                </div>

                <div className="admin-subscription-plan-count">
                  {plans.length}{" "}
                  {plans.length === 1 ? "plan" : "plans"} available
                </div>
              </div>

              {plans.length ? (
                <div className="admin-subscription-plan-grid">
                  {plans.map((plan) => {
                    const isCurrent = plan._id === currentPlanId
                    const isChoosing = choosing === plan._id

                    return (
                      <PlanCard
                        key={plan._id}
                        plan={plan}
                        isCurrent={isCurrent}
                        choosing={isChoosing}
                        disabled={Boolean(choosing)}
                        onChoose={() => choose(plan)}
                      />
                    )
                  })}
                </div>
              ) : (
                <div className="admin-subscription-no-plans">
                  <CreditCard size={21} />
                  <h3>No active GB SaaS plans</h3>
                  <p>
                    There are currently no active plans available for your
                    gym.
                  </p>
                </div>
              )}
            </section>
          </>
        )}
      </div>

      <style>{`
        .admin-subscription-page {
          width: 100%;
        }

        .admin-subscription-content {
          display: flex;
          flex-direction: column;
          gap: 18px;
          padding-bottom: 40px;
        }

        .admin-subscription-alert {
          position: relative;
          display: flex;
          align-items: center;
          gap: 9px;
          padding-right: 42px;
        }

        .admin-subscription-alert-close {
          position: absolute;
          right: 10px;
          top: 50%;
          transform: translateY(-50%);
          width: 28px;
          height: 28px;
          display: grid;
          place-items: center;
          border: 0;
          border-radius: 7px;
          background: transparent;
          color: inherit;
          cursor: pointer;
          font-size: 20px;
        }

        .admin-subscription-hero {
          position: relative;
          display: grid;
          grid-template-columns: minmax(0, 1fr) 280px;
          gap: 24px;
          align-items: center;
          overflow: hidden;
          padding: 28px 30px;
          border: 1px solid #273342;
          border-radius: 23px;
          background:
            radial-gradient(circle at 82% 18%, rgba(215,255,53,.10), transparent 31%),
            linear-gradient(135deg, #111b24 0%, #0d151d 60%, #091016 100%);
          box-shadow: 0 20px 65px rgba(0,0,0,.13);
        }

        .admin-subscription-hero::before {
          content: "";
          position: absolute;
          width: 240px;
          height: 240px;
          right: -130px;
          bottom: -145px;
          border: 1px solid rgba(215,255,53,.10);
          border-radius: 50%;
        }

        .admin-subscription-hero-main {
          position: relative;
          z-index: 1;
          max-width: 720px;
        }

        .admin-subscription-eyebrow,
        .admin-subscription-section-label {
          display: flex;
          align-items: center;
          gap: 7px;
          color: #d7ff35;
          font-size: 10px;
          font-weight: 900;
          letter-spacing: .13em;
          text-transform: uppercase;
        }

        .admin-subscription-live-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #d7ff35;
          box-shadow: 0 0 12px rgba(215,255,53,.65);
        }

        .admin-subscription-hero h2 {
          max-width: 680px;
          margin: 9px 0 8px;
          color: #fff;
          font-size: clamp(24px, 3vw, 35px);
          line-height: 1.07;
          font-weight: 950;
          letter-spacing: -.045em;
        }

        .admin-subscription-hero-main > p {
          max-width: 650px;
          margin: 0;
          color: #7d8b9c;
          font-size: 12px;
          line-height: 1.7;
        }

        .admin-subscription-trust {
          display: flex;
          align-items: center;
          gap: 15px;
          flex-wrap: wrap;
          margin-top: 18px;
        }

        .admin-subscription-trust span {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          color: #8d9aab;
          font-size: 10px;
          font-weight: 700;
        }

        .admin-subscription-trust svg {
          color: #d7ff35;
        }

        .admin-subscription-hero-card {
          position: relative;
          z-index: 1;
          display: flex;
          align-items: center;
          gap: 13px;
          padding: 17px;
          border: 1px solid rgba(215,255,53,.15);
          border-radius: 16px;
          background: rgba(215,255,53,.035);
        }

        .admin-subscription-hero-icon {
          width: 45px;
          height: 45px;
          display: grid;
          place-items: center;
          flex: 0 0 auto;
          border-radius: 13px;
          background: rgba(215,255,53,.09);
          color: #d7ff35;
        }

        .admin-subscription-hero-card span,
        .admin-subscription-hero-card small {
          display: block;
          color: #718094;
          font-size: 9px;
        }

        .admin-subscription-hero-card strong {
          display: block;
          margin: 3px 0;
          overflow: hidden;
          color: #f7f9fb;
          font-size: 14px;
          font-weight: 900;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .admin-subscription-current,
        .admin-subscription-plans {
          overflow: hidden;
          border: 1px solid #273342;
          border-radius: 21px;
          background: linear-gradient(145deg, #101821, #0a1016);
          box-shadow: 0 16px 55px rgba(0,0,0,.10);
        }

        .admin-subscription-section-heading,
        .admin-subscription-plans-heading {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 18px;
          padding: 22px 24px;
          border-bottom: 1px solid #202b37;
        }

        .admin-subscription-section-heading h3,
        .admin-subscription-plans-heading h3 {
          margin: 6px 0 4px;
          color: #fff;
          font-size: 18px;
          font-weight: 900;
          letter-spacing: -.025em;
        }

        .admin-subscription-section-heading p,
        .admin-subscription-plans-heading p {
          margin: 0;
          color: #718094;
          font-size: 11px;
          line-height: 1.55;
        }

        .admin-subscription-current-grid {
          display: grid;
          grid-template-columns: minmax(0, 1.1fr) minmax(0, .9fr);
          gap: 14px;
          padding: 18px 20px 20px;
        }

        .admin-subscription-plan-card {
          min-width: 0;
          padding: 19px;
          border: 1px solid rgba(215,255,53,.14);
          border-radius: 16px;
          background:
            radial-gradient(circle at 100% 0%, rgba(215,255,53,.07), transparent 35%),
            #0b1118;
        }

        .admin-subscription-plan-card-top {
          display: flex;
          align-items: center;
          gap: 11px;
        }

        .admin-subscription-plan-icon {
          width: 40px;
          height: 40px;
          display: grid;
          place-items: center;
          flex: 0 0 auto;
          border-radius: 11px;
          background: rgba(215,255,53,.09);
          color: #d7ff35;
        }

        .admin-subscription-plan-card-top span {
          display: block;
          color: #718094;
          font-size: 9px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: .08em;
        }

        .admin-subscription-plan-card h4 {
          margin: 3px 0 0;
          color: #fff;
          font-size: 17px;
          font-weight: 900;
        }

        .admin-subscription-price {
          display: flex;
          align-items: baseline;
          gap: 5px;
          margin-top: 20px;
        }

        .admin-subscription-price strong {
          color: #d7ff35;
          font-size: 27px;
          line-height: 1;
          font-weight: 950;
          letter-spacing: -.04em;
        }

        .admin-subscription-price span {
          color: #718094;
          font-size: 10px;
          text-transform: capitalize;
        }

        .admin-subscription-plan-card > p {
          margin: 12px 0 0;
          color: #7d8b9c;
          font-size: 11px;
          line-height: 1.6;
        }

        .admin-subscription-details {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 9px;
        }

        .admin-subscription-detail {
          min-width: 0;
          padding: 13px;
          border: 1px solid #222d39;
          border-radius: 12px;
          background: #0a1016;
        }

        .admin-subscription-detail-top {
          display: flex;
          align-items: center;
          gap: 6px;
          color: #657487;
        }

        .admin-subscription-detail-label {
          color: #68778a;
          font-size: 8px;
          font-weight: 900;
          letter-spacing: .08em;
          text-transform: uppercase;
        }

        .admin-subscription-detail-value {
          margin-top: 7px;
          overflow-wrap: anywhere;
          color: #dce3eb;
          font-size: 11px;
          font-weight: 800;
          text-transform: capitalize;
        }

        .admin-subscription-detail-value.success {
          color: #4ade80;
        }

        .admin-subscription-notice {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          margin: 0 20px 20px;
          padding: 13px 14px;
          border: 1px solid #273342;
          border-radius: 12px;
          color: #9ba7b6;
          background: #0a1016;
        }

        .admin-subscription-notice.pending {
          border-color: rgba(251,191,36,.18);
          background: rgba(251,191,36,.035);
          color: #fbbf24;
        }

        .admin-subscription-notice.warning {
          border-color: rgba(248,113,113,.17);
          background: rgba(248,113,113,.035);
          color: #f87171;
        }

        .admin-subscription-notice strong {
          display: block;
          margin-bottom: 3px;
          color: inherit;
          font-size: 11px;
        }

        .admin-subscription-notice p {
          margin: 0;
          color: #7d8b9c;
          font-size: 10px;
          line-height: 1.5;
        }

        .admin-subscription-empty-current {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 22px 24px;
          border: 1px solid #273342;
          border-radius: 21px;
          background: linear-gradient(145deg, #101821, #0a1016);
        }

        .admin-subscription-empty-icon {
          width: 49px;
          height: 49px;
          display: grid;
          place-items: center;
          flex: 0 0 auto;
          border-radius: 14px;
          background: rgba(215,255,53,.07);
          color: #d7ff35;
        }

        .admin-subscription-empty-current h3 {
          margin: 6px 0 4px;
          color: #fff;
          font-size: 16px;
          font-weight: 900;
        }

        .admin-subscription-empty-current p {
          margin: 0;
          color: #718094;
          font-size: 11px;
          line-height: 1.6;
        }

        .admin-subscription-plan-count {
          flex: 0 0 auto;
          padding: 7px 10px;
          border: 1px solid #273240;
          border-radius: 999px;
          background: #0b1118;
          color: #718094;
          font-size: 9px;
          font-weight: 800;
        }

        .admin-subscription-plan-count::first-letter {
          color: #d7ff35;
        }

        .admin-subscription-plan-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 14px;
          padding: 18px 20px 22px;
        }

        .admin-subscription-plan {
          position: relative;
          display: flex;
          flex-direction: column;
          min-width: 0;
          padding: 19px;
          border: 1px solid #273342;
          border-radius: 17px;
          background: linear-gradient(145deg, #111a23, #0a1016);
          transition: transform .18s ease, border-color .18s ease, box-shadow .18s ease;
        }

        .admin-subscription-plan:hover {
          transform: translateY(-2px);
          border-color: #344352;
          box-shadow: 0 14px 35px rgba(0,0,0,.16);
        }

        .admin-subscription-plan.current {
          border-color: rgba(215,255,53,.36);
          box-shadow: 0 0 0 1px rgba(215,255,53,.04);
        }

        .admin-subscription-current-tag {
          position: absolute;
          top: 13px;
          right: 13px;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 5px 7px;
          border-radius: 999px;
          background: rgba(215,255,53,.09);
          color: #d7ff35;
          font-size: 8px;
          font-weight: 900;
          letter-spacing: .06em;
          text-transform: uppercase;
        }

        .admin-subscription-plan-top {
          display: flex;
          align-items: center;
          gap: 10px;
          min-height: 44px;
          padding-right: 55px;
        }

        .admin-subscription-plan-top-icon {
          width: 38px;
          height: 38px;
          display: grid;
          place-items: center;
          flex: 0 0 auto;
          border-radius: 11px;
          background: #151e27;
          color: #aeb9c7;
        }

        .admin-subscription-plan.current .admin-subscription-plan-top-icon {
          background: rgba(215,255,53,.09);
          color: #d7ff35;
        }

        .admin-subscription-plan-name {
          color: #f4f6f8;
          font-size: 14px;
          font-weight: 900;
        }

        .admin-subscription-plan-billing {
          margin-top: 2px;
          color: #68778a;
          font-size: 9px;
          text-transform: capitalize;
        }

        .admin-subscription-plan-price {
          display: flex;
          align-items: baseline;
          gap: 4px;
          margin-top: 21px;
        }

        .admin-subscription-plan-price strong {
          color: #fff;
          font-size: 25px;
          line-height: 1;
          font-weight: 950;
          letter-spacing: -.04em;
        }

        .admin-subscription-plan.current .admin-subscription-plan-price strong {
          color: #d7ff35;
        }

        .admin-subscription-plan-price span {
          color: #68778a;
          font-size: 9px;
        }

        .admin-subscription-plan-description {
          min-height: 42px;
          margin: 12px 0 16px;
          color: #758396;
          font-size: 10px;
          line-height: 1.6;
        }

        .admin-subscription-features {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin: 0 0 18px;
          padding: 13px 0;
          border-top: 1px solid #202b37;
          border-bottom: 1px solid #202b37;
        }

        .admin-subscription-feature {
          display: flex;
          align-items: flex-start;
          gap: 7px;
          color: #9ba7b6;
          font-size: 9px;
          line-height: 1.4;
        }

        .admin-subscription-feature svg {
          flex: 0 0 auto;
          margin-top: 1px;
          color: #d7ff35;
        }

        .admin-subscription-plan-button {
          width: 100%;
          min-height: 42px;
          margin-top: auto;
          justify-content: center;
        }

        .admin-subscription-no-plans {
          min-height: 220px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 25px;
          color: #657487;
          text-align: center;
        }

        .admin-subscription-no-plans svg {
          color: #d7ff35;
          margin-bottom: 10px;
        }

        .admin-subscription-no-plans h3 {
          margin: 0;
          color: #eef2f6;
          font-size: 14px;
        }

        .admin-subscription-no-plans p {
          margin: 5px 0 0;
          color: #68778a;
          font-size: 10px;
        }

        .admin-subscription-spin {
          animation: adminSubscriptionSpin .8s linear infinite;
        }

        @keyframes adminSubscriptionSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @media (max-width: 1050px) {
          .admin-subscription-hero {
            grid-template-columns: 1fr;
          }

          .admin-subscription-hero-card {
            width: 100%;
          }

          .admin-subscription-plan-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 780px) {
          .admin-subscription-current-grid {
            grid-template-columns: 1fr;
          }

          .admin-subscription-section-heading,
          .admin-subscription-plans-heading {
            align-items: flex-start;
            flex-direction: column;
          }

          .admin-subscription-plan-count {
            align-self: flex-start;
          }
        }

        @media (max-width: 620px) {
          .admin-subscription-hero {
            padding: 22px 18px;
            border-radius: 18px;
          }

          .admin-subscription-hero h2 {
            font-size: 26px;
          }

          .admin-subscription-trust {
            flex-direction: column;
            align-items: flex-start;
            gap: 8px;
          }

          .admin-subscription-section-heading,
          .admin-subscription-plans-heading {
            padding: 19px 17px;
          }

          .admin-subscription-current-grid {
            padding: 13px 12px 14px;
          }

          .admin-subscription-details {
            grid-template-columns: 1fr;
          }

          .admin-subscription-plan-grid {
            grid-template-columns: 1fr;
            padding: 13px 12px 15px;
          }

          .admin-subscription-empty-current {
            align-items: flex-start;
            flex-direction: column;
            padding: 19px;
          }

          .admin-subscription-notice {
            margin: 0 12px 14px;
          }
        }
      `}</style>
    </div>
  )
}

function StatusBadge({ status }) {
  const normalized = String(status || "unknown").toLowerCase()

  const positive = ["active", "trial"].includes(normalized)
  const negative = ["cancelled", "expired", "past_due"].includes(normalized)
  const pending = normalized === "pending"

  return (
    <span
      className="badge"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        textTransform: "capitalize",
        ...(positive
          ? {
              borderColor: "rgba(74,222,128,.18)",
              color: "#4ade80",
              background: "rgba(74,222,128,.06)",
            }
          : negative
          ? {
              borderColor: "rgba(248,113,113,.18)",
              color: "#f87171",
              background: "rgba(248,113,113,.06)",
            }
          : pending
          ? {
              borderColor: "rgba(251,191,36,.18)",
              color: "#fbbf24",
              background: "rgba(251,191,36,.06)",
            }
          : {}),
      }}
    >
      {positive ? (
        <CheckCircle2 size={11} />
      ) : negative ? (
        <XCircle size={11} />
      ) : pending ? (
        <CreditCard size={11} />
      ) : null}
      {status || "Unknown"}
    </span>
  )
}

function DetailItem({ icon: Icon, label, value, valueClass = "" }) {
  return (
    <div className="admin-subscription-detail">
      <div className="admin-subscription-detail-top">
        <Icon size={12} />
        <span className="admin-subscription-detail-label">
          {label}
        </span>
      </div>

      <div
        className={`admin-subscription-detail-value ${valueClass}`}
      >
        {value || "—"}
      </div>
    </div>
  )
}

function PlanCard({
  plan,
  isCurrent,
  choosing,
  disabled,
  onChoose,
}) {
  const features = Array.isArray(plan.features)
    ? plan.features.filter(Boolean).slice(0, 5)
    : []

  return (
    <article
      className={`admin-subscription-plan ${
        isCurrent ? "current" : ""
      }`}
    >
      {isCurrent && (
        <div className="admin-subscription-current-tag">
          <Check size={10} />
          Current
        </div>
      )}

      <div className="admin-subscription-plan-top">
        <div className="admin-subscription-plan-top-icon">
          <Zap size={18} />
        </div>

        <div>
          <div className="admin-subscription-plan-name">
            {plan.name}
          </div>

          <div className="admin-subscription-plan-billing">
            {plan.billingCycle || "monthly"} billing
          </div>
        </div>
      </div>

      <div className="admin-subscription-plan-price">
        <strong>{money(plan.price, plan.currency)}</strong>
        <span>/ {plan.billingCycle || "month"}</span>
      </div>

      <p className="admin-subscription-plan-description">
        {plan.description ||
          "A GB SaaS subscription plan for managing your gym on the platform."}
      </p>

      {features.length > 0 && (
        <div className="admin-subscription-features">
          {features.map((feature, index) => (
            <div
              className="admin-subscription-feature"
              key={`${plan._id}-feature-${index}`}
            >
              <CheckCircle2 size={12} />
              <span>
                {typeof feature === "string"
                  ? feature
                  : feature?.name || feature?.title || "Included feature"}
              </span>
            </div>
          ))}
        </div>
      )}

      <button
        type="button"
        className={`btn ${
          isCurrent ? "ghost" : "primary"
        } admin-subscription-plan-button`}
        disabled={disabled || isCurrent}
        onClick={onChoose}
      >
        {choosing ? (
          <>
            <RefreshCw
              size={14}
              className="admin-subscription-spin"
            />
            Opening payment...
          </>
        ) : isCurrent ? (
          <>
            <Check size={14} />
            Current plan
          </>
        ) : (
          <>
            Choose plan
            <ArrowRight size={14} />
          </>
        )}
      </button>
    </article>
  )
}
