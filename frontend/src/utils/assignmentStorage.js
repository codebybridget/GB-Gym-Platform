const ASSIGNMENT_STORAGE_KEY =
  "gb_workout_assignments"

function getAssignments() {
  try {
    const stored =
      localStorage.getItem(
        ASSIGNMENT_STORAGE_KEY,
      )

    if (!stored) {
      return []
    }

    const parsed =
      JSON.parse(stored)

    if (!Array.isArray(parsed)) {
      return []
    }

    return parsed
  } catch (error) {
    console.error(
      "Unable to load workout assignments:",
      error,
    )

    return []
  }
}

function saveAssignments(
  assignments,
) {
  localStorage.setItem(
    ASSIGNMENT_STORAGE_KEY,
    JSON.stringify(assignments),
  )

  return assignments
}

function createAssignment(
  assignment,
) {
  const assignments =
    getAssignments()

  const newAssignment = {
    id: Date.now(),
    memberId:
      assignment.memberId,
    memberName:
      assignment.memberName,
    workoutType:
      assignment.workoutType,
    programTitle:
      assignment.programTitle,
    programDescription:
      assignment.programDescription ||
      "",
    exercises:
      assignment.exercises || [],
    startDate:
      assignment.startDate ||
      new Date()
        .toISOString()
        .split("T")[0],
    endDate:
      assignment.endDate || "",
    status:
      assignment.status ||
      "active",
    assignedAt:
      new Date().toISOString(),
  }

  return saveAssignments([
    ...assignments,
    newAssignment,
  ])
}

function updateAssignment(
  assignmentId,
  changes,
) {
  const assignments =
    getAssignments()

  const updated =
    assignments.map(
      (assignment) =>
        String(assignment.id) ===
        String(assignmentId)
          ? {
              ...assignment,
              ...changes,
            }
          : assignment,
    )

  return saveAssignments(
    updated,
  )
}

function deleteAssignment(
  assignmentId,
) {
  const assignments =
    getAssignments()

  const updated =
    assignments.filter(
      (assignment) =>
        String(assignment.id) !==
        String(assignmentId),
    )

  return saveAssignments(
    updated,
  )
}

function getAssignmentsForMember(
  memberId,
) {
  return getAssignments().filter(
    (assignment) =>
      String(assignment.memberId) ===
      String(memberId),
  )
}

function getActiveAssignmentForMember(
  memberId,
  workoutType,
) {
  const assignments =
    getAssignmentsForMember(
      memberId,
    )

  return (
    assignments.find(
      (assignment) =>
        assignment.status ===
          "active" &&
        assignment.workoutType ===
          workoutType,
    ) || null
  )
}

export {
  getAssignments,
  saveAssignments,
  createAssignment,
  updateAssignment,
  deleteAssignment,
  getAssignmentsForMember,
  getActiveAssignmentForMember,
}