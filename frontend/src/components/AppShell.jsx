import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom"

import {
  Bell,
  ChevronLeft,
  ChevronRight,
  Dumbbell,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  Users,
  UserRound,
  ClipboardList,
  CalendarDays,
  BarChart3,
  Wallet,
  PersonStanding,
  Package,
  Building2,
  ShieldCheck,
  ClipboardCheck,
  Share2,
  X,
} from "lucide-react"

import { useEffect, useState } from "react"

import { useAuth } from "../context/AuthContext"
import { useGym } from "../context/GymContext"

import {
  getMe,
} from "../api/api.js"

import { initials } from "../utils/helpers"

import "../styles/platform.css"

const admin = [
  ["/admin", LayoutDashboard, "Dashboard"],
  ["/admin/members", Users, "Members"],
  ["/admin/trainers", PersonStanding, "Trainers"],
  ["/admin/attendance", ClipboardCheck, "Attendance"],
  ["/admin/exercises", Dumbbell, "Exercise Lab"],
  ["/admin/programs", ClipboardList, "Workout Programs"],
  ["/admin/program-builder", Dumbbell, "Program Builder"],
  ["/admin/assignments", UserRound, "Assignments"],
  ["/admin/workouts", Package, "Workouts"],
  ["/admin/schedule", CalendarDays, "Weekly Schedule"],
  ["/admin/progress", BarChart3, "Progress"],
  ["/admin/revenue", Wallet, "Revenue"],
  ["/admin/membership-plans", ShieldCheck, "Membership Plans"],
  ["/admin/subscription", ShieldCheck, "Subscription"],
  ["/admin/profile", UserRound, "Profile"],
  ["/admin/social-media", Share2, "Gym Social Media"],
  ["/admin/settings", Settings, "Settings"],
  ["/notifications", Bell, "Notifications"],
]

const member = [
  ["/dashboard", LayoutDashboard, "Dashboard"],
  ["/workout", Dumbbell, "Today Workout"],
  ["/weekly-schedule", CalendarDays, "Weekly Schedule"],
  ["/attendance", ClipboardCheck, "Attendance"],
  ["/progress", BarChart3, "Progress"],
  ["/workout-history", ClipboardList, "Workout History"],
  ["/membership", ShieldCheck, "Membership"],
  ["/gym-social-media", Share2, "Gym Social Media"],
  ["/notifications", Bell, "Notifications"],
  ["/profile", UserRound, "Profile"],
  ["/settings", Settings, "Settings"],
]

const trainer = [
  ["/trainer", LayoutDashboard, "Dashboard"],
  ["/trainer/members", Users, "Members"],
  ["/trainer/exercises", Dumbbell, "Exercises"],
  ["/trainer/programs", ClipboardList, "Programs"],
  ["/trainer/assignments", UserRound, "Assignments"],
  ["/trainer/schedule", CalendarDays, "Schedule"],
  ["/trainer/progress", BarChart3, "Progress"],
  ["/trainer/profile", UserRound, "Profile"],
  ["/notifications", Bell, "Notifications"],
]

const owner = [
  ["/platform", LayoutDashboard, "Platform Dashboard"],
  ["/platform/gyms", Building2, "Gyms"],
  ["/platform/subscriptions", ShieldCheck, "Subscriptions"],
  ["/platform/revenue", Wallet, "Platform Revenue"],
  ["/platform/plans", Package, "SaaS Plans"],
  ["/platform/settings", Settings, "Settings"],
]

function LogoutModal({
  name,
  onCancel,
  onConfirm,
  isMember = false,
}) {
  return (
    <div
      onMouseDown={onCancel}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        background: "rgba(0, 0, 0, 0.78)",
        animation: "logoutOverlayIn 180ms ease-out",
      }}
    >
      <div
        onMouseDown={(e) => e.stopPropagation()}
        style={{
          position: "relative",
          width: "100%",
          maxWidth: "480px",
          padding: "34px 30px 30px",
          borderRadius: "22px",
          background: "#0e131a",
          border: "1px solid rgba(255,255,255,0.12)",
          boxShadow: "0 25px 70px rgba(0,0,0,0.65)",
          textAlign: "center",
          animation:
            "logoutModalIn 220ms cubic-bezier(.2,.8,.2,1)",
        }}
      >
        <button
          type="button"
          onClick={onCancel}
          aria-label="Close"
          style={{
            position: "absolute",
            top: "14px",
            right: "14px",
            width: "36px",
            height: "36px",
            border: "0",
            borderRadius: "50%",
            background: "#151b23",
            color: "#aab4c3",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
          }}
        >
          <X size={18} />
        </button>

        <div
          style={{
            width: "76px",
            height: "76px",
            margin: "0 auto 22px",
            borderRadius: "20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#ff6873",
            background: "#211417",
            border: "1px solid rgba(255,70,85,0.30)",
          }}
        >
          <LogOut
            size={34}
            strokeWidth={1.8}
          />
        </div>

        <h2
          style={{
            margin: 0,
            color: "#ffffff",
            fontSize: "28px",
            fontWeight: 900,
            letterSpacing: "-0.6px",
          }}
        >
          Log out?
        </h2>

        <p
          style={{
            margin: "12px auto 0",
            maxWidth: "350px",
            color: "#9aa5b5",
            fontSize: "14px",
            lineHeight: 1.65,
          }}
        >
          Are you sure you want to end your{" "}
          {isMember
            ? "gym app session"
            : `${name} session`}
          ?
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "1fr 1fr",
            gap: "12px",
            marginTop: "26px",
          }}
        >
          <button
            type="button"
            onClick={onCancel}
            style={{
              height: "54px",
              borderRadius: "14px",
              border: "1px solid #667386",
              background: "#0b1016",
              color: "#f1f4f8",
              fontSize: "14px",
              fontWeight: 800,
              cursor: "pointer",
            }}
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onConfirm}
            style={{
              height: "54px",
              border: "0",
              borderRadius: "14px",
              background: "#ff4654",
              color: "#ffffff",
              fontSize: "14px",
              fontWeight: 900,
              cursor: "pointer",
            }}
          >
            Log out
          </button>
        </div>

        <style>
          {`
            @keyframes logoutOverlayIn {
              from {
                opacity: 0;
              }

              to {
                opacity: 1;
              }
            }

            @keyframes logoutModalIn {
              from {
                opacity: 0;
                transform: translateY(18px) scale(0.96);
              }

              to {
                opacity: 1;
                transform: translateY(0) scale(1);
              }
            }
          `}
        </style>
      </div>
    </div>
  )
}

export default function AppShell() {
  const {
    user,
    logout,
  } = useAuth()

  const {
    gym,
  } = useGym()

  const [
    headerUser,
    setHeaderUser,
  ] = useState(user)

  const [
    collapsed,
    setCollapsed,
  ] = useState(false)

  const [
    mobile,
    setMobile,
  ] = useState(false)

  const [
    showLogout,
    setShowLogout,
  ] = useState(false)

  const navigate = useNavigate()
  const location = useLocation()

  /*
  |--------------------------------------------------------------------------
  | Keep authenticated header user synchronized
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    setHeaderUser(user)
  }, [user])

  /*
  |--------------------------------------------------------------------------
  | Refresh authenticated user profile
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    let mounted = true

    const refreshHeaderUser = async () => {
      try {
        const response = await getMe()
        const freshUser = response?.user

        if (
          mounted &&
          freshUser
        ) {
          setHeaderUser(freshUser)

          localStorage.setItem(
            "user",
            JSON.stringify(freshUser),
          )
        }
      } catch (error) {
        console.warn(
          "Unable to refresh header profile:",
          error,
        )
      }
    }

    if (user) {
      refreshHeaderUser()
    }

    return () => {
      mounted = false
    }
  }, [user])

  /*
  |--------------------------------------------------------------------------
  | Detect mobile screen
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 900) {
        setMobile(false)
      }
    }

    handleResize()

    window.addEventListener(
      "resize",
      handleResize,
    )

    return () => {
      window.removeEventListener(
        "resize",
        handleResize,
      )
    }
  }, [])

  /*
  |--------------------------------------------------------------------------
  | Close mobile navigation after route change
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    setMobile(false)
  }, [location.pathname])

  /*
  |--------------------------------------------------------------------------
  | Prevent body horizontal overflow
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    const originalOverflowX =
      document.body.style.overflowX

    document.body.style.overflowX = "hidden"

    return () => {
      document.body.style.overflowX =
        originalOverflowX
    }
  }, [])

  const isPlatform =
    headerUser?.role === "platform_owner"

  const isMember =
    headerUser?.role === "member"

  /*
  |--------------------------------------------------------------------------
  | Gym branding
  |--------------------------------------------------------------------------
  */

  const gymName =
    gym?.name?.trim() ||
    "Gym"

  const brandName =
    isPlatform
      ? "GB"
      : gymName

  const brandMark =
    isPlatform
      ? "GB"
      : initials(
          gymName,
        )

  useEffect(() => {
    document.title =
      isPlatform
        ? "GB Platform"
        : gymName

    document.documentElement.style.setProperty(
      "--gym-accent",
      gym?.branding?.primaryColor ||
        "#d7ff35",
    )

    document.documentElement.style.setProperty(
      "--gym-accent-secondary",
      gym?.branding?.secondaryColor ||
        "#ffe13b",
    )
  }, [
    isPlatform,
    gymName,
    gym?.branding,
  ])

  /*
  |--------------------------------------------------------------------------
  | Role navigation
  |--------------------------------------------------------------------------
  */

  const nav =
    isPlatform
      ? owner
      : headerUser?.role === "admin"
        ? admin
        : headerUser?.role === "trainer"
          ? trainer
          : member

  const displayName =
    headerUser?.name ||
    `${headerUser?.firstName || ""} ${
      headerUser?.lastName || ""
    }`.trim() ||
    headerUser?.email ||
    "User"

  const roleLabel =
    isPlatform
      ? "Platform Owner"
      : headerUser?.role === "admin"
        ? "Admin"
        : headerUser?.role === "trainer"
          ? "Trainer"
          : "Member"

  const profilePhoto =
    headerUser?.profilePhoto || ""

  /*
  |--------------------------------------------------------------------------
  | Logout
  |--------------------------------------------------------------------------
  */

  const confirmLogout = async () => {
    setShowLogout(false)

    try {
      await logout()
    } finally {
      navigate(
        "/login",
        {
          replace: true,
        },
      )
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Shared sidebar
  |--------------------------------------------------------------------------
  */

  const sidebarContent = (
    <>
      <div className="brand">
        {gym?.logoUrl &&
        !isPlatform ? (
          <img
            className="brand-logo"
            src={gym.logoUrl}
            alt={`${brandName} logo`}
          />
        ) : (
          <div className="brand-mark">
            {brandMark}
          </div>
        )}

        {!collapsed && (
          <div className="brand-copy">
            <b>{brandName}</b>

            <small>
              {roleLabel} Panel
            </small>
          </div>
        )}

        {mobile && (
          <button
            type="button"
            onClick={() =>
              setMobile(false)
            }
            aria-label="Close menu"
            style={{
              marginLeft: "auto",
              width: 38,
              height: 38,
              border: 0,
              borderRadius: 11,
              background: "#151b23",
              color: "#dce2e9",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            <X size={19} />
          </button>
        )}
      </div>

      <nav>
        {nav.map(
          ([
            to,
            Icon,
            label,
          ]) => (
            <NavLink
              key={to}
              to={to}
              end={
                to === "/admin" ||
                to === "/trainer" ||
                to === "/platform" ||
                to === "/dashboard"
              }
              onClick={() =>
                setMobile(false)
              }
            >
              <Icon size={19} />

              {!collapsed && (
                <span>{label}</span>
              )}
            </NavLink>
          ),
        )}
      </nav>

      <div className="side-bottom">
        <button
          className="nav-link"
          type="button"
          onClick={() =>
            setShowLogout(true)
          }
        >
          <LogOut size={19} />

          {!collapsed && (
            <span>Logout</span>
          )}
        </button>
      </div>
    </>
  )

  return (
    <div
      className={`shell ${
        collapsed
          ? "collapsed"
          : ""
      } ${
        isPlatform
          ? "platform-owner-shell"
          : ""
      } ${
        isMember
          ? "member-shell"
          : ""
      }`}
      style={{
        width: "100%",
        maxWidth: "100%",
        overflowX: "hidden",
      }}
    >
      {/* ================================================================
          DESKTOP SIDEBAR
      ================================================================= */}

      <aside
        className="sidebar"
        style={
          isMember
            ? {
                display: "none",
              }
            : undefined
        }
      >
        {sidebarContent}
      </aside>

      {/* ================================================================
          MOBILE DRAWER
      ================================================================= */}

      {!isMember &&
        mobile && (
          <>
            <div
              onClick={() =>
                setMobile(false)
              }
              aria-hidden="true"
              style={{
                position: "fixed",
                inset: 0,
                zIndex: 9997,
                background:
                  "rgba(0,0,0,.62)",
              }}
            />

            <aside
              className="sidebar mobile-open"
              style={{
                position: "fixed",
                left: 0,
                top: 0,
                bottom: 0,
                width: "min(88vw, 330px)",
                maxWidth: "330px",
                zIndex: 9998,
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
                background: "#0b1016",
                borderRight:
                  "1px solid rgba(255,255,255,.09)",
                boxShadow:
                  "12px 0 40px rgba(0,0,0,.35)",
              }}
            >
              {sidebarContent}
            </aside>
          </>
        )}

      {/* ================================================================
          MAIN APPLICATION
      ================================================================= */}

      <main
        className="main"
        style={
          isMember
            ? {
                marginLeft: 0,
                width: "100%",
                minWidth: 0,
                maxWidth: "100%",
              }
            : {
                minWidth: 0,
                maxWidth: "100%",
                overflowX: "hidden",
              }
        }
      >
        {/* ==============================================================
            TOP HEADER
        ============================================================== */}

        <header
          className="topbar"
          style={{
            display: isMember
              ? "none"
              : "flex",
            alignItems: "center",
            minHeight: "78px",
            padding:
              "0 28px",
            gap: "20px",
            width: "100%",
            maxWidth: "100%",
            boxSizing:
              "border-box",
          }}
        >
          {/* Mobile menu button */}

          <button
            type="button"
            className="icon-btn mobile-menu"
            onClick={() =>
              setMobile(true)
            }
            aria-label="Open menu"
            style={{
              flexShrink: 0,
            }}
          >
            <Menu />
          </button>

          {/* Desktop sidebar collapse */}

          <button
            type="button"
            className="icon-btn collapse"
            onClick={() =>
              setCollapsed(
                !collapsed,
              )
            }
            aria-label={
              collapsed
                ? "Expand sidebar"
                : "Collapse sidebar"
            }
            style={{
              flexShrink: 0,
            }}
          >
            {collapsed ? (
              <ChevronRight />
            ) : (
              <ChevronLeft />
            )}
          </button>

          {/* Brand / Control Center */}

          <div
            className="top-brand"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "14px",
              minWidth: 0,
              whiteSpace: "nowrap",
              overflow: "hidden",
            }}
          >
            <span
              style={{
                fontSize: "11px",
                fontWeight: 800,
                letterSpacing: "0.16em",
                color: "#7f8a9a",
                textTransform: "uppercase",
                flexShrink: 0,
              }}
            >
              {isPlatform
                ? "GB Platform"
                : "Control Center"}
            </span>

            <span
              style={{
                width: "1px",
                height: "24px",
                background:
                  "rgba(255,255,255,0.12)",
                flexShrink: 0,
              }}
            />

            <strong
              style={{
                color: "#ffffff",
                fontSize: "17px",
                fontWeight: 900,
                letterSpacing: "-0.2px",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
              title={brandName}
            >
              {brandName}
            </strong>
          </div>

          {/* Flexible space */}

          <div
            className="top-space"
            style={{
              flex: 1,
              minWidth: "5px",
            }}
          />

          {/* Notifications */}

          <button
            type="button"
            className="icon-btn"
            aria-label="Notifications"
            onClick={() =>
              navigate(
                "/notifications",
              )
            }
            style={{
              flexShrink: 0,
            }}
          >
            <Bell size={19} />
          </button>

          {/* User */}

          <div
            className="top-user"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              flexShrink: 0,
              paddingLeft: "8px",
            }}
          >
            <div
              className="top-user-copy"
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-end",
                justifyContent: "center",
                gap: "3px",
                minWidth: "110px",
              }}
            >
              <strong
                style={{
                  color: "#ffffff",
                  fontSize: "14px",
                  lineHeight: 1.2,
                  fontWeight: 800,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  maxWidth: "190px",
                }}
              >
                {displayName}
              </strong>

              <small
                style={{
                  color: "#9aa5b5",
                  fontSize: "11px",
                  lineHeight: 1.2,
                  fontWeight: 700,
                  whiteSpace: "nowrap",
                }}
              >
                {roleLabel}
              </small>
            </div>

            {/* Avatar */}

            <div
              className="avatar"
              style={{
                flexShrink: 0,
                overflow: "hidden",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {profilePhoto ? (
                <img
                  src={profilePhoto}
                  alt={`${displayName} profile`}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    borderRadius: "50%",
                    display: "block",
                  }}
                  onError={(
                    event,
                  ) => {
                    event.currentTarget.style.display =
                      "none"

                    const fallback =
                      event.currentTarget
                        .parentElement
                        ?.querySelector(
                          "[data-avatar-fallback]",
                        )

                    if (fallback) {
                      fallback.style.display =
                        "flex"
                    }
                  }}
                />
              ) : null}

              <span
                data-avatar-fallback
                style={{
                  display:
                    profilePhoto
                      ? "none"
                      : "flex",
                  width: "100%",
                  height: "100%",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {initials(
                  displayName,
                )}
              </span>
            </div>
          </div>
        </header>

        {/* ==============================================================
            PAGE CONTENT
        ============================================================== */}

        <div
          className="content"
          style={
            isMember
              ? {
                  padding: 0,
                  width: "100%",
                  maxWidth: "none",
                  minWidth: 0,
                }
              : {
                  minWidth: 0,
                  maxWidth: "100%",
                  overflowX: "hidden",
                }
          }
        >
          <Outlet />
        </div>
      </main>

      {/* ================================================================
          LOGOUT MODAL
      ================================================================= */}

      {showLogout && (
        <LogoutModal
          name={
            isPlatform
              ? "GB Platform"
              : gymName
          }
          onCancel={() =>
            setShowLogout(false)
          }
          onConfirm={
            confirmLogout
          }
          isMember={isMember}
        />
      )}

      {/* ================================================================
          MOBILE APP FOUNDATION
      ================================================================= */}

      <style>
        {`
          html,
          body,
          #root {
            width: 100%;
            max-width: 100%;
            min-width: 0;
            overflow-x: hidden;
          }

          * {
            box-sizing: border-box;
          }

          @media (max-width: 900px) {
            .shell {
              width: 100% !important;
              max-width: 100% !important;
              min-width: 0 !important;
              overflow-x: hidden !important;
            }

            .sidebar:not(.mobile-open) {
              display: none !important;
            }

            .main {
              margin-left: 0 !important;
              width: 100% !important;
              max-width: 100% !important;
              min-width: 0 !important;
              overflow-x: hidden !important;
            }

            .topbar {
              min-height: 64px !important;
              height: 64px !important;
              padding: 0 14px !important;
              gap: 10px !important;
            }

            .mobile-menu {
              display: flex !important;
            }

            .collapse {
              display: none !important;
            }

            .top-brand {
              gap: 8px !important;
              flex: 1 !important;
              min-width: 0 !important;
            }

            .top-brand > span:first-child {
              display: none !important;
            }

            .top-brand > span:nth-child(2) {
              display: none !important;
            }

            .top-brand strong {
              max-width: 150px !important;
              font-size: 15px !important;
            }

            .top-space {
              display: none !important;
            }

            .top-user {
              padding-left: 0 !important;
              gap: 8px !important;
            }

            .top-user-copy {
              display: none !important;
            }

            .avatar {
              width: 38px !important;
              height: 38px !important;
            }

            .content {
              width: 100% !important;
              max-width: 100% !important;
              min-width: 0 !important;
              overflow-x: hidden !important;
            }

            .mobile-open nav {
              overflow-y: auto !important;
              overflow-x: hidden !important;
              -webkit-overflow-scrolling: touch !important;
              padding-bottom: 10px !important;
            }

            .mobile-open nav a {
              min-height: 48px !important;
              margin: 3px 10px !important;
              border-radius: 12px !important;
            }

            .mobile-open .brand {
              min-height: 72px !important;
              padding: 14px !important;
              flex-shrink: 0 !important;
            }

            .mobile-open .side-bottom {
              flex-shrink: 0 !important;
              padding: 10px !important;
            }

            .mobile-open .nav-link {
              min-height: 50px !important;
              width: 100% !important;
              border-radius: 12px !important;
            }
          }

          @media (max-width: 520px) {
            .topbar {
              padding: 0 12px !important;
            }

            .top-brand strong {
              max-width: 125px !important;
              font-size: 14px !important;
            }

            .icon-btn {
              width: 40px !important;
              height: 40px !important;
            }
          }

          @media (min-width: 901px) {
            .mobile-menu {
              display: none !important;
            }
          }

          @media (prefers-reduced-motion: reduce) {
            *,
            *::before,
            *::after {
              animation-duration: 0.01ms !important;
              animation-iteration-count: 1 !important;
              transition-duration: 0.01ms !important;
            }
          }
        `}
      </style>
    </div>
  )
}