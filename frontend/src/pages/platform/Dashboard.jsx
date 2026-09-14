import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  CircleDollarSign,
  Package,
  ShieldCheck,
  TrendingUp,
  Activity,
  Sparkles,
} from "lucide-react"
import { motion, useReducedMotion } from "framer-motion"

import { platform } from "../../api/api"
import { money } from "../../utils/helpers"
import "../../styles/platform.css"


const actions = [
  [
    "/platform/gyms",
    Building2,
    "Manage gyms",
    "Tenants, owners & access",
  ],
  [
    "/platform/subscriptions",
    ShieldCheck,
    "Subscriptions",
    "Plans, billing & status",
  ],
  [
    "/platform/revenue",
    CircleDollarSign,
    "Platform revenue",
    "GB SaaS income",
  ],
  [
    "/platform/plans",
    Package,
    "SaaS plans",
    "Pricing & limits",
  ],
]


const pageVariants = {
  hidden: {
    opacity: 0,
  },

  visible: {
    opacity: 1,

    transition: {
      duration: 0.45,
      staggerChildren: 0.07,
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
      duration: 0.4,
      ease: "easeOut",
    },
  },
}


export default function Dashboard() {
  const navigate =
    useNavigate()

  const reduceMotion =
    useReducedMotion()

  const [
    stats,
    setStats,
  ] = useState({})

  const [
    loading,
    setLoading,
  ] = useState(true)

  const [
    error,
    setError,
  ] = useState("")


  useEffect(() => {
    let live = true

    const loadDashboard =
      async () => {
        try {
          setLoading(true)
          setError("")

          const data =
            await platform.dashboard()

          if (live) {
            setStats(
              data?.stats || {},
            )
          }
        } catch (dashboardError) {
          console.error(
            "Unable to load platform dashboard:",
            dashboardError,
          )

          if (live) {
            setError(
              dashboardError?.response?.data
                ?.message ||
                "Unable to load platform statistics.",
            )
          }
        } finally {
          if (live) {
            setLoading(false)
          }
        }
      }

    loadDashboard()

    return () => {
      live = false
    }
  }, [])


  const val = (
    key,
  ) => {
    if (loading) {
      return "—"
    }

    if (
      key ===
      "totalRevenue"
    ) {
      return money(
        stats[key] || 0,
      )
    }

    return stats[key] || 0
  }


  return (
    <motion.div
      variants={
        pageVariants
      }
      initial="hidden"
      animate="visible"
      className="platform-page"
    >
      <div className="platform-wrap">

        {/* Ambient background */}

        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
        >
          <motion.div
            animate={
              reduceMotion
                ? {}
                : {
                    x: [0, 30, 0],
                    y: [0, -20, 0],
                  }
            }
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute -left-24 top-20 h-64 w-64 rounded-full bg-lime-400/5 blur-3xl"
          />

          <motion.div
            animate={
              reduceMotion
                ? {}
                : {
                    x: [0, -25, 0],
                    y: [0, 25, 0],
                  }
            }
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute -right-24 top-1/3 h-72 w-72 rounded-full bg-yellow-400/5 blur-3xl"
          />
        </div>


        {/* Page header */}

        <motion.div
          variants={
            itemVariants
          }
          className="platform-head"
        >
          <div>

            <div className="platform-eyebrow">
              <i />
              GB CONTROL CENTER
            </div>

            <h1>
              Platform Dashboard
            </h1>

            <p>
              One command center for every gym,
              subscription and naira earned by GB.
            </p>

          </div>
        </motion.div>


        {/* Error */}

        {error && (
          <motion.div
            initial={{
              opacity: 0,
              y: -10,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            className="mb-5 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-300"
          >
            {error}
          </motion.div>
        )}


        {/* Hero */}

        <motion.section
          variants={
            itemVariants
          }
          whileHover={
            reduceMotion
              ? {}
              : {
                  y: -2,
                }
          }
          className="platform-hero"
        >
          <div className="platform-hero-content">

            <div className="platform-eyebrow">
              <i />
              PLATFORM OWNER
            </div>

            <h2>
              Run the GB fitness network
              from one place.
            </h2>

            <p>
              Monitor tenant activity, manage
              SaaS access, control pricing and
              keep platform revenue completely
              separate from individual gym revenue.
            </p>


            <div className="platform-hero-actions">

              <motion.button
                className="p-btn primary"
                onClick={() =>
                  navigate(
                    "/platform/gyms",
                  )
                }
                whileHover={
                  reduceMotion
                    ? {}
                    : {
                        x: 3,
                      }
                }
                whileTap={{
                  scale: 0.97,
                }}
              >
                View gyms

                <ArrowRight
                  size={15}
                />
              </motion.button>


              <motion.button
                className="p-btn"
                onClick={() =>
                  navigate(
                    "/platform/revenue",
                  )
                }
                whileHover={
                  reduceMotion
                    ? {}
                    : {
                        x: 3,
                      }
                }
                whileTap={{
                  scale: 0.97,
                }}
              >
                View revenue

                <TrendingUp
                  size={15}
                />
              </motion.button>

            </div>

          </div>
        </motion.section>


        {/* Statistics */}

        <motion.div
          variants={
            itemVariants
          }
          className="platform-stats"
        >

          <Stat
            icon={Building2}
            label="Total gyms"
            value={val("gyms")}
            sub="Registered tenants"
          />

          <Stat
            icon={CheckCircle2}
            label="Active gyms"
            value={val(
              "activeGyms",
            )}
            sub="Currently enabled"
          />

          <Stat
            icon={ShieldCheck}
            label="Active SaaS"
            value={val(
              "activeSubscriptions",
            )}
            sub="Active + trial subscriptions"
          />

          <Stat
            icon={CircleDollarSign}
            label="SaaS revenue"
            value={val(
              "totalRevenue",
            )}
            sub="Verified GB payments"
            yellow
          />

        </motion.div>


        {/* Main grid */}

        <div className="platform-grid">

          {/* Quick management */}

          <motion.section
            variants={
              itemVariants
            }
            className="p-panel"
          >

            <div className="p-panel-head">
              <div>

                <div className="mb-2 flex items-center gap-2">
                  <Sparkles
                    size={14}
                    className="text-lime-400"
                  />

                  <span className="text-[9px] font-black uppercase tracking-[0.15em] text-lime-400">
                    Control Center
                  </span>
                </div>

                <h3 className="p-panel-title">
                  Quick management
                </h3>

                <p className="p-panel-desc">
                  Jump directly into the areas
                  you use most.
                </p>

              </div>
            </div>


            <div className="p-action-grid">

              {actions.map(
                (
                  [
                    to,
                    Icon,
                    title,
                    desc,
                  ],
                  index,
                ) => (
                  <motion.button
                    className="p-action"
                    key={to}
                    onClick={() =>
                      navigate(
                        to,
                      )
                    }
                    initial={
                      reduceMotion
                        ? false
                        : {
                            opacity: 0,
                            x: -10,
                          }
                    }
                    animate={
                      reduceMotion
                        ? {}
                        : {
                            opacity: 1,
                            x: 0,
                          }
                    }
                    transition={{
                      delay:
                        0.15 +
                        index *
                          0.06,
                      duration: 0.3,
                    }}
                    whileHover={
                      reduceMotion
                        ? {}
                        : {
                            x: 4,
                          }
                    }
                    whileTap={{
                      scale: 0.985,
                    }}
                  >

                    <span className="p-action-main">

                      <motion.span
                        className="p-action-icon"
                        whileHover={
                          reduceMotion
                            ? {}
                            : {
                                scale: 1.08,
                                rotate: 3,
                              }
                        }
                      >
                        <Icon
                          size={18}
                        />
                      </motion.span>


                      <span>
                        <b>
                          {title}
                        </b>

                        <span>
                          {desc}
                        </span>
                      </span>

                    </span>


                    <motion.span
                      animate={
                        reduceMotion
                          ? {}
                          : {
                              x: [0, 2, 0],
                            }
                      }
                      transition={{
                        duration: 2.5,
                        repeat:
                          Infinity,
                        ease: "easeInOut",
                        delay:
                          index *
                          0.15,
                      }}
                    >
                      <ArrowRight
                        size={15}
                      />
                    </motion.span>

                  </motion.button>
                ),
              )}

            </div>

          </motion.section>


          {/* Platform health */}

          <motion.section
            variants={
              itemVariants
            }
            className="p-panel"
          >

            <div className="p-panel-head">
              <div>

                <div className="mb-2 flex items-center gap-2">
                  <Activity
                    size={14}
                    className="text-yellow-400"
                  />

                  <span className="text-[9px] font-black uppercase tracking-[0.15em] text-yellow-400">
                    System Status
                  </span>
                </div>

                <h3 className="p-panel-title">
                  Platform health
                </h3>

                <p className="p-panel-desc">
                  High-level operating status.
                </p>

              </div>
            </div>


            <div className="p-health">

              <Health
                label="Tenant isolation"
                status="Protected"
              />

              <Health
                label="SaaS billing"
                status="Paystack"
              />

              <Health
                label="Platform revenue"
                status="GB only"
              />

              <Health
                label="Access control"
                status="Role based"
              />

            </div>

          </motion.section>

        </div>

      </div>
    </motion.div>
  )
}


/*
|--------------------------------------------------------------------------
| Stat Card
|--------------------------------------------------------------------------
*/

function Stat({
  icon: Icon,
  label,
  value,
  sub,
  yellow,
}) {
  const reduceMotion =
    useReducedMotion()

  return (
    <motion.div
      className={`p-stat ${
        yellow
          ? "yellow"
          : ""
      }`}
      whileHover={
        reduceMotion
          ? {}
          : {
              y: -4,
              scale: 1.01,
            }
      }
      whileTap={{
        scale: 0.99,
      }}
    >

      <motion.div
        className="p-stat-icon"
        animate={
          reduceMotion
            ? {}
            : {
                y: [0, -2, 0],
              }
        }
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <Icon
          size={20}
        />
      </motion.div>


      <div className="p-stat-label">
        {label}
      </div>


      <motion.div
        key={String(value)}
        initial={{
          opacity: 0,
          scale: 0.85,
        }}
        animate={{
          opacity: 1,
          scale: 1,
        }}
        transition={{
          duration: 0.35,
        }}
        className="p-stat-value"
      >
        {value}
      </motion.div>


      <div className="p-stat-sub">
        {sub}
      </div>

    </motion.div>
  )
}


/*
|--------------------------------------------------------------------------
| Health Row
|--------------------------------------------------------------------------
*/

function Health({
  label,
  status,
}) {
  const reduceMotion =
    useReducedMotion()

  return (
    <motion.div
      className="p-health-row"
      whileHover={
        reduceMotion
          ? {}
          : {
              x: 3,
            }
      }
    >

      <span className="p-health-left">

        <motion.i
          className="p-dot"
          animate={
            reduceMotion
              ? {}
              : {
                  opacity: [
                    0.45,
                    1,
                    0.45,
                  ],
                  scale: [
                    0.9,
                    1.1,
                    0.9,
                  ],
                }
          }
          transition={{
            duration: 2.2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {label}

      </span>


      <strong>
        {status}
      </strong>

    </motion.div>
  )
}