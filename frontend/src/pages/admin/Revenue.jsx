import {
  ArrowDownRight,
  ArrowUpRight,
  CreditCard,
  RefreshCw,
  TrendingUp,
  Users,
  Wallet,
  XCircle,
} from "lucide-react"
import { useEffect, useMemo, useState } from "react"

import {
  getRevenueByPlan,
  getRevenueOverview,
  getRevenueSummary,
  getRevenueTransactions,
} from "../../api/api.js"

import { useGym } from "../../context/GymContext"

function formatCurrency(value, currency = "NGN") {
  const amount = Number(value || 0)

  try {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: currency || "NGN",
      maximumFractionDigits: 2,
    }).format(amount)
  } catch {
    return `${currency || "NGN"} ${amount.toLocaleString()}`
  }
}

function getPrimaryCurrency(totals = {}) {
  if (totals?.NGN !== undefined) return "NGN"

  const currencies = Object.keys(totals || {})
  return currencies[0] || "NGN"
}

function getPrimaryAmount(totals = {}) {
  const currency = getPrimaryCurrency(totals)
  return Number(totals?.[currency] || 0)
}

function getMemberName(user) {
  if (!user) return "Unknown member"

  return (
    user.fullName ||
    `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
    user.name ||
    user.email ||
    "Unknown member"
  )
}

function formatDate(value) {
  if (!value) return "—"

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return "—"

  return date.toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

function formatDateTime(value) {
  if (!value) return "—"

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return "—"

  return date.toLocaleString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function StatCard({
  icon: Icon,
  label,
  value,
  detail,
  iconClass = "bg-yellow-400 text-black",
}) {
  return (
    <div className="group rounded-3xl border border-white/10 bg-[#0b0b0b] p-5 transition hover:border-white/20">
      <div className="flex items-start justify-between gap-4">
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-2xl ${iconClass}`}
        >
          <Icon size={21} strokeWidth={2.2} />
        </div>

        <TrendingUp
          size={17}
          className="text-gray-700 transition group-hover:text-lime-400"
        />
      </div>

      <p className="mt-5 text-[11px] font-black uppercase tracking-[0.16em] text-gray-500">
        {label}
      </p>

      <p className="mt-1 text-2xl font-black tracking-tight text-white sm:text-3xl">
        {value}
      </p>

      {detail ? (
        <p className="mt-1 text-xs text-gray-600">
          {detail}
        </p>
      ) : null}
    </div>
  )
}

function EmptyState({ message }) {
  return (
    <div className="rounded-2xl border border-dashed border-white/10 bg-black p-8 text-center text-xs text-gray-600">
      {message}
    </div>
  )
}

function Revenue() {
  const { gym } = useGym() || {}

  const gymName =
    gym?.name?.trim() || "Gym"

  const [overview, setOverview] = useState(null)
  const [summary, setSummary] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [pagination, setPagination] = useState(null)
  const [revenueByPlan, setRevenueByPlan] = useState([])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [lastUpdated, setLastUpdated] = useState(null)

  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [page, setPage] = useState(1)

  const loadRevenue = async () => {
    try {
      setLoading(true)
      setError("")

      const transactionParams = {
        page,
        limit: 20,
      }

      if (startDate) {
        transactionParams.startDate = startDate
      }

      if (endDate) {
        transactionParams.endDate = endDate
      }

      const [
        overviewResponse,
        transactionsResponse,
        planResponse,
        summaryResponse,
      ] = await Promise.all([
        getRevenueOverview(),
        getRevenueTransactions(transactionParams),
        getRevenueByPlan(),
        getRevenueSummary(),
      ])

      setOverview(overviewResponse?.data || null)
      setTransactions(
        Array.isArray(
          transactionsResponse?.data?.transactions,
        )
          ? transactionsResponse.data.transactions
          : [],
      )
      setPagination(
        transactionsResponse?.data?.pagination ||
          null,
      )
      setRevenueByPlan(
        Array.isArray(planResponse?.data)
          ? planResponse.data
          : [],
      )
      setSummary(summaryResponse?.data || null)
      setLastUpdated(new Date())
    } catch (err) {
      console.error(
        "Load admin revenue error:",
        err,
      )

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to load revenue data.",
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadRevenue()
  }, [page, startDate, endDate])

  const totalRevenue = useMemo(() => {
    return getPrimaryAmount(
      overview?.totalRevenue,
    )
  }, [overview])

  const todayRevenue = useMemo(() => {
    return getPrimaryAmount(
      overview?.revenueToday,
    )
  }, [overview])

  const monthRevenue = useMemo(() => {
    return getPrimaryAmount(
      overview?.revenueThisMonth,
    )
  }, [overview])

  const yearRevenue = useMemo(() => {
    return getPrimaryAmount(
      overview?.revenueThisYear,
    )
  }, [overview])

  const primaryCurrency = useMemo(() => {
    return getPrimaryCurrency(
      overview?.totalRevenue,
    )
  }, [overview])

  const averagePayment = useMemo(() => {
    const count = Number(
      overview?.successfulPayments || 0,
    )

    return count > 0
      ? totalRevenue / count
      : 0
  }, [overview, totalRevenue])

  const clearFilters = () => {
    setStartDate("")
    setEndDate("")
    setPage(1)
  }

  const hasFilters =
    Boolean(startDate) || Boolean(endDate)

  return (
    <div className="min-h-full bg-black px-4 py-6 text-white sm:px-6 lg:px-8">
      <main className="mx-auto max-w-7xl">
        <header className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-lime-400">
              <Wallet size={17} />

              <span className="text-[11px] font-black uppercase tracking-[0.18em]">
                {gymName} Admin
              </span>
            </div>

            <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
              Revenue
            </h1>

            <p className="mt-2 text-sm text-gray-500">
              Track membership income, successful payments and revenue performance.
            </p>

            {lastUpdated ? (
              <p className="mt-2 text-xs font-medium text-gray-700">
                Updated{" "}
                {lastUpdated.toLocaleTimeString(
                  "en-NG",
                  {
                    hour: "2-digit",
                    minute: "2-digit",
                  },
                )}
              </p>
            ) : null}
          </div>

          <button
            type="button"
            onClick={loadRevenue}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-black text-gray-300 transition hover:border-white/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw
              size={15}
              className={
                loading ? "animate-spin" : ""
              }
            />
            Refresh
          </button>
        </header>

        {error ? (
          <div className="mt-6 flex items-center gap-3 rounded-2xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-300">
            <XCircle size={18} />
            <span>{error}</span>
          </div>
        ) : null}

        <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            icon={Wallet}
            label="Total Revenue"
            value={
              loading
                ? "—"
                : formatCurrency(
                    totalRevenue,
                    primaryCurrency,
                  )
            }
            detail="All successful payments"
            iconClass="bg-lime-400 text-black"
          />

          <StatCard
            icon={CreditCard}
            label="This Month"
            value={
              loading
                ? "—"
                : formatCurrency(
                    monthRevenue,
                    primaryCurrency,
                  )
            }
            detail="Successful payments this month"
          />

          <StatCard
            icon={TrendingUp}
            label="This Year"
            value={
              loading
                ? "—"
                : formatCurrency(
                    yearRevenue,
                    primaryCurrency,
                  )
            }
            detail="Successful payments this year"
            iconClass="bg-white text-black"
          />

          <StatCard
            icon={Users}
            label="Successful Payments"
            value={
              loading
                ? "—"
                : Number(
                    overview?.successfulPayments || 0,
                  ).toLocaleString()
            }
            detail={
              loading
                ? "—"
                : `Average ${formatCurrency(
                    averagePayment,
                    primaryCurrency,
                  )} per payment`
            }
          />
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-3">
          <div className="rounded-3xl border border-white/10 bg-[#0b0b0b] p-5 sm:p-6">
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-gray-500">
              Today
            </p>

            <p className="mt-2 text-3xl font-black">
              {loading
                ? "—"
                : formatCurrency(
                    todayRevenue,
                    primaryCurrency,
                  )}
            </p>

            <div className="mt-4 flex items-center gap-2 text-xs text-gray-600">
              <ArrowUpRight
                size={14}
                className="text-lime-400"
              />
              Successful membership payments received today
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-[#0b0b0b] p-5 sm:p-6">
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-gray-500">
              Members
            </p>

            <p className="mt-2 text-3xl font-black">
              {loading
                ? "—"
                : Number(
                    summary?.activeMembers || 0,
                  ).toLocaleString()}
            </p>

            <p className="mt-2 text-xs text-gray-600">
              Active members
            </p>

            <p className="mt-3 text-xs text-gray-700">
              {loading
                ? "—"
                : `${Number(
                    summary?.totalMembers || 0,
                  ).toLocaleString()} total registered members`}
            </p>
          </div>

          <div className="rounded-3xl border border-lime-400/15 bg-lime-400/[0.025] p-5 sm:p-6">
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-lime-400">
              Revenue status
            </p>

            <p className="mt-2 text-xl font-black">
              {loading
                ? "Loading..."
                : "Payment tracking active"}
            </p>

            <p className="mt-2 text-xs leading-5 text-gray-600">
              Revenue is calculated from successful membership payment transactions recorded by{" "}
              {gymName}.
            </p>
          </div>
        </section>

        <section className="mt-6 rounded-3xl border border-white/10 bg-[#0b0b0b] p-5 sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.16em] text-gray-500">
                Transaction history
              </p>

              <h2 className="mt-1 text-xl font-black">
                Successful Payments
              </h2>

              <p className="mt-1 text-xs text-gray-600">
                Review completed membership transactions.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
              <label className="text-[10px] font-black uppercase tracking-wider text-gray-600">
                From
                <input
                  type="date"
                  value={startDate}
                  onChange={(event) => {
                    setPage(1)
                    setStartDate(
                      event.target.value,
                    )
                  }}
                  className="mt-1 block rounded-xl border border-white/10 bg-black px-3 py-2 text-xs text-white outline-none focus:border-lime-400/50"
                />
              </label>

              <label className="text-[10px] font-black uppercase tracking-wider text-gray-600">
                To
                <input
                  type="date"
                  value={endDate}
                  onChange={(event) => {
                    setPage(1)
                    setEndDate(
                      event.target.value,
                    )
                  }}
                  className="mt-1 block rounded-xl border border-white/10 bg-black px-3 py-2 text-xs text-white outline-none focus:border-lime-400/50"
                />
              </label>

              {hasFilters ? (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-black text-gray-400 transition hover:border-white/20 hover:text-white"
                >
                  Clear
                </button>
              ) : null}
            </div>
          </div>

          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[760px] text-left">
              <thead>
                <tr className="border-b border-white/5 text-[10px] font-black uppercase tracking-wider text-gray-600">
                  <th className="px-3 py-3">
                    Member
                  </th>

                  <th className="px-3 py-3">
                    Plan
                  </th>

                  <th className="px-3 py-3">
                    Amount
                  </th>

                  <th className="px-3 py-3">
                    Channel
                  </th>

                  <th className="px-3 py-3">
                    Reference
                  </th>

                  <th className="px-3 py-3">
                    Paid
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-white/5">
                {loading ? (
                  <tr>
                    <td
                      colSpan="6"
                      className="px-3 py-10 text-center text-xs text-gray-600"
                    >
                      Loading transactions...
                    </td>
                  </tr>
                ) : transactions.length === 0 ? (
                  <tr>
                    <td
                      colSpan="6"
                      className="px-3 py-10"
                    >
                      <EmptyState message="No successful payments found for the selected period." />
                    </td>
                  </tr>
                ) : (
                  transactions.map(
                    (transaction) => {
                      const user =
                        transaction.user
                      const plan =
                        transaction.membershipPlan

                      return (
                        <tr
                          key={
                            transaction._id ||
                            transaction.reference
                          }
                          className="transition hover:bg-white/[0.02]"
                        >
                          <td className="px-3 py-4">
                            <p className="text-sm font-black text-white">
                              {getMemberName(user)}
                            </p>

                            <p className="mt-0.5 text-xs text-gray-600">
                              {user?.email || "—"}
                            </p>
                          </td>

                          <td className="px-3 py-4">
                            <p className="text-sm font-bold text-gray-300">
                              {plan?.name ||
                                "Unknown plan"}
                            </p>
                          </td>

                          <td className="px-3 py-4">
                            <p className="text-sm font-black text-lime-400">
                              {formatCurrency(
                                transaction.amount,
                                transaction.currency ||
                                  plan?.currency ||
                                  "NGN",
                              )}
                            </p>
                          </td>

                          <td className="px-3 py-4">
                            <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-black uppercase text-gray-400">
                              {transaction.channel ||
                                "Paystack"}
                            </span>
                          </td>

                          <td className="px-3 py-4">
                            <span className="font-mono text-[11px] text-gray-600">
                              {transaction.reference ||
                                "—"}
                            </span>
                          </td>

                          <td className="px-3 py-4">
                            <p className="text-xs font-bold text-gray-400">
                              {formatDateTime(
                                transaction.paidAt,
                              )}
                            </p>
                          </td>
                        </tr>
                      )
                    },
                  )
                )}
              </tbody>
            </table>
          </div>

          {pagination &&
          pagination.totalPages > 1 ? (
            <div className="mt-5 flex items-center justify-between gap-4 border-t border-white/5 pt-4">
              <p className="text-xs text-gray-600">
                Page {pagination.page} of{" "}
                {pagination.totalPages}
              </p>

              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={
                    page <= 1 || loading
                  }
                  onClick={() =>
                    setPage((current) =>
                      Math.max(current - 1, 1),
                    )
                  }
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-black text-gray-400 transition hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                >
                  Previous
                </button>

                <button
                  type="button"
                  disabled={
                    page >=
                      pagination.totalPages ||
                    loading
                  }
                  onClick={() =>
                    setPage((current) =>
                      Math.min(
                        current + 1,
                        pagination.totalPages,
                      ),
                    )
                  }
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-black text-gray-400 transition hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                >
                  Next
                </button>
              </div>
            </div>
          ) : null}
        </section>

        <section className="mt-6 rounded-3xl border border-white/10 bg-[#0b0b0b] p-5 sm:p-6">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-gray-500">
              Membership performance
            </p>

            <h2 className="mt-1 text-xl font-black">
              Revenue by Plan
            </h2>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {loading ? (
              <div className="sm:col-span-2 lg:col-span-3">
                <EmptyState message="Loading plan revenue..." />
              </div>
            ) : revenueByPlan.length === 0 ? (
              <div className="sm:col-span-2 lg:col-span-3">
                <EmptyState message="No successful membership payments yet." />
              </div>
            ) : (
              revenueByPlan.map((item) => (
                <div
                  key={
                    item._id ||
                    item.planName
                  }
                  className="rounded-2xl border border-white/5 bg-black p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-black text-white">
                        {item.planName}
                      </p>

                      <p className="mt-1 text-xs text-gray-600">
                        {Number(
                          item.payments || 0,
                        ).toLocaleString()}{" "}
                        successful payment
                        {Number(
                          item.payments || 0,
                        ) === 1
                          ? ""
                          : "s"}
                      </p>
                    </div>

                    <ArrowDownRight
                      size={17}
                      className="text-lime-400"
                    />
                  </div>

                  <p className="mt-4 text-xl font-black text-lime-400">
                    {formatCurrency(
                      item.revenue,
                      item.currency ||
                        "NGN",
                    )}
                  </p>
                </div>
              ))
            )}
          </div>
        </section>

        <p className="mt-6 pb-4 text-center text-[11px] leading-5 text-gray-700">
          Revenue figures are based on successful payment records. Failed, abandoned, pending and refunded transactions are not counted as revenue.
        </p>
      </main>
    </div>
  )
}

export default Revenue