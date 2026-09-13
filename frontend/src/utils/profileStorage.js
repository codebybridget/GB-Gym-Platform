const STORAGE_PREFIX = "gb_member_profile"
const LEGACY_STORAGE_KEY = "gb_member_profile"

const defaultProfile = {
  fullName: "GB Member",
  email: "",
  phone: "",
  age: "",
  height: "",
  weight: "",
  address: "",
  goal: "keep_fit",
  medicalInfo: "",
  emergencyContact: {
    name: "",
    relationship: "",
    phone: "",
  },
}

const fitnessGoals = {
  lose_weight: "Lose Weight",
  keep_fit: "Keep Fit",
  gain_weight: "Gain Weight",
  become_trainer: "Train to Become a Trainer",
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

function createDefaultProfile() {
  return {
    ...defaultProfile,
    emergencyContact: {
      ...defaultProfile.emergencyContact,
    },
  }
}

function getProfile() {
  const storageKey = getStorageKey()
  if (!storageKey) return createDefaultProfile()

  try {
    const stored = localStorage.getItem(storageKey)
    if (!stored) return createDefaultProfile()

    const parsed = JSON.parse(stored)

    return {
      ...createDefaultProfile(),
      ...parsed,
      emergencyContact: {
        ...defaultProfile.emergencyContact,
        ...(parsed.emergencyContact || {}),
      },
    }
  } catch (error) {
    console.error("Unable to load member profile:", error)
    return createDefaultProfile()
  }
}

function saveProfile(profile) {
  const storageKey = getStorageKey()
  if (!storageKey) return profile

  localStorage.setItem(storageKey, JSON.stringify(profile))
  return profile
}

function updateProfile(changes) {
  const currentProfile = getProfile()

  const updatedProfile = {
    ...currentProfile,
    ...changes,
    emergencyContact: {
      ...currentProfile.emergencyContact,
      ...(changes.emergencyContact || {}),
    },
  }

  return saveProfile(updatedProfile)
}

function getFitnessGoalLabel(goal) {
  return fitnessGoals[goal] || "Keep Fit"
}

function getFitnessGoals() {
  return { ...fitnessGoals }
}

function clearProfileStorage() {
  const storageKey = getStorageKey()
  if (storageKey) localStorage.removeItem(storageKey)
  localStorage.removeItem(LEGACY_STORAGE_KEY)
}

export {
  getProfile,
  saveProfile,
  updateProfile,
  getFitnessGoalLabel,
  getFitnessGoals,
  clearProfileStorage,
}
