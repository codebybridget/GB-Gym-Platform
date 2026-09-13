const SCHEDULE_STORAGE_KEY =
  "gb_weekly_schedule"

const defaultSchedule = {
  monday: {
    type: "lower_body",
    title: "Lower Body",
    startTime: "17:00",
    endTime: "18:00",
  },

  tuesday: {
    type: "upper_body",
    title: "Upper Body",
    startTime: "17:00",
    endTime: "18:00",
  },

  wednesday: {
    type: "lower_body",
    title: "Lower Body",
    startTime: "17:00",
    endTime: "18:00",
  },

  thursday: {
    type: "upper_body",
    title: "Upper Body",
    startTime: "17:00",
    endTime: "18:00",
  },

  friday: {
    type: "crossfit",
    title: "CrossFit",
    startTime: "17:00",
    endTime: "18:00",
  },

  saturday: {
    type: "tabata",
    title: "Tabata",
    startTime: "08:00",
    endTime: "09:00",
  },

  sunday: {
    type: "rest",
    title: "Rest Day",
    startTime: "",
    endTime: "",
  },
}

function getSchedule() {
  try {
    const stored =
      localStorage.getItem(
        SCHEDULE_STORAGE_KEY,
      )

    if (!stored) {
      return defaultSchedule
    }

    const parsed =
      JSON.parse(stored)

    return {
      ...defaultSchedule,
      ...parsed,
    }
  } catch (error) {
    console.error(
      "Unable to load schedule:",
      error,
    )

    return defaultSchedule
  }
}

function saveSchedule(
  schedule,
) {
  localStorage.setItem(
    SCHEDULE_STORAGE_KEY,
    JSON.stringify(schedule),
  )

  return schedule
}

function getDaySchedule(
  day,
) {
  const schedule =
    getSchedule()

  return (
    schedule[day] ||
    null
  )
}

export {
  getSchedule,
  saveSchedule,
  getDaySchedule,
}