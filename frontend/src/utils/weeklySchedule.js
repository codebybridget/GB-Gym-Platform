import {
  getAdminSchedule,
} from "./adminScheduleStorage"

function getWeeklySchedule() {
  return getAdminSchedule()
}

function getScheduleForDay(dayName) {
  const schedule =
    getWeeklySchedule()

  return schedule.find(
    (item) =>
      item.day.toLowerCase() ===
      dayName.toLowerCase(),
  )
}

export {
  getWeeklySchedule,
  getScheduleForDay,
}