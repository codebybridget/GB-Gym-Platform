import { useEffect } from "react"
import {
  useLocation,
  useNavigate,
} from "react-router-dom"
import {
  getGymEntrySlug,
  payments,
} from "../api/api.js"

export default function PaymentCallback() {
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    let mounted = true

    const verifyPayment = async () => {
      try {
        const params =
          new URLSearchParams(
            location.search,
          )

        const reference =
          params.get("reference") ||
          params.get("trxref") ||
          ""

        if (!reference) {
          navigate("/login", {
            replace: true,
            state: {
              message:
                "No payment reference was found.",
            },
          })
          return
        }

        const result =
          await payments.verifyPublicPlatform(
            reference,
          )

        if (!mounted) {
          return
        }

        if (!result?.success) {
          navigate("/login", {
            replace: true,
            state: {
              message:
                result?.message ||
                "Payment verification failed.",
            },
          })
          return
        }

        const gymSlug =
          getGymEntrySlug()

        if (gymSlug) {
          navigate(
            `/gym/${encodeURIComponent(
              gymSlug,
            )}/login`,
            {
              replace: true,
              state: {
                message:
                  "Payment successful! Your gym has been activated. Please sign in.",
              },
            },
          )
          return
        }

        navigate("/login", {
          replace: true,
          state: {
            message:
              "Payment successful! Please sign in.",
          },
        })
      } catch (error) {
        console.error(
          "Payment verification error:",
          error,
        )

        if (!mounted) {
          return
        }

        navigate("/login", {
          replace: true,
          state: {
            message:
              error?.response?.data?.message ||
              error?.message ||
              "We could not verify your payment.",
          },
        })
      }
    }

    verifyPayment()

    return () => {
      mounted = false
    }
  }, [
    location.search,
    navigate,
  ])

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#020617] px-4 text-white">
      <div className="text-center">
        <div className="mx-auto mb-5 h-12 w-12 animate-spin rounded-full border-4 border-white/20 border-t-[#D9FF3F]" />

        <h1 className="text-2xl font-black">
          Verifying Payment...
        </h1>

        <p className="mt-2 text-sm text-slate-400">
          Please wait while we confirm your payment.
        </p>
      </div>
    </main>
  )
}
