import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
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

const pageVariants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.45,
      staggerChildren: 0.08,
    },
  },
}

const itemVariants = {
  hidden: {
    opacity: 0,
    y: 18,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.45,
      ease: "easeOut",
    },
  },
}

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
    <motion.div
      variants={pageVariants}
      initial="hidden"
      animate="visible"
      style={{
        minHeight: "100%",
        background: "#05070a",
        color: "#fff",
        paddingBottom: 40,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Ambient background */}
      <div
        className="dashboard-glow dashboard-glow-one"
        aria-hidden="true"
      />

      <div
        className="dashboard-glow dashboard-glow-two"
        aria-hidden="true"
      />

      <motion.div variants={itemVariants}>
        <PageHeader
          title="Gym Dashboard"
          description="Operational overview for your gym."
        />
      </motion.div>

      {/* Dashboard intro */}
      <motion.section
        variants={itemVariants}
        className="dashboard-hero"
        style={{
          marginBottom: 24,
          padding: "22px 24px",
          borderRadius: 20,
          border: "1px solid rgba(255,255,255,.075)",
          background:
            "linear-gradient(135deg, rgba(14,19,26,.98), rgba(9,13,18,.94))",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div className="hero-orb hero-orb-one" />
        <div className="hero-orb hero-orb-two" />

        <div
          style={{
            position: "relative",
            zIndex: 2,
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
              <motion.div
                animate={{
                  scale: [1, 1.12, 1],
                  opacity: [0.8, 1, 0.8],
                }}
                transition={{
                  duration: 2.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <Activity
                  size={16}
                  style={{ color: "var(--gb-lime)" }}
                />
              </motion.div>

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

          <motion.button
            type="button"
            onClick={loadDashboard}
            disabled={refreshing}
            whileHover={{
              scale: refreshing ? 1 : 1.03,
              y: refreshing ? 0 : -2,
            }}
            whileTap={{
              scale: refreshing ? 1 : 0.97,
            }}
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
          </motion.button>
        </div>
      </motion.section>

      {/* KPI statistics */}
      <motion.section
        variants={itemVariants}
        className="stats-grid dashboard-stats"
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
          delay={0}
        />

        <DashboardStat
          icon={Dumbbell}
          label="Exercises"
          value={stats.totalExercises || 0}
          detail="Available in exercise library"
          accent="yellow"
          delay={0.08}
        />

        <DashboardStat
          icon={ClipboardList}
          label="Workout Programs"
          value={stats.totalPrograms || 0}
          detail="Programs available to your gym"
          accent="white"
          delay={0.16}
        />

        <DashboardStat
          icon={Wallet}
          label="Active Assignments"
          value={stats.activeAssignments || 0}
          detail="Current member assignments"
          accent="lime"
          delay={0.24}
        />
      </motion.section>

      {/* Membership health */}
      <motion.section
        variants={itemVariants}
        className="dashboard-two-column"
        style={{
          display: "grid",
          gridTemplateColumns:
            "minmax(0, 1.45fr) minmax(280px, .55fr)",
          gap: 18,
          marginBottom: 18,
        }}
      >
        {/* Member overview */}
        <motion.div
          className="dashboard-panel"
          whileHover={{
            y: -3,
            borderColor: "rgba(215,255,53,.14)",
          }}
          transition={{
            duration: 0.2,
          }}
        >
          <PanelHeader
            icon={Users}
            eyebrow="Membership"
            title="Member Overview"
            description="A quick look at your gym's current membership activity."
            action={
              <motion.button
                type="button"
                onClick={() => navigate("/admin/members")}
                className="dashboard-link"
                whileHover={{ x: 3 }}
                whileTap={{ scale: 0.97 }}
              >
                View members
                <ArrowRight size={14} />
              </motion.button>
            }
          />

          <div
            className="mini-metrics-grid"
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
              delay={0}
            />

            <MiniMetric
              label="Active members"
              value={activeMembers}
              icon={CheckCircle2}
              accent="lime"
              delay={0.08}
            />

            <MiniMetric
              label="Active rate"
              value={`${activeRate}%`}
              icon={Activity}
              accent="yellow"
              delay={0.16}
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

              <motion.span
                key={activeRate}
                initial={{
                  opacity: 0,
                  scale: 0.8,
                }}
                animate={{
                  opacity: 1,
                  scale: 1,
                }}
                style={{
                  fontSize: 12,
                  fontWeight: 900,
                  color: "var(--gb-lime)",
                }}
              >
                {activeRate}%
              </motion.span>
            </div>

            <div
              style={{
                height: 8,
                borderRadius: 999,
                background: "#202833",
                overflow: "hidden",
              }}
            >
              <motion.div
                initial={{
                  width: 0,
                }}
                animate={{
                  width: `${activeRate}%`,
                }}
                transition={{
                  duration: 1,
                  delay: 0.2,
                  ease: "easeOut",
                }}
                style={{
                  height: "100%",
                  borderRadius: 999,
                  background:
                    "linear-gradient(90deg, var(--gb-lime), #efff85)",
                  boxShadow:
                    "0 0 14px rgba(215,255,53,.28)",
                }}
              />
            </div>
          </div>
        </motion.div>

        {/* Operations */}
        <motion.div
          className="dashboard-panel"
          whileHover={{
            y: -3,
            borderColor: "rgba(255,225,59,.13)",
          }}
          transition={{
            duration: 0.2,
          }}
        >
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
        </motion.div>
      </motion.section>

      {/* SaaS subscription */}
      <motion.section
        variants={itemVariants}
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
                <motion.div
                  animate={{
                    y: [0, -3, 0],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
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
                </motion.div>

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
              <motion.div
                initial={{
                  opacity: 0,
                  scale: 0.85,
                }}
                animate={{
                  opacity: 1,
                  scale: 1,
                }}
              >
                <StatusBadge status={effectiveStatus} />
              </motion.div>
            )}
          </div>

          {subscriptionLoading ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
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
            </motion.div>
          ) : subscription ? (
            <>
              <div
                className="subscription-grid"
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
                  delay={0}
                />

                <InfoItem
                  label="Subscription amount"
                  value={`${money(
                    subscription.amount,
                    subscription.currency,
                  )} / ${
                    subscription.billingCycle || "monthly"
                  }`}
                  delay={0.05}
                />

                <InfoItem
                  label="Started"
                  value={date(subscription.startDate)}
                  delay={0.1}
                />

                <InfoItem
                  label={
                    subscription.status === "trial"
                      ? "Trial ends"
                      : "Current period ends"
                  }
                  value={date(endDate)}
                  delay={0.15}
                />

                <InfoItem
                  label="Next billing"
                  value={date(subscription.nextBillingDate)}
                  delay={0.2}
                />

                <InfoItem
                  label="Payment status"
                  value={formatPaymentStatus(
                    subscription.paymentStatus,
                  )}
                  delay={0.25}
                />
              </div>

              <motion.div
                initial={{
                  opacity: 0,
                  y: 10,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                transition={{
                  duration: 0.4,
                  delay: 0.25,
                }}
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

                <motion.button
                  className="btn primary"
                  type="button"
                  onClick={() =>
                    navigate("/admin/subscription")
                  }
                  whileHover={{
                    scale: 1.03,
                    x: 2,
                  }}
                  whileTap={{
                    scale: 0.97,
                  }}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 7,
                    whiteSpace: "nowrap",
                  }}
                >
                  Manage Subscription
                  <ArrowRight size={15} />
                </motion.button>
              </motion.div>
            </>
          ) : (
            <motion.div
              initial={{
                opacity: 0,
                y: 10,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
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

                  <motion.button
                    className="btn primary"
                    type="button"
                    onClick={() =>
                      navigate("/admin/subscription")
                    }
                    whileHover={{
                      scale: 1.03,
                    }}
                    whileTap={{
                      scale: 0.97,
                    }}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 7,
                    }}
                  >
                    View SaaS Plans
                    <ArrowRight size={15} />
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </motion.section>

      {/* Tenant workspace */}
      <motion.section
        variants={itemVariants}
        className="dashboard-panel"
        style={{
          background:
            "linear-gradient(135deg, #0e131a, #0a0e13)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 13,
          }}
        >
          <motion.div
            animate={{
              y: [0, -4, 0],
            }}
            transition={{
              duration: 3.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
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
          </motion.div>

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
          className="workspace-grid"
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
      </motion.section>

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
          box-shadow: 0 12px 35px rgba(0,0,0,.12);
          position: relative;
          z-index: 2;
          transition:
            border-color .25s ease,
            box-shadow .25s ease;
        }

        .dashboard-panel:hover {
          box-shadow: 0 18px 45px rgba(0,0,0,.18);
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

        .dashboard-glow {
          position: absolute;
          pointer-events: none;
          border-radius: 999px;
          filter: blur(70px);
          opacity: .11;
          z-index: 0;
        }

        .dashboard-glow-one {
          width: 240px;
          height: 240px;
          background: var(--gb-lime);
          top: 70px;
          right: -90px;
        }

        .dashboard-glow-two {
          width: 180px;
          height: 180px;
          background: var(--gb-yellow);
          top: 620px;
          left: -90px;
          opacity: .07;
        }

        .hero-orb {
          position: absolute;
          border-radius: 999px;
          pointer-events: none;
          filter: blur(2px);
        }

        .hero-orb-one {
          width: 180px;
          height: 180px;
          right: -75px;
          top: -105px;
          background: rgba(215,255,53,.07);
          animation: floatOrb 6s ease-in-out infinite;
        }

        .hero-orb-two {
          width: 120px;
          height: 120px;
          left: 42%;
          bottom: -95px;
          background: rgba(255,225,59,.045);
          animation: floatOrbReverse 7s ease-in-out infinite;
        }

        .dashboard-stats {
          position: relative;
          z-index: 2;
        }

        @keyframes floatOrb {
          0%,
          100% {
            transform: translate3d(0,0,0);
          }

          50% {
            transform: translate3d(-12px,12px,0);
          }
        }

        @keyframes floatOrbReverse {
          0%,
          100% {
            transform: translate3d(0,0,0);
          }

          50% {
            transform: translate3d(10px,-10px,0);
          }
        }

        @media (max-width: 900px) {
          .dashboard-panel {
            padding: 17px;
          }

          .dashboard-two-column {
            grid-template-columns: 1fr !important;
          }
        }

        @media (max-width: 760px) {
          .dashboard-panel {
            border-radius: 17px;
          }

          .dashboard-hero {
            padding: 18px !important;
            border-radius: 17px !important;
          }

          .dashboard-hero button {
            width: 100%;
          }

          .mini-metrics-grid {
            grid-template-columns: 1fr !important;
          }

          .subscription-grid {
            grid-template-columns: 1fr !important;
          }

          .workspace-grid {
            grid-template-columns: repeat(2, minmax(0,1fr)) !important;
          }
        }

        @media (max-width: 480px) {
          .workspace-grid {
            grid-template-columns: 1fr !important;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .hero-orb-one,
          .hero-orb-two {
            animation: none;
          }
        }
      `}</style>
    </motion.div>
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
  delay = 0,
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

  const theme = accents[accent] || accents.lime

  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 22,
        scale: 0.97,
      }}
      animate={{
        opacity: 1,
        y: 0,
        scale: 1,
      }}
      transition={{
        duration: 0.45,
        delay,
        ease: "easeOut",
      }}
      whileHover={{
        y: -5,
        scale: 1.012,
      }}
      whileTap={{
        scale: 0.99,
      }}
      style={{
        overflow: "hidden",
        padding: 18,
        borderRadius: 18,
        border: "1px solid rgba(255,255,255,.075)",
        background:
          "linear-gradient(145deg, #0e131a, #0a0e13)",
        minHeight: 142,
        boxShadow:
          "0 10px 28px rgba(0,0,0,.12)",
        position: "relative",
      }}
    >
      <div
        style={{
          position: "absolute",
          width: 110,
          height: 110,
          right: -45,
          top: -50,
          borderRadius: "50%",
          background: theme.background,
          filter: "blur(3px)",
          opacity: 0.6,
        }}
      />

      <div
        style={{
          position: "relative",
          zIndex: 2,
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "flex-start",
          gap: 10,
        }}
      >
        <motion.div
          whileHover={{
            rotate: 5,
            scale: 1.08,
          }}
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
        </motion.div>
      </div>

      <div
        style={{
          position: "relative",
          zIndex: 2,
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

        <motion.div
          key={String(value)}
          initial={{
            opacity: 0,
            y: 8,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: 0.35,
          }}
          style={{
            marginTop: 3,
            fontSize: 28,
            lineHeight: 1,
            fontWeight: 950,
            letterSpacing: "-.04em",
          }}
        >
          {value}
        </motion.div>

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
    </motion.div>
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
        <motion.div
          whileHover={{
            scale: 1.08,
            rotate: 3,
          }}
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
        </motion.div>

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
  delay = 0,
}) {
  const color =
    accent === "lime"
      ? "var(--gb-lime)"
      : accent === "yellow"
        ? "var(--gb-yellow)"
        : "#c8ced6"

  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 12,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      transition={{
        duration: 0.35,
        delay,
      }}
      whileHover={{
        y: -3,
      }}
      style={{
        padding: 14,
        borderRadius: 14,
        background: "#090d12",
        border: "1px solid rgba(255,255,255,.055)",
        transition: "border-color .2s ease",
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

      <motion.div
        key={String(value)}
        initial={{
          opacity: 0,
          scale: 0.8,
        }}
        animate={{
          opacity: 1,
          scale: 1,
        }}
        transition={{
          duration: 0.35,
        }}
        style={{
          marginTop: 9,
          fontSize: 23,
          fontWeight: 950,
          color,
        }}
      >
        {value}
      </motion.div>
    </motion.div>
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
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{
        x: 4,
        scale: 1.01,
      }}
      whileTap={{
        scale: 0.98,
      }}
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
      }}
    >
      <motion.span
        whileHover={{
          scale: 1.08,
          rotate: 3,
        }}
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
      </motion.span>

      <span
        style={{
          flex: 1,
          fontSize: 11,
          fontWeight: 850,
        }}
      >
        {title}
      </span>

      <motion.span
        whileHover={{
          x: 3,
        }}
        style={{
          display: "flex",
        }}
      >
        <ArrowRight
          size={14}
          style={{ color: "#59616c" }}
        />
      </motion.span>
    </motion.button>
  )
}

/* -------------------------------------------------------------------------- */
/* Subscription Info                                                          */
/* -------------------------------------------------------------------------- */

function InfoItem({
  label,
  value,
  accent = false,
  delay = 0,
}) {
  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 10,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      transition={{
        duration: 0.35,
        delay,
      }}
      whileHover={{
        y: -2,
      }}
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
    </motion.div>
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
    <motion.span
      animate={
        isGood
          ? {
              boxShadow: [
                "0 0 0 rgba(215,255,53,0)",
                "0 0 16px rgba(215,255,53,.10)",
                "0 0 0 rgba(215,255,53,0)",
              ],
            }
          : undefined
      }
      transition={{
        duration: 2.8,
        repeat: Infinity,
        ease: "easeInOut",
      }}
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
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: isGood
            ? "var(--gb-lime)"
            : "var(--gb-yellow)",
          boxShadow: isGood
            ? "0 0 8px rgba(215,255,53,.5)"
            : "0 0 8px rgba(255,225,59,.35)",
        }}
      />

      {labels[status] ||
        String(
          status || "UNKNOWN",
        ).toUpperCase()}
    </motion.span>
  )
}

/* -------------------------------------------------------------------------- */
/* Workspace Item                                                             */
/* -------------------------------------------------------------------------- */

function WorkspaceItem({
  label,
}) {
  return (
    <motion.div
      whileHover={{
        y: -3,
        scale: 1.015,
      }}
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
    </motion.div>
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