function getDayName(date = new Date()) {
  return date
    .toLocaleDateString("en-US", {
      weekday: "long",
    })
    .toLowerCase()
}

function getTodaySchedule(schedule, date = new Date()) {
  const dayName = getDayName(date)

  return (
    schedule[dayName] || {
      day: "Unknown",
      workoutId: null,
      workoutName: "No Workout",
      category: "Rest",
      startTime: null,
      endTime: null,
      type: "rest",
    }
  )
}

function getTomorrowSchedule(schedule, date = new Date()) {
  const tomorrow = new Date(date)

  tomorrow.setDate(tomorrow.getDate() + 1)

  return getTodaySchedule(schedule, tomorrow)
}

function formatClassTime(startTime, endTime) {
  if (!startTime || !endTime) {
    return null
  }

  const formatTime = (time) => {
    const [hours, minutes] = time.split(":")
    const date = new Date()

    date.setHours(Number(hours))
    date.setMinutes(Number(minutes))

    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    })
  }

  return `${formatTime(startTime)} – ${formatTime(endTime)}`
}

export {
  getDayName,
  getTodaySchedule,
  getTomorrowSchedule,
  formatClassTime,
}