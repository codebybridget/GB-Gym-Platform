import {
  useEffect,
  useState,
} from "react"

import {
  useNavigate,
  useSearchParams,
} from "react-router-dom"

import {
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  LoaderCircle,
  ShieldCheck,
} from "lucide-react"

import {
  getMembershipPlans,
  initializePayment,
} from "../api/api.js"


function formatPrice(
  price,
  currency = "NGN",
) {
  return new Intl.NumberFormat(
    "en-NG",
    {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    },
  ).format(price)
}


function Payment() {
  const navigate =
    useNavigate()

  const [
    searchParams,
  ] = useSearchParams()

  const planId =
    searchParams.get(
      "plan",
    )

  const [
    plan,
    setPlan,
  ] = useState(null)

  const [
    loading,
    setLoading,
  ] = useState(true)

  const [
    paying,
    setPaying,
  ] = useState(false)

  const [
    error,
    setError,
  ] = useState("")


  /*
  |--------------------------------------------------------------------------
  | Load Selected Membership Plan
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    const loadPlan =
      async () => {
        try {
          setLoading(true)
          setError("")

          if (!planId) {
            throw new Error(
              "No membership plan was selected.",
            )
          }

          const response =
            await getMembershipPlans()

          const plans =
            response?.plans ||
            []

          const selectedPlan =
            plans.find(
              (item) =>
                String(
                  item._id,
                ) ===
                String(
                  planId,
                ),
            )

          if (!selectedPlan) {
            throw new Error(
              "The selected membership plan could not be found.",
            )
          }

          setPlan(
            selectedPlan,
          )
        } catch (requestError) {
          console.error(
            "Load payment plan error:",
            requestError,
          )

          setError(
            requestError?.message ||
            "Unable to load the selected membership plan.",
          )
        } finally {
          setLoading(false)
        }
      }

    loadPlan()
  }, [
    planId,
  ])


  /*
  |--------------------------------------------------------------------------
  | Start Paystack Payment
  |--------------------------------------------------------------------------
  */

  const handlePayment =
    async () => {
      if (!plan?._id) {
        setError(
          "Membership plan is missing.",
        )

        return
      }

      try {
        setPaying(true)
        setError("")

        const response =
          await initializePayment(
            plan._id,
          )

        if (
          !response?.success ||
          !response?.authorizationUrl
        ) {
          throw new Error(
            response?.message ||
            "Unable to start payment.",
          )
        }

        /*
        |--------------------------------------------------------------------------
        | Send Member To Paystack
        |--------------------------------------------------------------------------
        */

        window.location.href =
          response.authorizationUrl
      } catch (paymentError) {
        console.error(
          "Payment initialization error:",
          paymentError,
        )

        setError(
          paymentError?.message ||
          "Unable to start payment.",
        )

        setPaying(false)
      }
    }


  /*
  |--------------------------------------------------------------------------
  | Loading State
  |--------------------------------------------------------------------------
  */

  if (loading) {
    return (
      <div className="min-h-screen bg-black px-4 py-12 text-white">

        <div className="flex min-h-[70vh] items-center justify-center">

          <div className="text-center">

            <LoaderCircle
              size={34}
              className="mx-auto animate-spin text-lime-400"
            />

            <p className="mt-4 text-sm text-gray-500">
              Loading payment details...
            </p>

          </div>

        </div>

      </div>
    )
  }


  /*
  |--------------------------------------------------------------------------
  | Error State
  |--------------------------------------------------------------------------
  */

  if (error && !plan) {
    return (
      <div className="min-h-screen bg-black px-4 py-12 text-white">

        <div className="mx-auto flex min-h-[70vh] max-w-xl items-center justify-center">

          <div className="w-full rounded-3xl border border-red-500/20 bg-red-500/10 p-8 text-center">

            <p className="text-lg font-black text-red-300">
              Payment Unavailable
            </p>

            <p className="mt-3 text-sm leading-6 text-red-200/70">
              {error ||
                "The selected membership plan could not be loaded."}
            </p>

            <button
              type="button"
              onClick={() =>
                navigate(
                  "/membership",
                )
              }
              className="mt-6 rounded-xl bg-lime-400 px-5 py-3 text-sm font-black text-black"
            >
              Back to Membership Plans
            </button>

          </div>

        </div>

      </div>
    )
  }


  /*
  |--------------------------------------------------------------------------
  | Payment Page
  |--------------------------------------------------------------------------
  */

  return (
    <div className="min-h-screen bg-black px-4 py-10 text-white sm:px-6">

      <div className="mx-auto max-w-5xl">

        {/* ============================================================ */}
        {/* BACK                                                         */}
        {/* ============================================================ */}

        <button
          type="button"
          onClick={() =>
            navigate(
              "/membership",
            )
          }
          className="mb-8 inline-flex items-center gap-2 text-sm font-bold text-gray-500 transition hover:text-white"
        >

          <ArrowLeft
            size={17}
          />

          Back to Membership Plans

        </button>


        {/* ============================================================ */}
        {/* HEADER                                                       */}
        {/* ============================================================ */}

        <div className="text-center">

          <p className="text-xs font-black uppercase tracking-[0.2em] text-lime-400">
            GB Secure Checkout
          </p>

          <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
            Complete Your Membership
          </h1>

          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-gray-500">
            Review your selected membership before continuing to secure payment.
          </p>

        </div>


        {/* ============================================================ */}
        {/* CHECKOUT                                                      */}
        {/* ============================================================ */}

        <div className="mt-10 grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">

          {/* ========================================================== */}
          {/* SELECTED PLAN                                               */}
          {/* ========================================================== */}

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 sm:p-8">

            <div className="flex items-start gap-4">

              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-lime-400 text-black">

                <CreditCard
                  size={22}
                />

              </div>

              <div>

                <p className="text-xs font-black uppercase tracking-wider text-gray-600">
                  Selected Membership
                </p>

                <h2 className="mt-1 text-2xl font-black">
                  {plan.name}
                </h2>

              </div>

            </div>


            {/* Description */}

            {plan.description && (
              <p className="mt-6 text-sm leading-6 text-gray-500">
                {plan.description}
              </p>
            )}


            {/* Features */}

            <div className="mt-7">

              <p className="text-xs font-black uppercase tracking-wider text-gray-600">
                What's Included
              </p>

              <ul className="mt-4 space-y-3">

                {plan.features?.length ? (
                  plan.features.map(
                    (
                      feature,
                      index,
                    ) => (
                      <li
                        key={`${plan._id}-feature-${index}`}
                        className="flex items-start gap-3 text-sm text-gray-300"
                      >

                        <CheckCircle2
                          size={17}
                          className="mt-0.5 shrink-0 text-lime-400"
                        />

                        <span>
                          {feature}
                        </span>

                      </li>
                    ),
                  )
                ) : (
                  <li className="text-sm text-gray-500">
                    Membership access included.
                  </li>
                )}

              </ul>

            </div>


            {/* Duration */}

            <div className="mt-8 rounded-2xl border border-white/10 bg-black/40 p-5">

              <div className="flex items-center justify-between">

                <span className="text-sm text-gray-500">
                  Membership duration
                </span>

                <span className="text-sm font-black">
                  {plan.durationDays}{" "}
                  {plan.durationDays ===
                  1
                    ? "day"
                    : "days"}
                </span>

              </div>

            </div>

          </div>


          {/* ========================================================== */}
          {/* ORDER SUMMARY                                               */}
          {/* ========================================================== */}

          <div className="h-fit rounded-3xl border border-white/10 bg-white/[0.04] p-6 sm:p-8">

            <p className="text-xs font-black uppercase tracking-wider text-gray-600">
              Order Summary
            </p>

            <h2 className="mt-2 text-xl font-black">
              Membership Payment
            </h2>


            <div className="mt-7 space-y-4">

              <div className="flex items-center justify-between gap-4">

                <span className="text-sm text-gray-500">
                  Plan
                </span>

                <span className="text-right text-sm font-bold">
                  {plan.name}
                </span>

              </div>


              <div className="flex items-center justify-between gap-4">

                <span className="text-sm text-gray-500">
                  Duration
                </span>

                <span className="text-sm font-bold">
                  {plan.durationDays} days
                </span>

              </div>


              <div className="border-t border-white/10 pt-5">

                <div className="flex items-end justify-between gap-4">

                  <span className="text-sm text-gray-500">
                    Total
                  </span>

                  <span className="text-3xl font-black">
                    {formatPrice(
                      plan.price,
                      plan.currency,
                    )}
                  </span>

                </div>

              </div>

            </div>


            {/* ======================================================== */}
            {/* PAYSTACK BUTTON                                           */}
            {/* ======================================================== */}

            {error && (
              <div className="mt-6 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {error}
              </div>
            )}

            <button
              type="button"
              onClick={
                handlePayment
              }
              disabled={paying}
              className="mt-8 flex w-full items-center justify-center gap-2 rounded-2xl bg-lime-400 px-5 py-4 text-sm font-black text-black transition hover:bg-lime-300 disabled:cursor-not-allowed disabled:opacity-60"
            >

              {paying ? (
                <>
                  <LoaderCircle
                    size={18}
                    className="animate-spin"
                  />

                  Starting Payment...
                </>
              ) : (
                <>
                  <CreditCard
                    size={18}
                  />

                  Pay with Paystack
                </>
              )}

            </button>


            {/* Security */}

            <div className="mt-5 flex items-start gap-3 rounded-2xl border border-white/10 bg-black/30 p-4">

              <ShieldCheck
                size={19}
                className="mt-0.5 shrink-0 text-lime-400"
              />

              <p className="text-xs leading-5 text-gray-600">
                Your payment will be processed securely through Paystack. GB does not store your card details.
              </p>

            </div>

          </div>

        </div>

      </div>

    </div>
  )
}

export default Payment