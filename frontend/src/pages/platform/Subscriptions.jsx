import {
  useEffect,
  useMemo,
  useState,
} from "react"

import {
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  CreditCard,
  Eye,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  X,
  XCircle,
} from "lucide-react"

import { platform } from "../../api/api"
import {
  money,
  date,
  err,
} from "../../utils/helpers"

import "../../styles/platform.css"

export default function Subscriptions() {
  const [
    rows,
    setRows,
  ] = useState([])

  const [
    loading,
    setLoading,
  ] = useState(true)

  const [
    error,
    setError,
  ] = useState("")

  const [
    query,
    setQuery,
  ] = useState("")

  const [
    filter,
    setFilter,
  ] = useState("all")

  const [
    selected,
    setSelected,
  ] = useState(null)

  const load = async () => {
    setLoading(true)
    setError("")

    try {
      const response =
        await platform.subscriptions()

      setRows(
        response?.subscriptions || [],
      )
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
    const search =
      query
        .trim()
        .toLowerCase()

    return rows.filter(
      (subscription) => {
        const matchesStatus =
          filter === "all" ||
          String(
            subscription.status || "",
          ).toLowerCase() === filter

        const searchText =
          `${subscription.gym?.name || ""} ${
            subscription.plan?.name ||
            subscription.planName ||
            ""
          } ${
            subscription.transactionReference ||
            ""
          }`.toLowerCase()

        return (
          matchesStatus &&
          searchText.includes(search)
        )
      },
    )
  }, [
    rows,
    filter,
    query,
  ])

  const action = async (
    subscription,
  ) => {
    try {
      setError("")

      if (
        subscription.status ===
        "cancelled"
      ) {
        await platform.reactivateSubscription(
          subscription._id,
        )
      } else {
        await platform.cancelSubscription(
          subscription._id,
        )
      }

      await load()

      setSelected(null)
    } catch (error) {
      setError(err(error))
    }
  }

  const activeCount =
    rows.filter(
      (subscription) =>
        [
          "active",
          "trial",
        ].includes(
          String(
            subscription.status || "",
          ).toLowerCase(),
        ),
    ).length

  const paidCount =
    rows.filter(
      (subscription) =>
        String(
          subscription.paymentStatus ||
            "",
        ).toLowerCase() ===
        "paid",
    ).length

  const pendingCount =
    rows.filter(
      (subscription) =>
        String(
          subscription.status || "",
        ).toLowerCase() ===
        "pending",
    ).length

  return (
    <div className="platform-page">
      <div
        className="platform-wrap"
        style={{
          maxWidth: 1500,
        }}
      >
        <Header
          onRefresh={load}
          loading={loading}
        />

        {/* ============================================================
            OVERVIEW
        ============================================================ */}

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(4, minmax(0, 1fr))",
            gap: 14,
            marginBottom: 20,
          }}
          className="subscription-stats"
        >
          <MetricCard
            icon={CreditCard}
            label="Total subscriptions"
            value={rows.length}
            description="All gym subscription records"
          />

          <MetricCard
            icon={CheckCircle2}
            label="Active & trial"
            value={activeCount}
            description="Currently running plans"
            accent="lime"
          />

          <MetricCard
            icon={ShieldCheck}
            label="Paid"
            value={paidCount}
            description="Successfully paid subscriptions"
            accent="yellow"
          />

          <MetricCard
            icon={CalendarDays}
            label="Pending"
            value={pendingCount}
            description="Awaiting activation or payment"
          />
        </div>

        {/* ============================================================
            ERROR
        ============================================================ */}

        {error && (
          <div
            className="p-alert error"
            style={{
              marginBottom: 18,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <XCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* ============================================================
            BILLING CENTER
        ============================================================ */}

        <section
          style={{
            border:
              "1px solid #25303d",
            borderRadius: 22,
            overflow: "hidden",
            background:
              "linear-gradient(145deg,#101821,#0b1016)",
            boxShadow:
              "0 18px 60px rgba(0,0,0,.18)",
          }}
        >
          {/* ========================================================
              SECTION HEADER
          ======================================================== */}

          <div
            style={{
              padding:
                "22px 24px",
              borderBottom:
                "1px solid #202b37",
              display: "flex",
              alignItems:
                "center",
              justifyContent:
                "space-between",
              gap: 18,
              flexWrap: "wrap",
            }}
          >
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems:
                    "center",
                  gap: 8,
                  color:
                    "#d7ff35",
                  fontSize: 10,
                  fontWeight: 900,
                  letterSpacing:
                    ".14em",
                  textTransform:
                    "uppercase",
                  marginBottom: 7,
                }}
              >
                <Sparkles
                  size={13}
                />
                BILLING CENTER
              </div>

              <h2
                style={{
                  margin: 0,
                  fontSize: 19,
                  fontWeight: 900,
                  letterSpacing:
                    "-.025em",
                  color:
                    "#ffffff",
                }}
              >
                Gym subscriptions
              </h2>

              <p
                style={{
                  margin:
                    "5px 0 0",
                  color:
                    "#718094",
                  fontSize: 11,
                }}
              >
                Manage plans, billing
                status and subscription
                lifecycle.
              </p>
            </div>

            <div
              style={{
                display: "flex",
                alignItems:
                  "center",
                gap: 8,
                color:
                  "#7f8b9c",
                fontSize: 11,
              }}
            >
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius:
                    "50%",
                  background:
                    "#d7ff35",
                  boxShadow:
                    "0 0 12px rgba(215,255,53,.55)",
                }}
              />

              Live subscription
              data
            </div>
          </div>

          {/* ========================================================
              TOOLBAR
          ======================================================== */}

          <div
            style={{
              padding:
                "18px 24px",
              borderBottom:
                "1px solid #202b37",
              display: "flex",
              alignItems:
                "center",
              gap: 10,
              flexWrap: "wrap",
              background:
                "rgba(8,12,17,.35)",
            }}
          >
            <div
              style={{
                position:
                  "relative",
                flex: "1 1 300px",
                minWidth: 220,
              }}
            >
              <Search
                size={16}
                style={{
                  position:
                    "absolute",
                  left: 13,
                  top: "50%",
                  transform:
                    "translateY(-50%)",
                  color:
                    "#657487",
                  pointerEvents:
                    "none",
                }}
              />

              <input
                value={query}
                onChange={(event) =>
                  setQuery(
                    event.target.value,
                  )
                }
                placeholder="Search gyms, plans or references..."
                style={{
                  width: "100%",
                  height: 43,
                  border:
                    "1px solid #263240",
                  background:
                    "#090f15",
                  color:
                    "#ffffff",
                  borderRadius: 11,
                  padding:
                    "0 13px 0 38px",
                  outline: "none",
                  fontSize: 12,
                }}
              />
            </div>

            <select
              value={filter}
              onChange={(event) =>
                setFilter(
                  event.target.value,
                )
              }
              style={{
                height: 43,
                minWidth: 155,
                border:
                  "1px solid #263240",
                background:
                  "#090f15",
                color:
                  "#ffffff",
                borderRadius: 11,
                padding:
                  "0 12px",
                outline: "none",
                fontSize: 12,
              }}
            >
              <option value="all">
                All statuses
              </option>
              <option value="active">
                Active
              </option>
              <option value="trial">
                Trial
              </option>
              <option value="pending">
                Pending
              </option>
              <option value="cancelled">
                Cancelled
              </option>
              <option value="suspended">
                Suspended
              </option>
            </select>

            <button
              className="p-btn small"
              onClick={load}
              disabled={loading}
              style={{
                height: 43,
                padding:
                  "0 14px",
              }}
            >
              <RefreshCw
                size={14}
                className={
                  loading
                    ? "subscription-spin"
                    : ""
                }
              />
              Refresh
            </button>
          </div>

          {/* ========================================================
              RESULTS COUNT
          ======================================================== */}

          <div
            style={{
              padding:
                "14px 24px 10px",
              color:
                "#667487",
              fontSize: 10,
              fontWeight: 700,
            }}
          >
            Showing{" "}
            <strong
              style={{
                color:
                  "#cbd4df",
              }}
            >
              {filtered.length}
            </strong>{" "}
            of{" "}
            <strong
              style={{
                color:
                  "#cbd4df",
              }}
            >
              {rows.length}
            </strong>{" "}
            subscriptions
          </div>

          {/* ========================================================
              TABLE
          ======================================================== */}

          <div
            style={{
              padding:
                "0 18px 20px",
            }}
          >
            {loading ? (
              <LoadingState />
            ) : filtered.length ? (
              <div
                style={{
                  overflowX:
                    "auto",
                  border:
                    "1px solid #222d39",
                  borderRadius:
                    16,
                }}
              >
                <table
                  className="p-table subscription-table"
                  style={{
                    minWidth:
                      980,
                  }}
                >
                  <thead>
                    <tr>
                      <th>
                        Gym
                      </th>
                      <th>
                        Plan
                      </th>
                      <th>
                        Billing
                      </th>
                      <th>
                        Amount
                      </th>
                      <th>
                        Status
                      </th>
                      <th>
                        Payment
                      </th>
                      <th>
                        Period end
                      </th>
                      <th
                        style={{
                          textAlign:
                            "right",
                        }}
                      >
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {filtered.map(
                      (
                        subscription,
                      ) => (
                        <SubscriptionRow
                          key={
                            subscription._id
                          }
                          subscription={
                            subscription
                          }
                          onView={() =>
                            setSelected(
                              subscription,
                            )
                          }
                          onAction={() =>
                            action(
                              subscription,
                            )
                          }
                        />
                      ),
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              <Empty />
            )}
          </div>
        </section>
      </div>

      {selected && (
        <SubscriptionModal
          subscription={
            selected
          }
          onClose={() =>
            setSelected(null)
          }
          onAction={() =>
            action(selected)
          }
        />
      )}

      <style>
        {`
          .subscription-spin {
            animation: subscriptionSpin .8s linear infinite;
          }

          @keyframes subscriptionSpin {
            from {
              transform: rotate(0deg);
            }

            to {
              transform: rotate(360deg);
            }
          }

          .subscription-table tbody tr {
            transition: background .16s ease;
          }

          .subscription-table tbody tr:hover {
            background: rgba(215,255,53,.025);
          }

          .subscription-action {
            transition:
              transform .16s ease,
              border-color .16s ease,
              background .16s ease;
          }

          .subscription-action:hover {
            transform: translateY(-1px);
          }

          @media (max-width: 900px) {
            .subscription-stats {
              grid-template-columns: repeat(2,minmax(0,1fr)) !important;
            }
          }

          @media (max-width: 560px) {
            .subscription-stats {
              grid-template-columns: 1fr !important;
            }
          }
        `}
      </style>
    </div>
  )
}

/* ======================================================================
   HEADER
====================================================================== */

function Header({
  onRefresh,
  loading,
}) {
  return (
    <div
      className="platform-head"
      style={{
        marginBottom: 25,
      }}
    >
      <div>
        <div className="platform-eyebrow">
          <i />
          <ShieldCheck
            size={13}
          />
          BILLING CONTROL
        </div>

        <h1>
          Subscription
          management
        </h1>

        <p>
          Monitor gym plans, payments
          and billing periods from one
          central workspace.
        </p>
      </div>

      <button
        className="p-btn"
        onClick={onRefresh}
        disabled={loading}
        style={{
          minWidth: 108,
          justifyContent:
            "center",
        }}
      >
        <RefreshCw
          size={15}
          className={
            loading
              ? "subscription-spin"
              : ""
          }
        />
        Refresh
      </button>
    </div>
  )
}

/* ======================================================================
   METRIC CARD
====================================================================== */

function MetricCard({
  icon: Icon,
  label,
  value,
  description,
  accent,
}) {
  const isYellow =
    accent === "yellow"

  return (
    <div
      style={{
        position:
          "relative",
        overflow: "hidden",
        minHeight: 124,
        padding: 18,
        border:
          "1px solid #25303d",
        borderRadius: 18,
        background:
          "linear-gradient(145deg,#111922,#0d131b)",
      }}
    >
      <div
        style={{
          position:
            "absolute",
          right: -24,
          top: -24,
          width: 90,
          height: 90,
          borderRadius:
            "50%",
          background: isYellow
            ? "rgba(255,225,59,.035)"
            : "rgba(215,255,53,.035)",
        }}
      />

      <div
        style={{
          width: 39,
          height: 39,
          borderRadius: 11,
          display: "grid",
          placeItems: "center",
          background:
            isYellow
              ? "rgba(255,225,59,.09)"
              : "rgba(215,255,53,.09)",
          color:
            isYellow
              ? "#ffe13b"
              : "#d7ff35",
          marginBottom: 13,
        }}
      >
        <Icon size={18} />
      </div>

      <div
        style={{
          color: "#718094",
          fontSize: 9,
          fontWeight: 900,
          letterSpacing: ".1em",
          textTransform:
            "uppercase",
        }}
      >
        {label}
      </div>

      <div
        style={{
          marginTop: 4,
          color: "#ffffff",
          fontSize: 25,
          lineHeight: 1,
          fontWeight: 900,
          letterSpacing: "-.04em",
        }}
      >
        {value}
      </div>

      <div
        style={{
          marginTop: 6,
          color: "#68778a",
          fontSize: 10,
        }}
      >
        {description}
      </div>
    </div>
  )
}

/* ======================================================================
   SUBSCRIPTION ROW
====================================================================== */

function SubscriptionRow({
  subscription,
  onView,
  onAction,
}) {
  const cancelled =
    String(
      subscription.status || "",
    ).toLowerCase() ===
    "cancelled"

  return (
    <tr>
      {/* Gym */}

      <td>
        <div
          style={{
            display: "flex",
            alignItems:
              "center",
            gap: 11,
            minWidth: 190,
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              display: "grid",
              placeItems: "center",
              flexShrink: 0,
              background:
                "linear-gradient(145deg,#d7ff35,#91b900)",
              color: "#091006",
              fontWeight: 950,
              fontSize: 13,
            }}
          >
            {initials(
              subscription.gym?.name ||
                "Gym",
            )}
          </div>

          <div
            style={{
              minWidth: 0,
            }}
          >
            <b
              style={{
                display: "block",
                color:
                  "#f5f7fa",
                fontSize: 12,
              }}
            >
              {subscription.gym?.name ||
                "—"}
            </b>

            <span
              style={{
                display:
                  "block",
                marginTop: 3,
                color:
                  "#657487",
                fontSize: 9,
                whiteSpace:
                  "nowrap",
                overflow:
                  "hidden",
                textOverflow:
                  "ellipsis",
                maxWidth: 180,
              }}
              title={
                subscription.transactionReference ||
                ""
              }
            >
              {subscription.transactionReference ||
                "No transaction reference"}
            </span>
          </div>
        </div>
      </td>

      {/* Plan */}

      <td>
        <b
          style={{
            color: "#eef2f6",
            fontSize: 12,
          }}
        >
          {subscription.plan?.name ||
            subscription.planName ||
            "—"}
        </b>
      </td>

      {/* Billing */}

      <td>
        <span
          style={{
            display:
              "inline-flex",
            alignItems:
              "center",
            padding:
              "5px 8px",
            border:
              "1px solid #27323f",
            borderRadius: 7,
            background:
              "#0a1016",
            color:
              "#9aa6b7",
            fontSize: 9,
            fontWeight: 800,
            textTransform:
              "capitalize",
          }}
        >
          {subscription.billingCycle ||
            "monthly"}
        </span>
      </td>

      {/* Amount */}

      <td>
        <strong
          style={{
            color:
              "#ffffff",
            fontSize: 12,
          }}
        >
          {money(
            subscription.amount,
            subscription.currency,
          )}
        </strong>

        <span
          style={{
            display:
              "block",
            marginTop: 3,
            color:
              "#657487",
            fontSize: 9,
          }}
        >
          per billing cycle
        </span>
      </td>

      {/* Status */}

      <td>
        <Badge
          value={
            subscription.status
          }
        />
      </td>

      {/* Payment */}

      <td>
        <Badge
          value={
            subscription.paymentStatus
          }
        />
      </td>

      {/* Period */}

      <td>
        <div
          style={{
            display:
              "flex",
            alignItems:
              "center",
            gap: 6,
            color:
              "#cbd4df",
            fontSize: 11,
            whiteSpace:
              "nowrap",
          }}
        >
          <CalendarDays
            size={13}
            color="#657487"
          />

          {date(
            subscription.currentPeriodEnd ||
              subscription.trialEndsAt,
          )}
        </div>
      </td>

      {/* Actions */}

      <td>
        <div
          style={{
            display:
              "flex",
            alignItems:
              "center",
            justifyContent:
              "flex-end",
            gap: 7,
          }}
        >
          <button
            className="p-btn small subscription-action"
            onClick={onView}
          >
            <Eye size={13} />
            View
          </button>

          <button
            className={`p-btn small subscription-action ${
              cancelled
                ? "primary"
                : "danger"
            }`}
            onClick={onAction}
          >
            {cancelled ? (
              <>
                <RefreshCw
                  size={13}
                />
                Reactivate
              </>
            ) : (
              <>
                <XCircle
                  size={13}
                />
                Cancel
              </>
            )}
          </button>
        </div>
      </td>
    </tr>
  )
}

/* ======================================================================
   BADGE
====================================================================== */

function Badge({
  value,
}) {
  const normalized =
    String(
      value || "none",
    ).toLowerCase()

  const label =
    String(
      value || "—",
    )

  return (
    <span
      className={`p-badge ${normalized}`}
      style={{
        whiteSpace:
          "nowrap",
      }}
    >
      {normalized ===
        "active" ||
      normalized ===
        "paid" ? (
        <CheckCircle2
          size={11}
        />
      ) : null}

      {label}
    </span>
  )
}

/* ======================================================================
   LOADING
====================================================================== */

function LoadingState() {
  return (
    <div
      style={{
        minHeight: 300,
        display: "grid",
        placeItems: "center",
        border:
          "1px solid #222d39",
        borderRadius: 16,
        background:
          "#0a1016",
      }}
    >
      <div
        style={{
          display: "grid",
          justifyItems:
            "center",
          gap: 10,
          color:
            "#718094",
          fontSize: 12,
        }}
      >
        <RefreshCw
          size={22}
          className="subscription-spin"
          color="#d7ff35"
        />

        Loading subscriptions...
      </div>
    </div>
  )
}

/* ======================================================================
   EMPTY
====================================================================== */

function Empty() {
  return (
    <div
      className="p-empty"
      style={{
        minHeight: 300,
        display: "grid",
        placeItems:
          "center",
        alignContent:
          "center",
        border:
          "1px solid #222d39",
        borderRadius: 16,
        background:
          "#0a1016",
      }}
    >
      <div
        className="p-empty-icon"
      >
        <CreditCard
          size={22}
        />
      </div>

      <h3>
        No subscriptions found
      </h3>

      <p>
        Try changing your search
        or status filter.
      </p>
    </div>
  )
}

/* ======================================================================
   SUBSCRIPTION MODAL
====================================================================== */

function SubscriptionModal({
  subscription,
  onClose,
  onAction,
}) {
  const cancelled =
    String(
      subscription.status || "",
    ).toLowerCase() ===
    "cancelled"

  return (
    <div
      className="p-modal-backdrop"
      onMouseDown={onClose}
    >
      <div
        className="p-modal"
        onMouseDown={(event) =>
          event.stopPropagation()
        }
        style={{
          width:
            "min(720px, 100%)",
          padding: 0,
          overflow: "hidden",
        }}
      >
        {/* Modal header */}

        <div
          style={{
            padding:
              "22px 24px",
            borderBottom:
              "1px solid #202b37",
            background:
              "linear-gradient(145deg,#121c26,#0d141b)",
          }}
        >
          <div
            style={{
              display:
                "flex",
              alignItems:
                "flex-start",
              justifyContent:
                "space-between",
              gap: 15,
            }}
          >
            <div>
              <div
                style={{
                  display:
                    "flex",
                  alignItems:
                    "center",
                  gap: 7,
                  color:
                    "#d7ff35",
                  fontSize: 9,
                  fontWeight: 900,
                  letterSpacing:
                    ".14em",
                  textTransform:
                    "uppercase",
                  marginBottom: 8,
                }}
              >
                <ShieldCheck
                  size={12}
                />
                SUBSCRIPTION DETAILS
              </div>

              <h2
                style={{
                  margin: 0,
                  color:
                    "#ffffff",
                  fontSize: 21,
                  fontWeight: 900,
                }}
              >
                {subscription.gym?.name ||
                  "Gym subscription"}
              </h2>

              <p
                style={{
                  margin:
                    "5px 0 0",
                  color:
                    "#718094",
                  fontSize: 11,
                }}
              >
                Complete billing
                and subscription
                information.
              </p>
            </div>

            <button
              className="p-close"
              onClick={onClose}
              aria-label="Close"
            >
              <X size={17} />
            </button>
          </div>
        </div>

        {/* Plan summary */}

        <div
          style={{
            padding: 20,
          }}
        >
          <div
            style={{
              display:
                "grid",
              gridTemplateColumns:
                "1.25fr .75fr",
              gap: 12,
              marginBottom: 14,
            }}
            className="subscription-modal-summary"
          >
            <div
              style={{
                padding: 18,
                border:
                  "1px solid #263240",
                borderRadius: 15,
                background:
                  "linear-gradient(145deg,#111b24,#0b1118)",
              }}
            >
              <span
                style={{
                  display:
                    "block",
                  color:
                    "#718094",
                  fontSize: 9,
                  fontWeight: 900,
                  letterSpacing:
                    ".1em",
                  textTransform:
                    "uppercase",
                }}
              >
                Current plan
              </span>

              <strong
                style={{
                  display:
                    "block",
                  marginTop: 7,
                  color:
                    "#ffffff",
                  fontSize: 20,
                  fontWeight: 900,
                }}
              >
                {subscription.plan?.name ||
                  subscription.planName ||
                  "—"}
              </strong>

              <span
                style={{
                  display:
                    "block",
                  marginTop: 5,
                  color:
                    "#7b8899",
                  fontSize: 10,
                }}
              >
                {subscription.billingCycle ||
                  "monthly"}{" "}
                billing
              </span>
            </div>

            <div
              style={{
                padding: 18,
                border:
                  "1px solid rgba(215,255,53,.18)",
                borderRadius: 15,
                background:
                  "rgba(215,255,53,.045)",
              }}
            >
              <span
                style={{
                  display:
                    "block",
                  color:
                    "#718094",
                  fontSize: 9,
                  fontWeight: 900,
                  letterSpacing:
                    ".1em",
                  textTransform:
                    "uppercase",
                }}
              >
                Subscription amount
              </span>

              <strong
                style={{
                  display:
                    "block",
                  marginTop: 7,
                  color:
                    "#d7ff35",
                  fontSize: 20,
                  fontWeight: 900,
                }}
              >
                {money(
                  subscription.amount,
                  subscription.currency,
                )}
              </strong>

              <span
                style={{
                  display:
                    "block",
                  marginTop: 5,
                  color:
                    "#7b8899",
                  fontSize: 10,
                }}
              >
                Per billing cycle
              </span>
            </div>
          </div>

          {/* Details */}

          <div
            style={{
              display:
                "grid",
              gridTemplateColumns:
                "repeat(2,minmax(0,1fr))",
              gap: 10,
            }}
            className="subscription-detail-grid"
          >
            <Info
              label="Status"
              value={
                <Badge
                  value={
                    subscription.status
                  }
                />
              }
            />

            <Info
              label="Payment"
              value={
                <Badge
                  value={
                    subscription.paymentStatus
                  }
                />
              }
            />

            <Info
              label="Start date"
              value={date(
                subscription.startDate,
              )}
            />

            <Info
              label="Trial ends"
              value={date(
                subscription.trialEndsAt,
              )}
            />

            <Info
              label="Current period ends"
              value={date(
                subscription.currentPeriodEnd,
              )}
            />

            <Info
              label="Next billing date"
              value={date(
                subscription.nextBillingDate,
              )}
            />

            <Info
              label="Billing cycle"
              value={
                subscription.billingCycle ||
                "monthly"
              }
            />

            <Info
              label="Transaction reference"
              value={
                subscription.transactionReference ||
                "—"
              }
            />
          </div>

          {/* Actions */}

          <div
            style={{
              display:
                "flex",
              justifyContent:
                "space-between",
              alignItems:
                "center",
              gap: 10,
              marginTop: 18,
              paddingTop: 18,
              borderTop:
                "1px solid #202b37",
            }}
          >
            <button
              className="p-btn ghost"
              onClick={onClose}
            >
              Close
            </button>

            <button
              className={`p-btn ${
                cancelled
                  ? "primary"
                  : "danger"
              }`}
              onClick={onAction}
            >
              {cancelled ? (
                <>
                  <RefreshCw
                    size={15}
                  />
                  Reactivate subscription
                </>
              ) : (
                <>
                  <XCircle
                    size={15}
                  />
                  Cancel subscription
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <style>
        {`
          @media (max-width: 620px) {
            .subscription-modal-summary {
              grid-template-columns: 1fr !important;
            }

            .subscription-detail-grid {
              grid-template-columns: 1fr !important;
            }
          }
        `}
      </style>
    </div>
  )
}

/* ======================================================================
   INFO
====================================================================== */

function Info({
  label,
  value,
}) {
  return (
    <div
      style={{
        minWidth: 0,
        padding: 12,
        border:
          "1px solid #222d39",
        borderRadius: 12,
        background:
          "#0a1016",
      }}
    >
      <label
        style={{
          display:
            "block",
          marginBottom: 6,
          color:
            "#68778a",
          fontSize: 9,
          fontWeight: 900,
          letterSpacing:
            ".08em",
          textTransform:
            "uppercase",
        }}
      >
        {label}
      </label>

      <div
        style={{
          minHeight: 18,
          color:
            "#dce3eb",
          fontSize: 11,
          overflowWrap:
            "anywhere",
        }}
      >
        {value || "—"}
      </div>
    </div>
  )
}

/* ======================================================================
   INITIALS
====================================================================== */

function initials(
  value,
) {
  const words =
    String(value || "")
      .trim()
      .split(/\s+/)
      .filter(Boolean)

  if (!words.length) {
    return "GY"
  }

  if (words.length === 1) {
    return words[0]
      .slice(0, 2)
      .toUpperCase()
  }

  return `${words[0][0]}${words[1][0]}`
    .toUpperCase()
}