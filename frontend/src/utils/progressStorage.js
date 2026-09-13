const STORAGE_PREFIX = "gb_progress_data"
const LEGACY_STORAGE_KEY = "gb_progress_data"

const defaultProgress = {
  startingWeight: 0,
  currentWeight: 0,
  targetWeight: 70,
  height: 0,
  weightHistory: [],
}

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

function createDefaultProgress() {
  return {
    ...defaultProgress,
    weightHistory: [],
  }
}

function getProgressData() {
  const storageKey = getStorageKey()
  if (!storageKey) return createDefaultProgress()

  try {
    const storedData = localStorage.getItem(storageKey)
    if (!storedData) return createDefaultProgress()

    const parsedData = JSON.parse(storedData)

    const weightHistory = Array.isArray(parsedData?.weightHistory)
      ? parsedData.weightHistory
          .filter(
            (entry) =>
              entry?.date &&
              Number.isFinite(Number(entry?.weight)) &&
              Number(entry.weight) > 0,
          )
          .map((entry) => ({
            date: String(entry.date),
            weight: Number(entry.weight),
          }))
          .sort(
            (a, b) =>
              new Date(`${a.date}T00:00:00`) -
              new Date(`${b.date}T00:00:00`),
          )
      : []

    const currentWeight = Number(parsedData?.currentWeight)
    const startingWeight = Number(parsedData?.startingWeight)
    const targetWeight = Number(parsedData?.targetWeight)
    const height = Number(parsedData?.height)

    return {
      ...createDefaultProgress(),
      ...parsedData,
      startingWeight:
        Number.isFinite(startingWeight) && startingWeight > 0
          ? startingWeight
          : 0,
      currentWeight:
        Number.isFinite(currentWeight) && currentWeight > 0
          ? currentWeight
          : 0,
      targetWeight:
        Number.isFinite(targetWeight) && targetWeight > 0
          ? targetWeight
          : defaultProgress.targetWeight,
      height:
        Number.isFinite(height) && height > 0
          ? height
          : 0,
      weightHistory,
    }
  } catch (error) {
    console.error("Unable to load progress data:", error)
    return createDefaultProgress()
  }
}

function saveProgressData(data) {
  const storageKey = getStorageKey()
  if (!storageKey) return data

  const normalizedHistory = Array.isArray(data?.weightHistory)
    ? data.weightHistory
        .filter(
          (entry) =>
            entry?.date &&
            Number.isFinite(Number(entry?.weight)) &&
            Number(entry.weight) > 0,
        )
        .map((entry) => ({
          date: String(entry.date),
          weight: Number(entry.weight),
        }))
        .sort(
          (a, b) =>
            new Date(`${a.date}T00:00:00`) -
            new Date(`${b.date}T00:00:00`),
        )
    : []

  const normalizedData = {
    ...createDefaultProgress(),
    ...data,
    startingWeight:
      Number.isFinite(Number(data?.startingWeight)) &&
      Number(data.startingWeight) > 0
        ? Number(data.startingWeight)
        : 0,
    currentWeight:
      Number.isFinite(Number(data?.currentWeight)) &&
      Number(data.currentWeight) > 0
        ? Number(data.currentWeight)
        : 0,
    targetWeight:
      Number.isFinite(Number(data?.targetWeight)) &&
      Number(data.targetWeight) > 0
        ? Number(data.targetWeight)
        : defaultProgress.targetWeight,
    height:
      Number.isFinite(Number(data?.height)) &&
      Number(data.height) > 0
        ? Number(data.height)
        : 0,
    weightHistory: normalizedHistory,
  }

  localStorage.setItem(storageKey, JSON.stringify(normalizedData))
  return normalizedData
}

function getLocalDateKey(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")

  return `${year}-${month}-${day}`
}

function addWeightEntry(weight) {
  const progress = getProgressData()
  const numericWeight = Number(weight)

  if (!Number.isFinite(numericWeight) || numericWeight <= 0) {
    return progress
  }

  const today = getLocalDateKey()
  const updatedHistory = [...(progress.weightHistory || [])]
  const existingIndex = updatedHistory.findIndex(
    (entry) => entry.date === today,
  )

  const newEntry = {
    date: today,
    weight: numericWeight,
  }

  if (existingIndex >= 0) {
    updatedHistory[existingIndex] = newEntry
  } else {
    updatedHistory.push(newEntry)
  }

  const updatedProgress = {
    ...progress,
    startingWeight:
      Number(progress.startingWeight) > 0
        ? Number(progress.startingWeight)
        : numericWeight,
    currentWeight: numericWeight,
    weightHistory: updatedHistory,
  }

  return saveProgressData(updatedProgress)
}

function clearProgressData() {
  const storageKey = getStorageKey()
  if (storageKey) localStorage.removeItem(storageKey)
  localStorage.removeItem(LEGACY_STORAGE_KEY)
}

export {
  getProgressData,
  saveProgressData,
  addWeightEntry,
  clearProgressData,
}
