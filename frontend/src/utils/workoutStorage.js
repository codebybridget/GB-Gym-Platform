const STORAGE_PREFIX = "gb_workout_history"
const LEGACY_STORAGE_KEY = "gb_workout_history"

function getCurrentUserId() {
  try {
    const storedUser = localStorage.getItem("user")
    if (!storedUser) return null

    const user = JSON.parse(storedUser)
    return user?._id || user?.id || user?.userId || null
  } catch (error) {
    console.error("Unable to determine current user:", error)
    return null
  }
}

function getStorageKey(userId = getCurrentUserId()) {
  return userId ? `${STORAGE_PREFIX}:${userId}` : null
}

function getWorkoutHistory() {
  const storageKey = getStorageKey()

  // Never fall back to the old global key. That key could contain another
  // member's workout history.
  if (!storageKey) return []

  try {
    const storedHistory = localStorage.getItem(storageKey)
    if (!storedHistory) return []

    const parsedHistory = JSON.parse(storedHistory)
    return Array.isArray(parsedHistory) ? parsedHistory : []
  } catch (error) {
    console.error("Unable to load workout history:", error)
    return []
  }
}

function saveWorkoutSession(session) {
  const storageKey = getStorageKey()

  // Do not write member data if there is no authenticated member.
  if (!storageKey) return session

  const currentHistory = getWorkoutHistory()
  const updatedHistory = [session, ...currentHistory]

  localStorage.setItem(storageKey, JSON.stringify(updatedHistory))
  return session
}

function getWorkoutStatistics() {
  const history = getWorkoutHistory()
  const completedWorkouts = history.filter(
    (session) => session.completed === true,
  )

  const totalDuration = completedWorkouts.reduce(
    (total, session) =>
      total + Number(session.durationSeconds || 0),
    0,
  )

  const totalSets = completedWorkouts.reduce(
    (total, session) =>
      total + Number(session.completedSets || 0),
    0,
  )

  return {
    totalWorkouts: completedWorkouts.length,
    totalDurationSeconds: totalDuration,
    totalSets,
    currentStreak: calculateStreak(completedWorkouts),
  }
}

function calculateStreak(completedWorkouts) {
  if (completedWorkouts.length === 0) return 0

  const dates = [
    ...new Set(
      completedWorkouts.map((session) => session.date).filter(Boolean),
    ),
  ].sort((a, b) => new Date(b) - new Date(a))

  let streak = 0
  let currentDate = new Date()

  for (const date of dates) {
    const completedDate = new Date(date)
    const difference = Math.floor(
      (startOfDay(currentDate) - startOfDay(completedDate)) / 86400000,
    )

    if (difference === 0 || difference === 1) {
      streak += 1
      currentDate = completedDate
    } else {
      break
    }
  }

  return streak
}

function startOfDay(date) {
  const result = new Date(date)
  result.setHours(0, 0, 0, 0)
  return result
}

function clearWorkoutHistory() {
  const storageKey = getStorageKey()
  if (storageKey) localStorage.removeItem(storageKey)
  localStorage.removeItem(LEGACY_STORAGE_KEY)
}

export {
  getWorkoutHistory,
  saveWorkoutSession,
  getWorkoutStatistics,
  clearWorkoutHistory,
}
