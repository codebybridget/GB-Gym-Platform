import {
  getProgram,
} from "./programStorage"

import {
  getAssignmentsForMember,
} from "./assignmentStorage"

function getWorkoutProgram(
  workoutType,
  memberId = null,
) {
  if (memberId) {
    const assignments =
      getAssignmentsForMember(
        memberId,
      )

    const assigned =
      assignments.find(
        (assignment) =>
          assignment.status ===
            "active" &&
          assignment.workoutType ===
            workoutType,
      )

    if (assigned) {
      return {
        title:
          assigned.programTitle,
        subtitle:
          assigned.programDescription ||
          "",
        exercises:
          assigned.exercises || [],
      }
    }
  }

  const program =
    getProgram(
      workoutType,
    )

  if (
    program &&
    program.exercises &&
    program.exercises.length > 0
  ) {
    return {
      title:
        program.title,
      subtitle:
        program.description,
      exercises:
        program.exercises,
    }
  }

  return {
    title: getDefaultTitle(
      workoutType,
    ),
    subtitle:
      "No exercises have been assigned to this workout yet.",
    exercises: [],
  }
}

function getDefaultTitle(
  workoutType,
) {
  const titles = {
    lower_body:
      "Lower Body",
    upper_body:
      "Upper Body",
    crossfit:
      "CrossFit",
    tabata:
      "Tabata",
  }

  return (
    titles[workoutType] ||
    "Workout"
  )
}

export {
  getWorkoutProgram,
}