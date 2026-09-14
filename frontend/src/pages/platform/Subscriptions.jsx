import { useEffect, useMemo, useState } from "react"
import {
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  CreditCard,
  Eye,
  Filter,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Trash2,
  Users,
  X,
  XCircle,
} from "lucide-react"

import { platform } from "../../api/api"
import { money, date, err } from "../../utils/helpers"
import "../../styles/platform.css"

export default function Subscriptions() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [query, setQuery] = useState("")
  const [filter, setFilter] = useState("all")
  const [selected, setSelected] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [processingId, setProcessingId] = useState(null)

  const load = async () => {
    setLoading(true)
    setError("")

    try {
      const response = await platform.subscriptions()
      setRows(response?.subscriptions || [])
    } catch (error) {
      setError(err(error))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const filtered = useMemo(() => {
    const search = query.trim().toLowerCase()

    return rows.filter((subscription) => {
      const status = String(subscription.status || "").toLowerCase()
      const matchesStatus = filter === "all" || status === filter

      const searchText = [
        subscription.gym?.name,
        subscription.plan?.name,
        subscription.planName,
        subscription.transactionReference,
        subscription.gym?.email,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()

      return matchesStatus && searchText.includes(search)
    })
  }, [rows, filter, query])

  const canDelete = (subscription) => {
    const status = String(subscription.status || "").toLowerCase()
    const paymentStatus = String(subscription.paymentStatus || "").toLowerCase()

    return (
      paymentStatus === "pending" &&
      ["pending", "cancelled"].includes(status)
    )
  }

  const canReactivate = (subscription) => {
    const status = String(subscription.status || "").toLowerCase()
    const paymentStatus = String(subscription.paymentStatus || "").toLowerCase()

    if (status !== "cancelled" || paymentStatus !== "paid") return false

    if (subscription.currentPeriodEnd) {
      const periodEnd = new Date(subscription.currentPeriodEnd)
      if (periodEnd <= new Date()) return false
    }

    return true
  }

  const needsRenewal = (subscription) => {
    const status = String(subscription.status || "").toLowerCase()
    const paymentStatus = String(subscription.paymentStatus || "").toLowerCase()

    if (["expired", "past_due"].includes(status)) return true

    if (status === "cancelled" && paymentStatus !== "paid") return true

    if (status === "cancelled" && subscription.currentPeriodEnd) {
      return new Date(subscription.currentPeriodEnd) <= new Date()
    }

    return false
  }

  const action = async (subscription) => {
    const status = String(subscription.status || "").toLowerCase()

    if (canDelete(subscription)) {
      setDeleteTarget(subscription)
      return
    }

    if (status === "cancelled" && canReactivate(subscription)) {
      try {
        setError("")
        setProcessingId(subscription._id)
        await platform.reactivateSubscription(subscription._id)
        await load()
        setSelected(null)
      } catch (error) {
        setError(err(error))
      } finally {
        setProcessingId(null)
      }
      return
    }

    if (status === "cancelled") {
      setError(
        "This subscription cannot be reactivated. A pending payment can be deleted, while an expired subscription must be renewed.",
      )
      return
    }

    if (needsRenewal(subscription)) {
      setError("This subscription needs to be renewed instead of cancelled.")
      return
    }

    try {
      setError("")
      setProcessingId(subscription._id)
      await platform.cancelSubscription(subscription._id)
      await load()
      setSelected(null)
    } catch (error) {
      setError(err(error))
    } finally {
      setProcessingId(null)
    }
  }

  const confirmDelete = (subscription) => {
    if (!canDelete(subscription)) {
      setError("Only pending unpaid subscriptions can be deleted.")
      return
    }

    setDeleteTarget(subscription)
  }

  const deletePendingSubscription = async () => {
    if (!deleteTarget || deleting) return

    try {
      setDeleting(true)
      setError("")

      await platform.deleteSubscription(deleteTarget._id)

      setRows((currentRows) =>
        currentRows.filter((item) => item._id !== deleteTarget._id),
      )

      setDeleteTarget(null)
      setSelected(null)
      await load()
    } catch (error) {
      setError(err(error))
    } finally {
      setDeleting(false)
    }
  }

  const stats = useMemo(() => {
    const active = rows.filter((item) =>
      ["active", "trial"].includes(
        String(item.status || "").toLowerCase(),
      ),
    ).length

    const paid = rows.filter(
      (item) =>
        String(item.paymentStatus || "").toLowerCase() === "paid",
    ).length

    const pending = rows.filter(
      (item) =>
        String(item.paymentStatus || "").toLowerCase() === "pending",
    ).length

    const cancelled = rows.filter(
      (item) =>
        String(item.status || "").toLowerCase() === "cancelled",
    ).length

    const recurringValue = rows
      .filter(
        (item) =>
          String(item.paymentStatus || "").toLowerCase() === "paid" &&
          ["active", "trial"].includes(
            String(item.status || "").toLowerCase(),
          ),
      )
      .reduce((sum, item) => sum + Number(item.amount || 0), 0)

    return { active, paid, pending, cancelled, recurringValue }
  }, [rows])

  return (
    <div className="platform-page">
      <div
        className="platform-wrap"
        style={{
          maxWidth: 1500,
          paddingBottom: 40,
        }}
      >
        <Header onRefresh={load} loading={loading} />

        <section className="subscription-hero">
          <div className="subscription-hero-copy">
            <div className="subscription-kicker">
              <span className="subscription-live-dot" />
              <ShieldCheck size={14} />
              PLATFORM BILLING
            </div>

            <h2>GB SaaS subscription control</h2>

            <p>
              Monitor every gym using the GB platform, track subscription
              health, and manage billing lifecycle from one workspace.
            </p>
          </div>

          <div className="subscription-hero-side">
            <div className="subscription-hero-icon">
              <CreditCard size={24} />
            </div>
            <div>
              <span>Paid subscription value</span>
              <strong>
                {money(stats.recurringValue, "NGN")}
              </strong>
              <small>Current paid billing records</small>
            </div>
          </div>
        </section>

        {error && (
          <div className="p-alert error subscription-alert">
            <XCircle size={17} />
            <span>{error}</span>
            <button
              type="button"
              className="subscription-alert-close"
              onClick={() => setError("")}
              aria-label="Dismiss"
            >
              <X size={15} />
            </button>
          </div>
        )}

        <div className="subscription-stat-grid">
          <MetricCard
            icon={CreditCard}
            label="Total subscriptions"
            value={rows.length}
            description="All subscription records"
          />
          <MetricCard
            icon={CheckCircle2}
            label="Active & trial"
            value={stats.active}
            description="Currently running plans"
            accent="green"
          />
          <MetricCard
            icon={Users}
            label="Paid"
            value={stats.paid}
            description="Successfully paid records"
            accent="lime"
          />
          <MetricCard
            icon={CalendarDays}
            label="Pending"
            value={stats.pending}
            description="Awaiting successful payment"
            accent="amber"
          />
        </div>

        <section className="subscription-panel">
          <div className="subscription-panel-heading">
            <div>
              <div className="subscription-section-label">
                <Sparkles size={13} />
                SUBSCRIPTION DIRECTORY
              </div>

              <h3>All gym subscriptions</h3>

              <p>
                Review plans, payment state, billing periods and account
                lifecycle.
              </p>
            </div>

            <div className="subscription-count-pill">
              <span>{filtered.length}</span>
              visible
            </div>
          </div>

          <div className="subscription-toolbar">
            <div className="subscription-search">
              <Search size={16} />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search gym, plan, email or transaction..."
                aria-label="Search subscriptions"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  aria-label="Clear search"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <div className="subscription-filter">
              <Filter size={14} />
              <select
                value={filter}
                onChange={(event) => setFilter(event.target.value)}
                aria-label="Filter subscriptions by status"
              >
                <option value="all">All statuses</option>
                <option value="active">Active</option>
                <option value="trial">Trial</option>
                <option value="pending">Pending</option>
                <option value="cancelled">Cancelled</option>
                <option value="suspended">Suspended</option>
                <option value="expired">Expired</option>
                <option value="past_due">Past due</option>
              </select>
            </div>

            <button
              type="button"
              className="p-btn subscription-refresh"
              onClick={load}
              disabled={loading}
            >
              <RefreshCw
                size={14}
                className={loading ? "subscription-spin" : ""}
              />
              Refresh
            </button>
          </div>

          <div className="subscription-table-wrap">
            {loading ? (
              <LoadingState />
            ) : filtered.length ? (
              <div className="subscription-scroll">
                <table className="p-table subscription-table">
                  <thead>
                    <tr>
                      <th>Gym</th>
                      <th>Plan</th>
                      <th>Billing</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Payment</th>
                      <th>Next billing</th>
                      <th className="subscription-actions-heading">
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {filtered.map((subscription) => (
                      <SubscriptionRow
                        key={subscription._id}
                        subscription={subscription}
                        processing={processingId === subscription._id}
                        canDelete={canDelete(subscription)}
                        canReactivate={canReactivate(subscription)}
                        needsRenewal={needsRenewal(subscription)}
                        onView={() => setSelected(subscription)}
                        onAction={() => action(subscription)}
                        onDelete={() => confirmDelete(subscription)}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <Empty hasFilters={Boolean(query || filter !== "all")} />
            )}
          </div>
        </section>
      </div>

      {selected && (
        <SubscriptionModal
          subscription={selected}
          processing={processingId === selected._id}
          canDelete={canDelete(selected)}
          canReactivate={canReactivate(selected)}
          needsRenewal={needsRenewal(selected)}
          onClose={() => setSelected(null)}
          onAction={() => action(selected)}
          onDelete={() => confirmDelete(selected)}
        />
      )}

      {deleteTarget && (
        <DeleteModal
          subscription={deleteTarget}
          deleting={deleting}
          onClose={() => {
            if (!deleting) setDeleteTarget(null)
          }}
          onConfirm={deletePendingSubscription}
        />
      )}

      <style>{`
        .subscription-hero {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          gap: 24px;
          align-items: center;
          padding: 28px 30px;
          margin-bottom: 18px;
          border: 1px solid #273342;
          border-radius: 24px;
          background:
            radial-gradient(circle at 85% 20%, rgba(215,255,53,.09), transparent 30%),
            linear-gradient(135deg, #111b25 0%, #0b1118 62%, #0a0f15 100%);
          box-shadow: 0 20px 70px rgba(0,0,0,.18);
          overflow: hidden;
          position: relative;
        }

        .subscription-hero::after {
          content: "";
          position: absolute;
          width: 220px;
          height: 220px;
          right: -100px;
          bottom: -120px;
          border-radius: 50%;
          border: 1px solid rgba(215,255,53,.08);
        }

        .subscription-hero-copy {
          position: relative;
          z-index: 1;
          max-width: 720px;
        }

        .subscription-kicker,
        .subscription-section-label {
          display: flex;
          align-items: center;
          gap: 7px;
          color: #d7ff35;
          font-size: 10px;
          font-weight: 900;
          letter-spacing: .14em;
          text-transform: uppercase;
        }

        .subscription-live-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #d7ff35;
          box-shadow: 0 0 12px rgba(215,255,53,.65);
        }

        .subscription-hero h2 {
          margin: 9px 0 7px;
          color: #fff;
          font-size: clamp(25px, 3vw, 36px);
          line-height: 1.05;
          font-weight: 950;
          letter-spacing: -.045em;
        }

        .subscription-hero p {
          margin: 0;
          max-width: 650px;
          color: #7f8c9e;
          font-size: 12px;
          line-height: 1.7;
        }

        .subscription-hero-side {
          min-width: 245px;
          display: flex;
          align-items: center;
          gap: 13px;
          padding: 16px 18px;
          border: 1px solid rgba(215,255,53,.15);
          border-radius: 16px;
          background: rgba(215,255,53,.035);
          position: relative;
          z-index: 1;
        }

        .subscription-hero-icon {
          width: 45px;
          height: 45px;
          display: grid;
          place-items: center;
          flex: 0 0 auto;
          border-radius: 13px;
          background: rgba(215,255,53,.09);
          color: #d7ff35;
        }

        .subscription-hero-side span,
        .subscription-hero-side small {
          display: block;
          color: #718094;
          font-size: 9px;
        }

        .subscription-hero-side strong {
          display: block;
          margin: 3px 0;
          color: #fff;
          font-size: 19px;
          font-weight: 950;
        }

        .subscription-stat-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 14px;
          margin-bottom: 18px;
        }

        .subscription-stat {
          position: relative;
          overflow: hidden;
          min-height: 126px;
          padding: 18px;
          border: 1px solid #263240;
          border-radius: 18px;
          background: linear-gradient(145deg, #111922, #0c131a);
        }

        .subscription-stat::after {
          content: "";
          position: absolute;
          width: 100px;
          height: 100px;
          top: -45px;
          right: -35px;
          border-radius: 50%;
          background: rgba(215,255,53,.035);
        }

        .subscription-stat-icon {
          width: 38px;
          height: 38px;
          display: grid;
          place-items: center;
          margin-bottom: 13px;
          border-radius: 11px;
          background: rgba(215,255,53,.08);
          color: #d7ff35;
        }

        .subscription-stat-icon.green {
          background: rgba(74,222,128,.08);
          color: #4ade80;
        }

        .subscription-stat-icon.lime {
          background: rgba(215,255,53,.09);
          color: #d7ff35;
        }

        .subscription-stat-icon.amber {
          background: rgba(251,191,36,.08);
          color: #fbbf24;
        }

        .subscription-stat-label {
          color: #718094;
          font-size: 9px;
          font-weight: 900;
          letter-spacing: .1em;
          text-transform: uppercase;
        }

        .subscription-stat-value {
          margin-top: 4px;
          color: #fff;
          font-size: 26px;
          line-height: 1;
          font-weight: 950;
          letter-spacing: -.04em;
        }

        .subscription-stat-description {
          margin-top: 6px;
          color: #68778a;
          font-size: 10px;
        }

        .subscription-panel {
          overflow: hidden;
          border: 1px solid #273342;
          border-radius: 22px;
          background: linear-gradient(145deg, #101821, #0a1016);
          box-shadow: 0 18px 60px rgba(0,0,0,.15);
        }

        .subscription-panel-heading {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 18px;
          padding: 23px 25px 20px;
          border-bottom: 1px solid #202b37;
        }

        .subscription-panel-heading h3 {
          margin: 6px 0 4px;
          color: #fff;
          font-size: 19px;
          font-weight: 900;
          letter-spacing: -.025em;
        }

        .subscription-panel-heading p {
          margin: 0;
          color: #718094;
          font-size: 11px;
        }

        .subscription-count-pill {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 7px 10px;
          border: 1px solid #273240;
          border-radius: 999px;
          color: #718094;
          background: #0b1118;
          font-size: 10px;
          white-space: nowrap;
        }

        .subscription-count-pill span {
          color: #d7ff35;
          font-weight: 900;
        }

        .subscription-toolbar {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 15px 20px;
          border-bottom: 1px solid #202b37;
          background: rgba(8,12,17,.35);
        }

        .subscription-search {
          position: relative;
          flex: 1 1 360px;
          min-width: 220px;
        }

        .subscription-search > svg {
          position: absolute;
          left: 13px;
          top: 50%;
          transform: translateY(-50%);
          color: #657487;
          pointer-events: none;
        }

        .subscription-search input,
        .subscription-filter select {
          width: 100%;
          height: 43px;
          border: 1px solid #263240;
          outline: none;
          border-radius: 11px;
          background: #090f15;
          color: #fff;
          font-size: 12px;
        }

        .subscription-search input {
          padding: 0 38px;
        }

        .subscription-search input::placeholder {
          color: #536173;
        }

        .subscription-search input:focus,
        .subscription-filter select:focus {
          border-color: rgba(215,255,53,.42);
          box-shadow: 0 0 0 3px rgba(215,255,53,.05);
        }

        .subscription-search button {
          position: absolute;
          right: 8px;
          top: 50%;
          transform: translateY(-50%);
          width: 27px;
          height: 27px;
          display: grid;
          place-items: center;
          border: 0;
          border-radius: 7px;
          background: #151e28;
          color: #788597;
          cursor: pointer;
        }

        .subscription-filter {
          position: relative;
          min-width: 165px;
        }

        .subscription-filter > svg {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: #657487;
          pointer-events: none;
        }

        .subscription-filter select {
          padding: 0 12px 0 34px;
          appearance: none;
        }

        .subscription-refresh {
          height: 43px;
          min-width: 100px;
          justify-content: center;
        }

        .subscription-table-wrap {
          padding: 0 18px 20px;
        }

        .subscription-scroll {
          overflow-x: auto;
          border: 1px solid #222d39;
          border-radius: 16px;
        }

        .subscription-table {
          min-width: 1110px;
        }

        .subscription-table tbody tr {
          transition: background .16s ease;
        }

        .subscription-table tbody tr:hover {
          background: rgba(215,255,53,.025);
        }

        .subscription-table td {
          vertical-align: middle;
        }

        .subscription-actions-heading {
          text-align: right !important;
        }

        .subscription-gym-cell {
          display: flex;
          align-items: center;
          gap: 11px;
          min-width: 205px;
        }

        .subscription-gym-avatar {
          width: 40px;
          height: 40px;
          display: grid;
          place-items: center;
          flex: 0 0 auto;
          border-radius: 12px;
          background: linear-gradient(145deg, #d7ff35, #91b900);
          color: #091006;
          font-size: 12px;
          font-weight: 950;
        }

        .subscription-gym-name {
          display: block;
          color: #f5f7fa;
          font-size: 12px;
          font-weight: 800;
        }

        .subscription-gym-meta {
          display: block;
          max-width: 190px;
          margin-top: 3px;
          overflow: hidden;
          color: #657487;
          font-size: 9px;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .subscription-plan-name {
          color: #eef2f6;
          font-size: 12px;
          font-weight: 800;
        }

        .subscription-billing-chip {
          display: inline-flex;
          align-items: center;
          padding: 5px 8px;
          border: 1px solid #27323f;
          border-radius: 7px;
          background: #0a1016;
          color: #9aa6b7;
          font-size: 9px;
          font-weight: 800;
          text-transform: capitalize;
        }

        .subscription-amount {
          color: #fff;
          font-size: 12px;
          font-weight: 900;
        }

        .subscription-amount-note {
          display: block;
          margin-top: 3px;
          color: #657487;
          font-size: 9px;
        }

        .subscription-period {
          display: flex;
          align-items: center;
          gap: 6px;
          color: #cbd4df;
          font-size: 11px;
          white-space: nowrap;
        }

        .subscription-actions {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 7px;
          flex-wrap: wrap;
        }

        .subscription-action {
          transition: transform .16s ease, border-color .16s ease, background .16s ease;
        }

        .subscription-action:hover:not(:disabled) {
          transform: translateY(-1px);
        }

        .subscription-action:disabled {
          opacity: .55;
          cursor: not-allowed;
        }

        .subscription-delete {
          border-color: rgba(239,68,68,.28) !important;
          color: #f87171 !important;
        }

        .subscription-delete:hover {
          background: rgba(239,68,68,.08) !important;
          border-color: rgba(239,68,68,.45) !important;
        }

        .subscription-renew {
          border-color: rgba(255,225,59,.28) !important;
          color: #ffe13b !important;
        }

        .subscription-renew:hover {
          background: rgba(255,225,59,.08) !important;
          border-color: rgba(255,225,59,.45) !important;
        }

        .subscription-alert {
          position: relative;
          display: flex;
          align-items: center;
          gap: 9px;
          margin-bottom: 18px;
          padding-right: 42px;
        }

        .subscription-alert-close {
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
        }

        .subscription-spin {
          animation: subscriptionSpin .8s linear infinite;
        }

        @keyframes subscriptionSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .subscription-modal-backdrop {
          overflow-y: auto !important;
          overflow-x: hidden !important;
          padding: 24px !important;
          align-items: center;
        }

        .subscription-modal {
          width: min(760px, 100%);
          max-height: 90vh;
          padding: 0 !important;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        .subscription-modal-header {
          flex-shrink: 0;
          padding: 22px 24px;
          border-bottom: 1px solid #202b37;
          background: linear-gradient(145deg, #121c26, #0d141b);
        }

        .subscription-modal-header-row {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 15px;
        }

        .subscription-modal-eyebrow {
          display: flex;
          align-items: center;
          gap: 7px;
          margin-bottom: 8px;
          color: #d7ff35;
          font-size: 9px;
          font-weight: 900;
          letter-spacing: .14em;
          text-transform: uppercase;
        }

        .subscription-modal-title {
          margin: 0;
          color: #fff;
          font-size: 21px;
          font-weight: 900;
        }

        .subscription-modal-subtitle {
          margin: 5px 0 0;
          color: #718094;
          font-size: 11px;
        }

        .subscription-modal-body {
          padding: 20px;
          overflow-y: auto;
          min-height: 0;
          flex: 1;
        }

        .subscription-summary-grid {
          display: grid;
          grid-template-columns: 1.25fr .75fr;
          gap: 12px;
          margin-bottom: 14px;
        }

        .subscription-summary-card {
          padding: 18px;
          border: 1px solid #263240;
          border-radius: 15px;
          background: linear-gradient(145deg, #111b24, #0b1118);
        }

        .subscription-summary-card.highlight {
          border-color: rgba(215,255,53,.18);
          background: rgba(215,255,53,.045);
        }

        .subscription-summary-label {
          display: block;
          color: #718094;
          font-size: 9px;
          font-weight: 900;
          letter-spacing: .1em;
          text-transform: uppercase;
        }

        .subscription-summary-value {
          display: block;
          margin-top: 7px;
          color: #fff;
          font-size: 20px;
          font-weight: 900;
        }

        .subscription-summary-card.highlight .subscription-summary-value {
          color: #d7ff35;
        }

        .subscription-summary-note {
          display: block;
          margin-top: 5px;
          color: #7b8899;
          font-size: 10px;
          text-transform: capitalize;
        }

        .subscription-detail-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
        }

        .subscription-info {
          min-width: 0;
          padding: 12px;
          border: 1px solid #222d39;
          border-radius: 12px;
          background: #0a1016;
        }

        .subscription-info-label {
          display: block;
          margin-bottom: 6px;
          color: #68778a;
          font-size: 9px;
          font-weight: 900;
          letter-spacing: .08em;
          text-transform: uppercase;
        }

        .subscription-info-value {
          min-height: 18px;
          overflow-wrap: anywhere;
          color: #dce3eb;
          font-size: 11px;
        }

        .subscription-modal-actions {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          margin-top: 18px;
          padding-top: 18px;
          border-top: 1px solid #202b37;
          flex-wrap: wrap;
        }

        .subscription-empty {
          min-height: 300px;
          display: grid;
          place-items: center;
          align-content: center;
          border: 1px solid #222d39;
          border-radius: 16px;
          background: #0a1016;
          text-align: center;
        }

        .subscription-empty-icon {
          width: 48px;
          height: 48px;
          display: grid;
          place-items: center;
          margin-bottom: 12px;
          border-radius: 14px;
          background: rgba(215,255,53,.07);
          color: #d7ff35;
        }

        .subscription-empty h3 {
          margin: 0;
          color: #eef2f6;
          font-size: 14px;
        }

        .subscription-empty p {
          margin: 6px 0 0;
          color: #68778a;
          font-size: 11px;
        }

        .subscription-delete-modal {
          width: min(460px, 100%);
          max-height: 90vh;
          overflow-y: auto;
        }

        .subscription-delete-icon {
          width: 44px;
          height: 44px;
          display: grid;
          place-items: center;
          margin-bottom: 14px;
          border-radius: 13px;
          background: rgba(239,68,68,.10);
          color: #f87171;
        }

        .subscription-delete-title {
          margin: 0;
          color: #fff;
          font-size: 20px;
          font-weight: 900;
        }

        .subscription-delete-copy {
          margin: 8px 0 0;
          color: #7d8a9b;
          font-size: 12px;
          line-height: 1.6;
        }

        .subscription-delete-warning {
          margin-top: 18px;
          padding: 14px;
          border: 1px solid rgba(239,68,68,.16);
          border-radius: 12px;
          background: rgba(239,68,68,.045);
          color: #9ca8b7;
          font-size: 11px;
          line-height: 1.6;
        }

        .subscription-delete-footer {
          display: flex;
          justify-content: flex-end;
          gap: 9px;
          margin-top: 20px;
          flex-wrap: wrap;
        }

        @media (max-width: 1050px) {
          .subscription-stat-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .subscription-hero {
            grid-template-columns: 1fr;
          }

          .subscription-hero-side {
            width: 100%;
          }
        }

        @media (max-width: 760px) {
          .subscription-toolbar {
            align-items: stretch;
            flex-direction: column;
          }

          .subscription-search,
          .subscription-filter {
            width: 100%;
          }

          .subscription-refresh {
            width: 100%;
          }

          .subscription-panel-heading {
            align-items: flex-start;
            flex-direction: column;
          }

          .subscription-count-pill {
            align-self: flex-start;
          }
        }

        @media (max-width: 620px) {
          .subscription-stat-grid {
            grid-template-columns: 1fr;
          }

          .subscription-hero {
            padding: 22px 18px;
            border-radius: 19px;
          }

          .subscription-hero h2 {
            font-size: 26px;
          }

          .subscription-panel-heading {
            padding: 20px 18px;
          }

          .subscription-table-wrap {
            padding: 0 10px 14px;
          }

          .subscription-modal-backdrop {
            padding: 12px !important;
            align-items: flex-start;
          }

          .subscription-summary-grid,
          .subscription-detail-grid {
            grid-template-columns: 1fr;
          }

          .subscription-modal-body {
            padding: 14px;
          }

          .subscription-modal-header {
            padding: 18px;
          }
        }

        @media (max-height: 760px) {
          .subscription-modal-backdrop {
            align-items: flex-start;
          }
        }
      `}</style>
    </div>
  )
}

function Header({ onRefresh, loading }) {
  return (
    <div
      className="platform-head"
      style={{
        marginBottom: 22,
      }}
    >
      <div>
        <div className="platform-eyebrow">
          <i />
          <ShieldCheck size={13} />
          PLATFORM OWNER
        </div>

        <h1>Subscriptions</h1>

        <p>
          Manage GB SaaS subscriptions across every gym on the platform.
        </p>
      </div>

      <button
        type="button"
        className="p-btn"
        onClick={onRefresh}
        disabled={loading}
        style={{
          minWidth: 108,
          justifyContent: "center",
        }}
      >
        <RefreshCw
          size={15}
          className={loading ? "subscription-spin" : ""}
        />
        Refresh
      </button>
    </div>
  )
}

function MetricCard({
  icon: Icon,
  label,
  value,
  description,
  accent,
}) {
  return (
    <div className="subscription-stat">
      <div className={`subscription-stat-icon ${accent || ""}`}>
        <Icon size={18} />
      </div>

      <div className="subscription-stat-label">{label}</div>
      <div className="subscription-stat-value">{value}</div>
      <div className="subscription-stat-description">{description}</div>
    </div>
  )
}

function SubscriptionRow({
  subscription,
  processing,
  canDelete,
  canReactivate,
  needsRenewal,
  onView,
  onAction,
  onDelete,
}) {
  const status = String(subscription.status || "").toLowerCase()
  const cancelled = status === "cancelled"
  const showReactivate = cancelled && canReactivate
  const showRenew =
    !canDelete &&
    !showReactivate &&
    (cancelled && !canReactivate || status === "expired" || status === "past_due")

  return (
    <tr>
      <td>
        <div className="subscription-gym-cell">
          <div className="subscription-gym-avatar">
            {initials(subscription.gym?.name || "Gym")}
          </div>

          <div style={{ minWidth: 0 }}>
            <b className="subscription-gym-name">
              {subscription.gym?.name || "—"}
            </b>

            <span className="subscription-gym-meta">
              {subscription.gym?.email ||
                subscription.transactionReference ||
                "No email or transaction reference"}
            </span>
          </div>
        </div>
      </td>

      <td>
        <b className="subscription-plan-name">
          {subscription.plan?.name || subscription.planName || "—"}
        </b>
      </td>

      <td>
        <span className="subscription-billing-chip">
          {subscription.billingCycle || "monthly"}
        </span>
      </td>

      <td>
        <strong className="subscription-amount">
          {money(subscription.amount, subscription.currency)}
        </strong>
        <span className="subscription-amount-note">
          per billing cycle
        </span>
      </td>

      <td>
        <Badge value={subscription.status} />
      </td>

      <td>
        <Badge value={subscription.paymentStatus} />
      </td>

      <td>
        <div className="subscription-period">
          <CalendarDays size={13} color="#657487" />
          {date(
            subscription.nextBillingDate ||
              subscription.currentPeriodEnd ||
              subscription.trialEndsAt,
          )}
        </div>
      </td>

      <td>
        <div className="subscription-actions">
          <button
            type="button"
            className="p-btn small subscription-action"
            onClick={onView}
          >
            <Eye size={13} />
            View
          </button>

          {canDelete ? (
            <button
              type="button"
              className="p-btn small subscription-action subscription-delete"
              onClick={(event) => {
                event.preventDefault()
                event.stopPropagation()
                onDelete()
              }}
              disabled={processing}
            >
              <Trash2 size={13} />
              Delete
            </button>
          ) : showReactivate ? (
            <button
              type="button"
              className="p-btn small primary subscription-action"
              onClick={onAction}
              disabled={processing}
            >
              {processing ? (
                <RefreshCw size={13} className="subscription-spin" />
              ) : (
                <RefreshCw size={13} />
              )}
              Reactivate
            </button>
          ) : showRenew || needsRenewal ? (
            <button
              type="button"
              className="p-btn small subscription-action subscription-renew"
              onClick={onAction}
              disabled={processing}
            >
              <RefreshCw size={13} />
              Renew
            </button>
          ) : (
            <button
              type="button"
              className="p-btn small danger subscription-action"
              onClick={onAction}
              disabled={processing}
            >
              {processing ? (
                <RefreshCw size={13} className="subscription-spin" />
              ) : (
                <XCircle size={13} />
              )}
              Cancel
            </button>
          )}
        </div>
      </td>
    </tr>
  )
}

function Badge({ value }) {
  const normalized = String(value || "none").toLowerCase()

  return (
    <span
      className={`p-badge ${normalized}`}
      style={{
        whiteSpace: "nowrap",
      }}
    >
      {["active", "paid"].includes(normalized) ? (
        <CheckCircle2 size={11} />
      ) : null}
      {String(value || "—")}
    </span>
  )
}

function LoadingState() {
  return (
    <div className="subscription-empty">
      <div>
        <div className="subscription-empty-icon" style={{ marginInline: "auto" }}>
          <RefreshCw size={22} className="subscription-spin" />
        </div>
        <h3>Loading subscriptions</h3>
        <p>Fetching the latest GB platform billing records...</p>
      </div>
    </div>
  )
}

function Empty({ hasFilters }) {
  return (
    <div className="subscription-empty">
      <div>
        <div className="subscription-empty-icon" style={{ marginInline: "auto" }}>
          <CreditCard size={22} />
        </div>
        <h3>
          {hasFilters ? "No matching subscriptions" : "No subscriptions found"}
        </h3>
        <p>
          {hasFilters
            ? "Try changing your search or status filter."
            : "Subscription records will appear here when gyms subscribe."}
        </p>
      </div>
    </div>
  )
}

function SubscriptionModal({
  subscription,
  processing,
  canDelete,
  canReactivate,
  needsRenewal,
  onClose,
  onAction,
  onDelete,
}) {
  const status = String(subscription.status || "").toLowerCase()
  const cancelled = status === "cancelled"
  const showReactivate = cancelled && canReactivate
  const showRenew =
    !canDelete &&
    !showReactivate &&
    (cancelled && !canReactivate ||
      status === "expired" ||
      status === "past_due" ||
      needsRenewal)

  return (
    <div
      className="p-modal-backdrop subscription-modal-backdrop"
      onMouseDown={onClose}
    >
      <div
        className="p-modal subscription-modal"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="subscription-modal-header">
          <div className="subscription-modal-header-row">
            <div>
              <div className="subscription-modal-eyebrow">
                <ShieldCheck size={12} />
                SUBSCRIPTION DETAILS
              </div>

              <h2 className="subscription-modal-title">
                {subscription.gym?.name || "Gym subscription"}
              </h2>

              <p className="subscription-modal-subtitle">
                Complete GB SaaS billing and subscription information.
              </p>
            </div>

            <button
              type="button"
              className="p-close"
              onClick={onClose}
              aria-label="Close"
            >
              <X size={17} />
            </button>
          </div>
        </div>

        <div className="subscription-modal-body">
          <div className="subscription-summary-grid">
            <div className="subscription-summary-card">
              <span className="subscription-summary-label">
                Current plan
              </span>

              <strong className="subscription-summary-value">
                {subscription.plan?.name || subscription.planName || "—"}
              </strong>

              <span className="subscription-summary-note">
                {subscription.billingCycle || "monthly"} billing
              </span>
            </div>

            <div className="subscription-summary-card highlight">
              <span className="subscription-summary-label">
                Subscription amount
              </span>

              <strong className="subscription-summary-value">
                {money(subscription.amount, subscription.currency)}
              </strong>

              <span className="subscription-summary-note">
                per billing cycle
              </span>
            </div>
          </div>

          <div className="subscription-detail-grid">
            <Info label="Gym" value={subscription.gym?.name} />
            <Info label="Gym email" value={subscription.gym?.email} />
            <Info label="Status" value={<Badge value={subscription.status} />} />
            <Info
              label="Payment"
              value={<Badge value={subscription.paymentStatus} />}
            />
            <Info label="Start date" value={date(subscription.startDate)} />
            <Info label="Trial ends" value={date(subscription.trialEndsAt)} />
            <Info
              label="Current period ends"
              value={date(subscription.currentPeriodEnd)}
            />
            <Info
              label="Next billing date"
              value={date(subscription.nextBillingDate)}
            />
            <Info
              label="Billing cycle"
              value={subscription.billingCycle || "monthly"}
            />
            <Info
              label="Transaction reference"
              value={subscription.transactionReference}
            />
          </div>

          <div className="subscription-modal-actions">
            <button
              type="button"
              className="p-btn ghost"
              onClick={onClose}
            >
              Close
            </button>

            {canDelete ? (
              <button
                type="button"
                className="p-btn subscription-delete"
                onClick={onDelete}
                disabled={processing}
              >
                <Trash2 size={15} />
                Delete pending subscription
              </button>
            ) : showReactivate ? (
              <button
                type="button"
                className="p-btn primary"
                onClick={onAction}
                disabled={processing}
              >
                {processing ? (
                  <RefreshCw size={15} className="subscription-spin" />
                ) : (
                  <RefreshCw size={15} />
                )}
                Reactivate subscription
              </button>
            ) : showRenew ? (
              <button
                type="button"
                className="p-btn subscription-renew"
                onClick={onAction}
                disabled={processing}
              >
                <RefreshCw size={15} />
                Renew subscription
              </button>
            ) : (
              <button
                type="button"
                className="p-btn danger"
                onClick={onAction}
                disabled={processing}
              >
                {processing ? (
                  <RefreshCw size={15} className="subscription-spin" />
                ) : (
                  <XCircle size={15} />
                )}
                Cancel subscription
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function DeleteModal({
  subscription,
  deleting,
  onClose,
  onConfirm,
}) {
  return (
    <div
      className="p-modal-backdrop subscription-modal-backdrop"
      onMouseDown={onClose}
    >
      <div
        className="p-modal subscription-delete-modal"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 15,
          }}
        >
          <div>
            <div className="subscription-delete-icon">
              <Trash2 size={20} />
            </div>

            <h2 className="subscription-delete-title">
              Delete pending subscription?
            </h2>

            <p className="subscription-delete-copy">
              This will permanently remove the unpaid subscription record for{" "}
              <strong style={{ color: "#dce3eb" }}>
                {subscription.gym?.name || "this gym"}
              </strong>
              .
            </p>
          </div>

          <button
            type="button"
            className="p-close"
            onClick={onClose}
            disabled={deleting}
            aria-label="Close"
          >
            <X size={17} />
          </button>
        </div>

        <div className="subscription-delete-warning">
          <strong style={{ color: "#fca5a5" }}>Important:</strong>{" "}
          This action is only for subscriptions whose payment is still
          pending. Paid subscription records cannot be permanently deleted.
        </div>

        <div className="subscription-delete-footer">
          <button
            type="button"
            className="p-btn ghost"
            onClick={onClose}
            disabled={deleting}
          >
            Keep subscription
          </button>

          <button
            type="button"
            className="p-btn danger"
            onClick={onConfirm}
            disabled={deleting}
          >
            {deleting ? (
              <>
                <RefreshCw size={14} className="subscription-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 size={14} />
                Delete permanently
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

function Info({ label, value }) {
  return (
    <div className="subscription-info">
      <label className="subscription-info-label">{label}</label>
      <div className="subscription-info-value">{value || "—"}</div>
    </div>
  )
}

function initials(value) {
  const words = String(value || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)

  if (!words.length) return "GY"

  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase()
  }

  return `${words[0][0]}${words[1][0]}`.toUpperCase()
}
