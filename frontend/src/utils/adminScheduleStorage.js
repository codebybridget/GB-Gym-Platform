const ADMIN_SCHEDULE_KEY =
  "gb_admin_weekly_schedule"

const defaultSchedule = [
  {
    id: 1,
    day: "Monday",
    shortDay: "MON",
    workoutType: "lower_body",
    title: "Lower Body",
    description:
      "Lower body strength and conditioning session.",
    startTime: "6:00 AM",
    endTime: "7:00 AM",
    location: "GB Gym",
    duration: "60 min",
    trainerAssigned: true,
  },

  {
    id: 2,
    day: "Tuesday",
    shortDay: "TUE",
    workoutType: "upper_body",
    title: "Upper Body",
    description:
      "Upper body strength and conditioning session.",
    startTime: "6:00 AM",
    endTime: "7:00 AM",
    location: "GB Gym",
    duration: "60 min",
    trainerAssigned: true,
  },

  {
    id: 3,
    day: "Wednesday",
    shortDay: "WED",
    workoutType: "lower_body",
    title: "Lower Body",
    description:
      "Lower body strength and conditioning session.",
    startTime: "6:00 AM",
    endTime: "7:00 AM",
    location: "GB Gym",
    duration: "60 min",
    trainerAssigned: true,
  },

  {
    id: 4,
    day: "Thursday",
    shortDay: "THU",
    workoutType: "upper_body",
    title: "Upper Body",
    description:
      "Upper body strength and conditioning session.",
    startTime: "6:00 AM",
    endTime: "7:00 AM",
    location: "GB Gym",
    duration: "60 min",
    trainerAssigned: true,
  },

  {
    id: 5,
    day: "Friday",
    shortDay: "FRI",
    workoutType: "crossfit",
    title: "CrossFit",
    description:
      "Full-body CrossFit training session.",
    startTime: "6:00 AM",
    endTime: "7:00 AM",
    location: "GB Gym",
    duration: "60 min",
    trainerAssigned: true,
  },

  {
    id: 6,
    day: "Saturday",
    shortDay: "SAT",
    workoutType: "tabata",
    title: "Tabata",
    description:
      "High-intensity Tabata group training session.",
    startTime: "8:00 AM",
    endTime: "9:00 AM",
    location: "GB Gym",
    duration: "60 min",
    trainerAssigned: true,
  },

  {
    id: 7,
    day: "Sunday",
    shortDay: "SUN",
    workoutType: "rest",
    title: "Rest Day",
    description:
      "Recovery day. No scheduled group workout.",
    startTime: "",
    endTime: "",
    location: "GB Gym",
    duration: "",
    trainerAssigned: true,
  },
]

function getAdminSchedule() {
  try {
    const stored =
      localStorage.getItem(
        ADMIN_SCHEDULE_KEY,
      )

    if (!stored) {
      return defaultSchedule
    }

    const parsed =
      JSON.parse(stored)

    if (!Array.isArray(parsed)) {
      return defaultSchedule
    }

    return parsed
  } catch (error) {
    console.error(
      "Unable to load admin schedule:",
      error,
    )

    return defaultSchedule
  }
}

function saveAdminSchedule(
  schedule,
) {
  localStorage.setItem(
    ADMIN_SCHEDULE_KEY,
    JSON.stringify(schedule),
  )

  return schedule
}

function updateScheduleDay(
  dayId,
  changes,
) {
  const schedule =
    getAdminSchedule()

  const updated =
    schedule.map((day) =>
      day.id === dayId
        ? {
            ...day,
            ...changes,
          }
        : day,
    )

  return saveAdminSchedule(
    updated,
  )
}

export {
  getAdminSchedule,
  saveAdminSchedule,
  updateScheduleDay,
}