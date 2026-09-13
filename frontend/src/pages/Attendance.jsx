import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Gift,
  Flame,
  Loader2,
} from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"

import { getMyWorkoutHistory, getMyPrograms } from "../api/api.js"

const GIFT_ATTENDANCE_TARGET = 80

const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
]

function localDateKey(date = new Date()) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

function yearStart(year) {
  return `${year}-01-01`
}

function yearEnd(year) {
  return `${year}-12-31`
}

function normalizeDate(value) {
  if (!value) return ""
  const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/)
  return match ? `${match[1]}-${match[2]}-${match[3]}` : localDateKey(new Date(value))
}

function getDaysInMonth(year, monthIndex) {
  return new Date(year, monthIndex + 1, 0).getDate()
}

function isFuture(dateKey) {
  return dateKey > localDateKey()
}

function formatDate(dateKey) {
  if (!dateKey) return ""
  return new Date(`${dateKey}T00:00:00`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

function getStreaks(attendedDates) {
  // A streak is based only on workouts that were actually completed.
  // A completed workout on one day followed by a completed workout on the
  // next calendar day increases the streak. Any gap breaks the streak.
  const dates = [...new Set(attendedDates)].sort()

  if (!dates.length) {
    return { current: 0, longest: 0 }
  }

  let longest = 1
  let run = 1

  for (let index = 1; index < dates.length; index += 1) {
    const previousDate = new Date(`${dates[index - 1]}T00:00:00`)
    const currentDate = new Date(`${dates[index]}T00:00:00`)
    const difference = Math.round(
      (currentDate - previousDate) / 86400000,
    )

    if (difference === 1) {
      run += 1
    } else {
      run = 1
    }

    longest = Math.max(longest, run)
  }

  // The current streak is the consecutive run ending on the most
  // recently completed workout date. Future scheduled workouts do not
  // affect it because they are not in attendedDates.
  let current = 1

  for (let index = dates.length - 1; index > 0; index -= 1) {
    const latestDate = new Date(`${dates[index]}T00:00:00`)
    const previousDate = new Date(`${dates[index - 1]}T00:00:00`)
    const difference = Math.round(
      (latestDate - previousDate) / 86400000,
    )

    if (difference !== 1) {
      break
    }

    current += 1
  }

  return { current, longest }
}

function MonthCalendar({ year, monthIndex, attended }) {
  const days = getDaysInMonth(year, monthIndex)
  const firstDay = new Date(year, monthIndex, 1).getDay()
  const cells = []

  for (let i = 0; i < firstDay; i += 1) cells.push(null)
  for (let day = 1; day <= days; day += 1) cells.push(day)

  while (cells.length % 7 !== 0) cells.push(null)

  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-black">{monthNames[monthIndex]}</h3>
        <CalendarDays size={16} className="text-lime-400" />
      </div>
      <div className="grid grid-cols-7 gap-1.5 text-center text-[9px] font-black uppercase text-gray-600">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
          <div key={`${day}-${index}`}>{day}</div>
        ))}
      </div>
      <div className="mt-2 grid grid-cols-7 gap-1.5">
        {cells.map((day, index) => {
          if (!day) return <div key={`blank-${index}`} className="aspect-square" />
          const key = `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
          const attendedToday = attended.has(key)
          const future = isFuture(key)
          return (
            <div
              key={key}
              title={`${formatDate(key)}${attendedToday ? " — Attended" : future ? " — Scheduled date not yet reached" : " — Not attended"}`}
              className={`flex aspect-square items-center justify-center rounded-lg text-[10px] font-black ${
                attendedToday
                  ? "bg-lime-400 text-black"
                  : future
                    ? "bg-black/30 text-gray-700"
                    : "bg-black text-gray-500"
              }`}
            >
              {day}
            </div>
          )
        })}
      </div>
    </section>
  )
}

export default function Attendance() {
  const navigate = useNavigate()
  const currentYear = new Date().getFullYear()
  const [year, setYear] = useState(currentYear)
  const [history, setHistory] = useState([])
  const [assignments, setAssignments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        setError("")
        const [historyResponse, assignmentResponse] = await Promise.all([
          getMyWorkoutHistory(),
          getMyPrograms(),
        ])
        setHistory(Array.isArray(historyResponse?.history) ? historyResponse.history : [])
        setAssignments(Array.isArray(assignmentResponse?.assignments) ? assignmentResponse.assignments : [])
      } catch (err) {
        setError(err?.response?.data?.message || err?.message || "Unable to load attendance.")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const attended = useMemo(() => {
    const set = new Set()
    const scheduledDates = new Set()

    assignments.forEach((item) => {
      if (item?.status === "cancelled") return

      const date = normalizeDate(item?.workoutDate)
      if (date && date.startsWith(`${year}-`)) {
        scheduledDates.add(date)
      }
    })

    history.forEach((item) => {
      if (item?.completed !== true) return

      const date = normalizeDate(item?.date)
      if (
        date &&
        date.startsWith(`${year}-`) &&
        scheduledDates.has(date)
      ) {
        set.add(date)
      }
    })

    return set
  }, [history, assignments, year])

  const scheduled = useMemo(() => {
    const set = new Set()
    assignments.forEach((item) => {
      if (item?.status === "cancelled") return
      const date = normalizeDate(item?.workoutDate)
      if (date && date.startsWith(`${year}-`) && !isFuture(date)) set.add(date)
    })
    return set
  }, [assignments, year])

  const attendedScheduled = useMemo(
    () => [...attended].filter((date) => scheduled.has(date)).length,
    [attended, scheduled],
  )

  const attendanceRate = scheduled.size ? Math.round((attendedScheduled / scheduled.size) * 100) : 0
  const streaks = useMemo(() => getStreaks(attended), [attended])
  const giftEligible = attendanceRate >= GIFT_ATTENDANCE_TARGET && scheduled.size > 0

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-white">
        <div className="text-center">
          <Loader2 size={30} className="mx-auto animate-spin text-lime-400" />
          <p className="mt-4 text-sm font-bold text-gray-500">Loading attendance...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black px-5 py-8 text-white">
      <main className="mx-auto max-w-7xl">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mb-6 inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-gray-500 hover:text-lime-400"
        >
          <ArrowLeft size={16} /> Back
        </button>

        <header className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-lime-400">GB Member Attendance</p>
              <h1 className="mt-2 text-3xl font-black">Attendance Calendar</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">
                Attendance is recorded automatically when an assigned workout is completed. There is no manual attendance button.
              </p>
            </div>
            <select
              value={year}
              onChange={(event) => setYear(Number(event.target.value))}
              className="rounded-2xl border border-white/10 bg-black px-4 py-3 text-sm font-black text-white outline-none focus:border-lime-400"
            >
              {Array.from({ length: 5 }, (_, index) => currentYear - index).map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </div>
        </header>

        {error ? <div className="mt-5 rounded-2xl border border-red-500/20 bg-red-500/5 p-4 text-sm font-bold text-red-300">{error}</div> : null}

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat icon={<CheckCircle2 size={18} />} label="Attendance Rate" value={`${attendanceRate}%`} />
          <Stat icon={<CalendarDays size={18} />} label="Days Attended" value={`${attendedScheduled}`} />
          <Stat icon={<Flame size={18} />} label="Current Streak" value={`${streaks.current} day${streaks.current === 1 ? "" : "s"}`} />
          <Stat icon={<Gift size={18} />} label="Gift Status" value={giftEligible ? "Eligible" : "Not Yet"} />
        </div>

        <div className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-gray-600">Annual Goal</p>
              <p className="mt-1 text-sm font-bold text-gray-300">Gift eligibility target: {GIFT_ATTENDANCE_TARGET}% attendance</p>
            </div>
            <div className={`rounded-full px-4 py-2 text-[10px] font-black uppercase ${giftEligible ? "bg-lime-400 text-black" : "bg-black text-gray-500"}`}>
              {giftEligible ? "Gift Eligible" : "Keep Training"}
            </div>
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-black">
            <div className="h-full rounded-full bg-lime-400 transition-all" style={{ width: `${Math.min(attendanceRate, 100)}%` }} />
          </div>
        </div>

        <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {monthNames.map((_, index) => (
            <MonthCalendar key={index} year={year} monthIndex={index} attended={attended} />
          ))}
        </div>
      </main>
    </div>
  )
}

function Stat({ icon, label, value }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
      <div className="flex items-center gap-2 text-lime-400">{icon}<span className="text-[10px] font-black uppercase tracking-widest text-gray-600">{label}</span></div>
      <p className="mt-3 text-2xl font-black">{value}</p>
    </div>
  )
}
