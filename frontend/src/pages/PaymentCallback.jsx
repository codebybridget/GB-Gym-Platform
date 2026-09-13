import { useEffect, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"

import { payments, verifyPaystackPayment } from "../api/api.js"

export default function PaymentCallback() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [status, setStatus] = useState("verifying")
  const [message, setMessage] = useState("Verifying your payment. Please wait...")

  useEffect(() => {
    let cancelled = false

    const verify = async () => {
      const reference = searchParams.get("reference") || searchParams.get("trxref")

      if (!reference) {
        if (!cancelled) {
          setStatus("error")
          setMessage("Payment reference was not found.")
        }
        return
      }

      // GB gym SaaS payments are stored as PlatformTransaction records.
      // Verify those first so a successful Paystack payment changes the
      // GymSubscription paymentStatus from pending -> paid.
      try {
        const platformResult = await payments.verifyPublicPlatform(reference)

        if (!cancelled && platformResult?.success) {
          setStatus("success")
          setMessage("Payment successful. Your GB gym subscription has been activated.")

          setTimeout(() => {
            navigate("/login", {
              replace: true,
              state: {
                message: "Your gym subscription is active. Sign in to open your gym dashboard.",
              },
            })
          }, 1800)
          return
        }
      } catch (platformError) {
        // A normal gym-member payment is not a PlatformTransaction.
        // In that case continue with the existing member-payment verifier.
        if (platformError?.response?.status !== 404) {
          console.warn("Platform payment verification did not complete:", platformError)
        }
      }

      // Existing CGF/member membership payment flow.
      try {
        const result = await verifyPaystackPayment(reference)

        if (cancelled) return

        if (result?.success) {
          setStatus("success")
          setMessage("Payment successful. Your membership has been activated.")

          setTimeout(() => {
            navigate("/dashboard", { replace: true })
          }, 1800)
          return
        }

        setStatus("error")
        setMessage(result?.message || "Payment verification failed.")
      } catch (error) {
        if (cancelled) return

        console.error("Payment verification error:", error)
        setStatus("error")
        setMessage(
          error.response?.data?.message ||
            "We could not verify your payment. Please contact the gym if money was deducted.",
        )
      }
    }

    verify()

    return () => {
      cancelled = true
    }
  }, [searchParams, navigate])

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-8 text-center shadow-xl">
        {status === "verifying" && (
          <>
            <div className="mx-auto mb-5 h-10 w-10 animate-spin rounded-full border-4 border-white/20 border-t-white" />
            <h1 className="text-xl font-semibold">Verifying Payment</h1>
            <p className="mt-3 text-sm text-white/70">{message}</p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-green-500/20 text-2xl text-green-400">
              ✓
            </div>
            <h1 className="text-xl font-semibold">Payment Successful</h1>
            <p className="mt-3 text-sm text-white/70">{message}</p>
            <p className="mt-4 text-xs text-white/50">Redirecting you to your dashboard...</p>
          </>
        )}

        {status === "error" && (
          <>
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-red-500/20 text-2xl text-red-400">
              !
            </div>
            <h1 className="text-xl font-semibold">Payment Verification Failed</h1>
            <p className="mt-3 text-sm text-white/70">{message}</p>
            <button
              type="button"
              onClick={() => navigate("/dashboard")}
              className="mt-6 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-white/90"
            >
              Return to Dashboard
            </button>
          </>
        )}
      </div>
    </div>
  )
}
