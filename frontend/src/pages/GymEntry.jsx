import { useEffect, useState } from "react"
import {
  Link,
  useNavigate,
  useParams,
} from "react-router-dom"

import { gyms } from "../api/api"
import { err } from "../utils/helpers"

export default function GymEntry() {
  const { gymSlug } = useParams()
  const navigate = useNavigate()

  const [gym, setGym] = useState(null)
  const [error, setError] = useState("")

  useEffect(() => {
    let cancelled = false

    gyms
      .entry(gymSlug)
      .then((response) => {
        if (!cancelled) {
          setGym(
            response?.gym || null,
          )
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setError(err(e))
        }
      })

    return () => {
      cancelled = true
    }
  }, [gymSlug])

  const go = (path) => {
    sessionStorage.setItem(
      "gb_entry_gym",
      gymSlug,
    )

    navigate(
      `${path}?gym=${encodeURIComponent(
        gymSlug,
      )}`,
    )
  }

  if (error) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <h1>Gym Not Available</h1>

          <div className="alert error">
            {error}
          </div>

          <button
            type="button"
            className="btn ghost"
            onClick={() =>
              navigate("/")
            }
          >
            Back to GB Platform
          </button>
        </div>
      </div>
    )
  }

  if (!gym) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="loading">
            Loading gym...
          </div>
        </div>
      </div>
    )
  }

  const primary =
    gym.branding?.primaryColor ||
    "#d7ff32"

  const gymName =
    gym.name?.trim() ||
    "Your Gym"

  const initials =
    gymName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map(
        (word) =>
          word.charAt(0),
      )
      .join("")
      .toUpperCase() || "GY"

  return (
    <div
      className="auth-page"
      style={{
        "--entry-accent": primary,
      }}
    >
      <div
        className="auth-card"
        style={{
          textAlign: "center",
        }}
      >
        {/* GYM LOGO */}

        {gym.logoUrl ? (
          <img
            src={gym.logoUrl}
            alt={`${gymName} logo`}
            style={{
              width: 90,
              height: 90,
              objectFit: "contain",
              margin: "0 auto 12px",
              borderRadius: 16,
            }}
          />
        ) : (
          <div
            className="brand-mark"
            style={{
              margin: "0 auto 12px",
              background: primary,
            }}
          >
            {initials}
          </div>
        )}

        {/* GYM NAME */}

        <p
          style={{
            margin: "0 0 8px",
            fontSize: 12,
            fontWeight: 900,
            textTransform:
              "uppercase",
            letterSpacing:
              "0.2em",
            color: primary,
          }}
        >
          {gymName}
        </p>

        <h1>
          Welcome to {gymName}
        </h1>

        <p className="muted">
          Access your workouts,
          profile, progress,
          schedule, attendance
          and membership.
        </p>

        {/* MEMBER LOGIN */}

        <button
          type="button"
          className="btn primary"
          style={{
            background: primary,
            borderColor: primary,
          }}
          onClick={() =>
            go("/login")
          }
        >
          Member Login
        </button>

        {/* MEMBER REGISTRATION */}

        <button
          type="button"
          className="btn ghost"
          onClick={() =>
            go("/register")
          }
        >
          New Member? Create Account
        </button>

        {/* TRAINER LOGIN */}

        <div
          style={{
            margin:
              "24px 0 18px",
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <div
            style={{
              flex: 1,
              height: 1,
              background:
                "rgba(255,255,255,0.1)",
            }}
          />

          <span
            style={{
              fontSize: 11,
              fontWeight: 800,
              textTransform:
                "uppercase",
              letterSpacing:
                "0.12em",
              color:
                "rgba(255,255,255,0.45)",
            }}
          >
            Trainer Access
          </span>

          <div
            style={{
              flex: 1,
              height: 1,
              background:
                "rgba(255,255,255,0.1)",
            }}
          />
        </div>

        <button
          type="button"
          className="btn ghost"
          onClick={() =>
            go("/trainer-login")
          }
        >
          Trainer Sign In
        </button>

        {/* PLATFORM OWNER LINK IS INTENTIONALLY NOT SHOWN */}

        <p
          style={{
            marginTop: 20,
            fontSize: 11,
            lineHeight: 1.6,
            color:
              "rgba(255,255,255,0.4)",
          }}
        >
          This portal is for
          members and trainers
          of {gymName}.
        </p>

        <Link
          to="/"
          style={{
            display: "inline-block",
            marginTop: 14,
            fontSize: 12,
            fontWeight: 700,
            color:
              "rgba(255,255,255,0.55)",
            textDecoration:
              "none",
          }}
        >
          GB Gym Platform
        </Link>
      </div>
    </div>
  )
}