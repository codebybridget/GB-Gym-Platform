import { useEffect, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"

import { payments } from "../api/api.js"

export default function PaymentCallback() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [status, setStatus] = useState("verifying")
  const [message, setMessage] = useState(
    "Verifying your payment. Please wait...",
  )

  useEffect(() => {
    let cancelled = false
    let redirectTimer = null

    const verifyPayment = async () => {
      const reference =
        searchParams.get("reference") ||
        searchParams.get("trxref")

      if (!reference) {
        if (!cancelled) {
          setStatus("error")
          setMessage(
            "Payment reference was not found.",
          )
        }

        return
      }

      try {
        setStatus("verifying")
        setMessage(
          "Verifying your payment. Please wait...",
        )

        /*
         * The backend identifies whether this reference
         * belongs to a GB Gym SaaS subscription or another
         * supported payment.
         *
         * This endpoint is intentionally used instead of
         * sending a gym SaaS payment through the member
         * payment verifier.
         */
        const result =
          await payments.verifyPublicPlatform(
            reference,
          )

        if (cancelled) {
          return
        }

        if (!result?.success) {
          setStatus("error")
          setMessage(
            result?.message ||
              "Payment verification failed.",
          )

          return
        }

        setStatus("success")
        setMessage(
          "Payment successful. Your GB gym subscription has been activated.",
        )

        /*
         * Give the backend a moment to finish the
         * subscription activation before returning
         * the owner to login.
         */
        redirectTimer = setTimeout(() => {
          if (cancelled) {
            return
          }

          navigate("/login", {
            replace: true,
            state: {
              message:
                "Your gym subscription is active. Sign in to open your gym dashboard.",
            },
          })
        }, 1800)
      } catch (error) {
        if (cancelled) {
          return
        }

        console.error(
          "Gym SaaS payment verification error:",
          error,
        )

        setStatus("error")

        setMessage(
          error?.response?.data?.message ||
            error?.message ||
            "We could not verify your payment. If money was deducted, please contact GB support.",
        )
      }
    }

    verifyPayment()

    return () => {
      cancelled = true

      if (redirectTimer) {
        clearTimeout(redirectTimer)
      }
    }
  }, [searchParams, navigate])

  const handleReturnToLogin = () => {
    navigate("/login", {
      replace: true,
    })
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#020617] px-4 py-8 text-white">
      <section className="w-full max-w-md rounded-[28px] border border-white/10 bg-[#111322] p-7 text-center shadow-2xl sm:p-9">
        {status === "verifying" && (
          <>
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-lime-400/10">
              <div className="h-9 w-9 animate-spin rounded-full border-4 border-white/10 border-t-lime-400" />
            </div>

            <p className="text-xs font-black uppercase tracking-[0.22em] text-lime-400">
              GB Gym Platform
            </p>

            <h1 className="mt-3 text-2xl font-black">
              Verifying Payment
            </h1>

            <p className="mt-3 text-sm leading-6 text-slate-400">
              {message}
            </p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-lime-400/15 text-3xl font-black text-lime-400">
              ✓
            </div>

            <p className="text-xs font-black uppercase tracking-[0.22em] text-lime-400">
              GB Gym Platform
            </p>

            <h1 className="mt-3 text-2xl font-black">
              Payment Successful
            </h1>

            <p className="mt-3 text-sm leading-6 text-slate-400">
              {message}
            </p>

            <p className="mt-5 text-xs text-slate-500">
              Redirecting you to login...
            </p>
          </>
        )}

        {status === "error" && (
          <>
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10 text-3xl font-black text-red-400">
              !
            </div>

            <p className="text-xs font-black uppercase tracking-[0.22em] text-lime-400">
              GB Gym Platform
            </p>

            <h1 className="mt-3 text-2xl font-black">
              Payment Verification Failed
            </h1>

            <p className="mt-3 text-sm leading-6 text-slate-400">
              {message}
            </p>

            <button
              type="button"
              onClick={handleReturnToLogin}
              className="mt-7 w-full rounded-xl bg-lime-400 px-5 py-4 text-sm font-black text-black transition hover:bg-lime-300"
            >
              RETURN TO LOGIN
            </button>
          </>
        )}
      </section>
    </main>
  )
}