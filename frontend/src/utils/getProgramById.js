import programs from "../data/programData"
import exercises from "../data/exerciseData"

function getProgramById(programId) {
  const program = programs.find(
    (item) => item.id === programId,
  )

  if (!program) {
    return null
  }

  const exercisesWithDetails =
    program.exercises.map(
      (programExercise) => {
        const exercise = exercises.find(
          (item) =>
            item.id ===
            programExercise.exerciseId,
        )

        return {
          ...programExercise,
          details: exercise || null,
        }
      },
    )

  return {
    ...program,
    exercises: exercisesWithDetails,
  }
}

export default getProgramById