import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  Users,
  Dumbbell,
  ClipboardList,
  Wallet,
  CreditCard,
  CalendarDays,
  ArrowRight,
  Activity,
  ShieldCheck,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Building2,
} from "lucide-react"

import PageHeader from "../../components/PageHeader"
import StatCard from "../../components/StatCard"
import api, { subscriptions } from "../../api/api"
import { money, date } from "../../utils/helpers"

export default function AdminDashboard() {
  const navigate = useNavigate()

  const [stats, setStats] = useState({})
  const [subscription, setSubscription] = useState(null)
  const [subscriptionLoading, setSubscriptionLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const loadDashboard = async () => {
    try {
      setRefreshing(true)

      const [dashboardResponse, subscriptionData] =
        await Promise.all([
          api.get("/dashboard"),
          subscriptions.current(),
        ])

      setStats(dashboardResponse.data?.stats || {})
      setSubscription(subscriptionData?.subscription || null)
    } catch (error) {
      console.error("Admin dashboard load error:", error)

      try {
        const dashboardResponse = await api.get("/dashboard")
        setStats(dashboardResponse.data?.stats || {})
      } catch {
        setStats({})
      }

      try {
        const subscriptionData = await subscriptions.current()
        setSubscription(subscriptionData?.subscription || null)
      } catch {
        setSubscription(null)
      }
    } finally {
      setRefreshing(false)
      setSubscriptionLoading(false)
    }
  }

  useEffect(() => {
    loadDashboard()
  }, [])

  const endDate =
    subscription?.currentPeriodEnd ||
    subscription?.trialEndsAt ||
    subscription?.nextBillingDate

  const daysRemaining = getDaysRemaining(endDate)

  const effectiveStatus = getEffectiveStatus(
    subscription,
    daysRemaining,
  )

  const totalMembers = stats.totalMembers || 0
  const activeMembers = stats.activeMembers || 0

  const activeRate =
    totalMembers > 0
      ? Math.round((activeMembers / totalMembers) * 100)
      : 0

  return (
    <div
      style={{
        minHeight: "100%",
        background: "#05070a",
        color: "#fff",
        paddingBottom: 40,
      }}
    >
      <PageHeader
        title="Gym Dashboard"
        description="Operational overview for your gym."
      />

      {/* Dashboard intro */}
      <section
        style={{
          marginBottom: 24,
          padding: "22px 24px",
          borderRadius: 20,
          border: "1px solid rgba(255,255,255,.075)",
          background: "#0e131a",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 20,
            flexWrap: "wrap",
          }}
        >
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 8,
              }}
            >
              <Activity
                size={16}
                style={{ color: "var(--gb-lime)" }}
              />

              <span
                style={{
                  color: "var(--gb-lime)",
                  fontSize: 11,
                  fontWeight: 900,
                  letterSpacing: ".14em",
                  textTransform: "uppercase",
                }}
              >
                Control Center
              </span>
            </div>

            <h2
              style={{
                margin: 0,
                fontSize: "clamp(20px, 3vw, 28px)",
                fontWeight: 900,
                letterSpacing: "-.03em",
              }}
            >
              Welcome to your gym workspace
            </h2>

            <p
              className="muted"
              style={{
                margin: "7px 0 0",
                fontSize: 13,
                lineHeight: 1.6,
                maxWidth: 650,
              }}
            >
              Monitor your members, training operations,
              programs and GB platform subscription from one
              central dashboard.
            </p>
          </div>

          <button
            type="button"
            onClick={loadDashboard}
            disabled={refreshing}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              minHeight: 42,
              padding: "0 15px",
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,.10)",
              background: "#11171f",
              color: "#d8dde5",
              fontSize: 12,
              fontWeight: 900,
              cursor: refreshing ? "not-allowed" : "pointer",
              opacity: refreshing ? 0.6 : 1,
              transition: "background .2s ease, opacity .2s ease",
            }}
          >
            <RefreshCw
              size={15}
              style={{
                animation: refreshing
                  ? "spin 1s linear infinite"
                  : "none",
              }}
            />

            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </section>

      {/* KPI statistics */}
      <section
        className="stats-grid"
        style={{
          marginBottom: 24,
        }}
      >
        <DashboardStat
          icon={Users}
          label="Total Members"
          value={totalMembers}
          detail={`${activeMembers} active members`}
          accent="lime"
        />

        <DashboardStat
          icon={Dumbbell}
          label="Exercises"
          value={stats.totalExercises || 0}
          detail="Available in exercise library"
          accent="yellow"
        />

        <DashboardStat
          icon={ClipboardList}
          label="Workout Programs"
          value={stats.totalPrograms || 0}
          detail="Programs available to your gym"
          accent="white"
        />

        <DashboardStat
          icon={Wallet}
          label="Active Assignments"
          value={stats.activeAssignments || 0}
          detail="Current member assignments"
          accent="lime"
        />
      </section>

      {/* Membership health */}
      <section
        style={{
          display: "grid",
          gridTemplateColumns:
            "minmax(0, 1.45fr) minmax(280px, .55fr)",
          gap: 18,
          marginBottom: 18,
        }}
      >
        {/* Member overview */}
        <div className="dashboard-panel">
          <PanelHeader
            icon={Users}
            eyebrow="Membership"
            title="Member Overview"
            description="A quick look at your gym's current membership activity."
            action={
              <button
                type="button"
                onClick={() => navigate("/admin/members")}
                className="dashboard-link"
              >
                View members
                <ArrowRight size={14} />
              </button>
            }
          />

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit,minmax(170px,1fr))",
              gap: 12,
              marginTop: 20,
            }}
          >
            <MiniMetric
              label="Total members"
              value={totalMembers}
              icon={Users}
            />

            <MiniMetric
              label="Active members"
              value={activeMembers}
              icon={CheckCircle2}
              accent="lime"
            />

            <MiniMetric
              label="Active rate"
              value={`${activeRate}%`}
              icon={Activity}
              accent="yellow"
            />
          </div>

          <div style={{ marginTop: 20 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 10,
                marginBottom: 8,
              }}
            >
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  color: "#89919d",
                }}
              >
                Member activity
              </span>

              <span
                style={{
                  fontSize: 12,
                  fontWeight: 900,
                  color: "var(--gb-lime)",
                }}
              >
                {activeRate}%
              </span>
            </div>

            <div
              style={{
                height: 8,
                borderRadius: 999,
                background: "#202833",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${activeRate}%`,
                  height: "100%",
                  borderRadius: 999,
                  background: "var(--gb-lime)",
                  transition: "width .4s ease",
                }}
              />
            </div>
          </div>
        </div>

        {/* Operations */}
        <div className="dashboard-panel">
          <PanelHeader
            icon={ShieldCheck}
            eyebrow="Operations"
            title="Gym Operations"
            description="Manage the most important areas of your workspace."
          />

          <div
            style={{
              display: "grid",
              gap: 9,
              marginTop: 18,
            }}
          >
            <QuickAction
              icon={CalendarDays}
              title="Weekly Schedule"
              onClick={() => navigate("/admin/schedule")}
            />

            <QuickAction
              icon={Dumbbell}
              title="Workout Programs"
              onClick={() => navigate("/admin/programs")}
            />

            <QuickAction
              icon={Wallet}
              title="Gym Revenue"
              onClick={() => navigate("/admin/revenue")}
            />

            <QuickAction
              icon={Users}
              title="Members"
              onClick={() => navigate("/admin/members")}
            />
          </div>
        </div>
      </section>

      {/* SaaS subscription */}
      <section
        className="dashboard-panel"
        style={{
          marginBottom: 18,
        }}
      >
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: 18,
              flexWrap: "wrap",
            }}
          >
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 9,
                  marginBottom: 7,
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 11,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "#192217",
                    border:
                      "1px solid rgba(215,255,53,.16)",
                  }}
                >
                  <CreditCard
                    size={18}
                    style={{ color: "var(--gb-lime)" }}
                  />
                </div>

                <div>
                  <div
                    style={{
                      color: "#8d96a3",
                      fontSize: 10,
                      fontWeight: 900,
                      letterSpacing: ".12em",
                      textTransform: "uppercase",
                    }}
                  >
                    GB Platform
                  </div>

                  <h2
                    style={{
                      margin: 0,
                      fontSize: 19,
                      fontWeight: 900,
                    }}
                  >
                    SaaS Subscription
                  </h2>
                </div>
              </div>

              <p
                className="muted"
                style={{
                  margin: 0,
                  maxWidth: 720,
                  fontSize: 12,
                  lineHeight: 1.6,
                }}
              >
                Your gym's subscription to the GB platform.
                This is separate from gym member payments and
                your gym's own revenue.
              </p>
            </div>

            {!subscriptionLoading && (
              <StatusBadge status={effectiveStatus} />
            )}
          </div>

          {subscriptionLoading ? (
            <div
              style={{
                marginTop: 22,
                padding: 22,
                borderRadius: 14,
                background: "#0a0e13",
                border: "1px solid var(--gb-border)",
                color: "#78818e",
                fontSize: 12,
              }}
            >
              Loading subscription details...
            </div>
          ) : subscription ? (
            <>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(auto-fit,minmax(180px,1fr))",
                  gap: 10,
                  marginTop: 22,
                }}
              >
                <InfoItem
                  label="Current plan"
                  value={
                    subscription.planName ||
                    subscription.plan?.name ||
                    "—"
                  }
                  accent
                />

                <InfoItem
                  label="Subscription amount"
                  value={`${money(
                    subscription.amount,
                    subscription.currency,
                  )} / ${
                    subscription.billingCycle || "monthly"
                  }`}
                />

                <InfoItem
                  label="Started"
                  value={date(subscription.startDate)}
                />

                <InfoItem
                  label={
                    subscription.status === "trial"
                      ? "Trial ends"
                      : "Current period ends"
                  }
                  value={date(endDate)}
                />

                <InfoItem
                  label="Next billing"
                  value={date(subscription.nextBillingDate)}
                />

                <InfoItem
                  label="Payment status"
                  value={formatPaymentStatus(
                    subscription.paymentStatus,
                  )}
                />
              </div>

              <div
                style={{
                  marginTop: 16,
                  padding: "15px 16px",
                  borderRadius: 14,
                  background: "#0a0e13",
                  border:
                    "1px solid rgba(255,255,255,.07)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 14,
                  flexWrap: "wrap",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 11,
                  }}
                >
                  <div
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 11,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: "#192217",
                    }}
                  >
                    <CalendarDays
                      size={18}
                      style={{
                        color: "var(--gb-lime)",
                      }}
                    />
                  </div>

                  <div>
                    <div
                      style={{
                        fontWeight: 900,
                        fontSize: 13,
                      }}
                    >
                      {daysRemaining > 0
                        ? `${daysRemaining} day${
                            daysRemaining === 1 ? "" : "s"
                          } remaining`
                        : "Subscription period has ended"}
                    </div>

                    <div
                      className="muted"
                      style={{
                        marginTop: 3,
                        fontSize: 11,
                      }}
                    >
                      {endDate
                        ? `End date: ${date(endDate)}`
                        : "No subscription end date available"}
                    </div>
                  </div>
                </div>

                <button
                  className="btn primary"
                  type="button"
                  onClick={() =>
                    navigate("/admin/subscription")
                  }
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 7,
                    whiteSpace: "nowrap",
                  }}
                >
                  Manage Subscription
                  <ArrowRight size={15} />
                </button>
              </div>
            </>
          ) : (
            <div
              style={{
                marginTop: 20,
                padding: 20,
                borderRadius: 14,
                background: "#090d12",
                border:
                  "1px dashed rgba(255,255,255,.12)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 12,
                }}
              >
                <AlertCircle
                  size={20}
                  style={{
                    color: "var(--gb-yellow)",
                    flexShrink: 0,
                  }}
                />

                <div>
                  <div
                    style={{
                      fontWeight: 900,
                      marginBottom: 5,
                    }}
                  >
                    No active GB subscription
                  </div>

                  <p
                    className="muted"
                    style={{
                      margin: "0 0 14px",
                      fontSize: 12,
                      lineHeight: 1.6,
                    }}
                  >
                    Choose a GB SaaS plan to activate or renew
                    your gym platform access.
                  </p>

                  <button
                    className="btn primary"
                    type="button"
                    onClick={() =>
                      navigate("/admin/subscription")
                    }
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 7,
                    }}
                  >
                    View SaaS Plans
                    <ArrowRight size={15} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Tenant workspace */}
      <section
        className="dashboard-panel"
        style={{
          background: "#0e131a",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 13,
          }}
        >
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 12,
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "#242116",
              border:
                "1px solid rgba(255,225,59,.16)",
            }}
          >
            <Building2
              size={19}
              style={{ color: "var(--gb-yellow)" }}
            />
          </div>

          <div>
            <div
              style={{
                color: "var(--gb-yellow)",
                fontSize: 10,
                fontWeight: 900,
                letterSpacing: ".13em",
                textTransform: "uppercase",
                marginBottom: 5,
              }}
            >
              Tenant Workspace
            </div>

            <h2
              style={{
                margin: 0,
                fontSize: 18,
                fontWeight: 900,
              }}
            >
              Your gym data stays within your workspace
            </h2>

            <p
              className="muted"
              style={{
                margin: "7px 0 0",
                fontSize: 12,
                lineHeight: 1.65,
                maxWidth: 850,
              }}
            >
              Members, trainers, programs, exercises,
              schedules and gym revenue are scoped to this
              gym. Your administration area is isolated from
              other gyms using the GB platform.
            </p>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit,minmax(150px,1fr))",
            gap: 9,
            marginTop: 18,
          }}
        >
          <WorkspaceItem label="Members" />
          <WorkspaceItem label="Trainers" />
          <WorkspaceItem label="Programs" />
          <WorkspaceItem label="Exercises" />
          <WorkspaceItem label="Schedules" />
          <WorkspaceItem label="Revenue" />
        </div>
      </section>

      <style>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }

          to {
            transform: rotate(360deg);
          }
        }

        .dashboard-panel {
          border: 1px solid rgba(255,255,255,.075);
          background: #0e131a;
          border-radius: 20px;
          padding: 20px;
          box-shadow: none;
        }

        .dashboard-link {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          border: 0;
          background: transparent;
          color: var(--gb-lime);
          font-size: 11px;
          font-weight: 900;
          cursor: pointer;
          padding: 5px 0;
        }

        .dashboard-link:hover {
          opacity: .8;
        }

        @media (max-width: 900px) {
          .dashboard-panel {
            padding: 17px;
          }
        }

        @media (max-width: 760px) {
          .dashboard-panel {
            border-radius: 17px;
          }
        }
      `}</style>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Dashboard Stat                                                             */
/* -------------------------------------------------------------------------- */

function DashboardStat({
  icon: Icon,
  label,
  value,
  detail,
  accent = "lime",
}) {
  const accents = {
    lime: {
      color: "var(--gb-lime)",
      background: "rgba(215,255,53,.10)",
      border: "rgba(215,255,53,.16)",
    },

    yellow: {
      color: "var(--gb-yellow)",
      background: "rgba(255,225,59,.09)",
      border: "rgba(255,225,59,.15)",
    },

    white: {
      color: "#fff",
      background: "rgba(255,255,255,.07)",
      border: "rgba(255,255,255,.11)",
    },
  }

  const theme =
    accents[accent] ||
    accents.lime

  return (
    <div
      style={{
        overflow: "hidden",
        padding: 18,
        borderRadius: 18,
        border: "1px solid rgba(255,255,255,.075)",
        background: "#0e131a",
        minHeight: 142,
        boxShadow: "none",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "flex-start",
          gap: 10,
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: theme.background,
            border: `1px solid ${theme.border}`,
            color: theme.color,
          }}
        >
          <Icon size={19} />
        </div>
      </div>

      <div
        style={{
          marginTop: 16,
        }}
      >
        <div
          style={{
            color: "#737d89",
            fontSize: 10,
            fontWeight: 900,
            letterSpacing: ".11em",
            textTransform: "uppercase",
          }}
        >
          {label}
        </div>

        <div
          style={{
            marginTop: 3,
            fontSize: 28,
            lineHeight: 1,
            fontWeight: 950,
            letterSpacing: "-.04em",
          }}
        >
          {value}
        </div>

        <div
          style={{
            marginTop: 7,
            color: "#68717d",
            fontSize: 10,
          }}
        >
          {detail}
        </div>
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Panel Header                                                               */
/* -------------------------------------------------------------------------- */

function PanelHeader({
  icon: Icon,
  eyebrow,
  title,
  description,
  action,
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: 15,
      }}
    >
      <div
        style={{
          display: "flex",
          gap: 11,
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 11,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(255,255,255,.045)",
            border: "1px solid rgba(255,255,255,.08)",
            color: "var(--gb-lime)",
            flexShrink: 0,
          }}
        >
          <Icon size={17} />
        </div>

        <div>
          <div
            style={{
              color: "#6f7884",
              fontSize: 9,
              fontWeight: 900,
              letterSpacing: ".14em",
              textTransform: "uppercase",
            }}
          >
            {eyebrow}
          </div>

          <h2
            style={{
              margin: "3px 0 0",
              fontSize: 17,
              fontWeight: 900,
            }}
          >
            {title}
          </h2>

          {description && (
            <p
              className="muted"
              style={{
                margin: "4px 0 0",
                fontSize: 11,
                lineHeight: 1.5,
              }}
            >
              {description}
            </p>
          )}
        </div>
      </div>

      {action}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Mini Metric                                                                */
/* -------------------------------------------------------------------------- */

function MiniMetric({
  label,
  value,
  icon: Icon,
  accent = "white",
}) {
  const color =
    accent === "lime"
      ? "var(--gb-lime)"
      : accent === "yellow"
        ? "var(--gb-yellow)"
        : "#c8ced6"

  return (
    <div
      style={{
        padding: 14,
        borderRadius: 14,
        background: "#090d12",
        border: "1px solid rgba(255,255,255,.055)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
        }}
      >
        <span
          style={{
            color: "#737c88",
            fontSize: 10,
            fontWeight: 800,
          }}
        >
          {label}
        </span>

        <Icon
          size={14}
          style={{ color }}
        />
      </div>

      <div
        style={{
          marginTop: 9,
          fontSize: 23,
          fontWeight: 950,
          color,
        }}
      >
        {value}
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Quick Action                                                               */
/* -------------------------------------------------------------------------- */

function QuickAction({
  icon: Icon,
  title,
  onClick,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: "100%",
        minHeight: 45,
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "0 12px",
        borderRadius: 12,
        border: "1px solid rgba(255,255,255,.055)",
        background: "#090d12",
        color: "#dce1e7",
        textAlign: "left",
        cursor: "pointer",
        transition: "background .2s ease",
      }}
    >
      <span
        style={{
          width: 30,
          height: 30,
          borderRadius: 9,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "rgba(215,255,53,.075)",
          color: "var(--gb-lime)",
          flexShrink: 0,
        }}
      >
        <Icon size={15} />
      </span>

      <span
        style={{
          flex: 1,
          fontSize: 11,
          fontWeight: 850,
        }}
      >
        {title}
      </span>

      <ArrowRight
        size={14}
        style={{ color: "#59616c" }}
      />
    </button>
  )
}

/* -------------------------------------------------------------------------- */
/* Subscription Info                                                          */
/* -------------------------------------------------------------------------- */

function InfoItem({
  label,
  value,
  accent = false,
}) {
  return (
    <div
      style={{
        padding: 13,
        borderRadius: 13,
        background: "#0a0e13",
        border: "1px solid rgba(255,255,255,.06)",
      }}
    >
      <div
        style={{
          color: "#68717c",
          fontSize: 9,
          fontWeight: 800,
          marginBottom: 5,
          textTransform: "uppercase",
          letterSpacing: ".06em",
        }}
      >
        {label}
      </div>

      <div
        style={{
          color: accent
            ? "var(--gb-lime)"
            : "#e8ebef",
          fontSize: 12,
          fontWeight: 900,
        }}
      >
        {value}
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Status Badge                                                               */
/* -------------------------------------------------------------------------- */

function StatusBadge({
  status,
}) {
  const labels = {
    active: "ACTIVE",
    trial: "TRIAL",
    expired: "EXPIRED",
    pending: "PENDING",
    past_due: "PAST DUE",
    cancelled: "CANCELLED",
    suspended: "SUSPENDED",
  }

  const isGood =
    status === "active" ||
    status === "trial"

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 7,
        borderRadius: 999,
        padding: "7px 11px",
        fontSize: 9,
        fontWeight: 950,
        letterSpacing: ".08em",
        background: isGood
          ? "#192217"
          : "#242116",
        color: isGood
          ? "var(--gb-lime)"
          : "var(--gb-yellow)",
        border: `1px solid ${
          isGood
            ? "rgba(215,255,53,.22)"
            : "rgba(255,225,59,.20)"
        }`,
      }}
    >
      {labels[status] ||
        String(
          status || "UNKNOWN",
        ).toUpperCase()}
    </span>
  )
}

/* -------------------------------------------------------------------------- */
/* Workspace Item                                                             */
/* -------------------------------------------------------------------------- */

function WorkspaceItem({
  label,
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "10px 11px",
        borderRadius: 11,
        background: "#090d12",
        border: "1px solid rgba(255,255,255,.045)",
        color: "#8a939f",
        fontSize: 10,
        fontWeight: 800,
      }}
    >
      <CheckCircle2
        size={13}
        style={{
          color: "var(--gb-lime)",
        }}
      />

      {label}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function getDaysRemaining(
  value,
) {
  if (!value) return 0

  return Math.max(
    0,
    Math.ceil(
      (new Date(
        value,
      ).getTime() -
        Date.now()) /
        86400000,
    ),
  )
}

function getEffectiveStatus(
  subscription,
  daysRemaining,
) {
  if (!subscription) {
    return "expired"
  }

  if (daysRemaining <= 0) {
    return "expired"
  }

  return (
    subscription.status ||
    "active"
  )
}

function formatPaymentStatus(
  value,
) {
  if (!value) return "—"

  return String(value)
    .replace(
      /_/g,
      " ",
    )
    .replace(
      /\b\w/g,
      (c) =>
        c.toUpperCase(),
    )
}