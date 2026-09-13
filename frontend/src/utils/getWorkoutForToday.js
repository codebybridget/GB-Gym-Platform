import weeklySchedule from "../data/weeklySchedule"
import getProgramById from "./getProgramById"

const dayMap = {
  Sunday: "sunday",
  Monday: "monday",
  Tuesday: "tuesday",
  Wednesday: "wednesday",
  Thursday: "thursday",
  Friday: "friday",
  Saturday: "saturday",
}

function getWorkoutForToday(
  date = new Date(),
) {
  const dayName = date.toLocaleDateString(
    "en-US",
    {
      weekday: "long",
    },
  )

  const dayKey = dayMap[dayName]

  const schedule = weeklySchedule.find(
    (item) => item.id === dayKey,
  )

  if (!schedule) {
    return {
      day: dayName,
      schedule: null,
      program: null,
    }
  }

  const program = getProgramById(
    schedule.programId,
  )

  return {
    day: dayName,
    schedule,
    program,
  }
}

export default getWorkoutForToday