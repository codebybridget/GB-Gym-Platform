import exerciseCatalog from "../data/exerciseCatalog"

const EXERCISE_STORAGE_KEY =
  "gb_master_exercise_library"

function getExerciseLibrary() {
  try {
    const stored =
      localStorage.getItem(
        EXERCISE_STORAGE_KEY,
      )

    if (!stored) {
      localStorage.setItem(
        EXERCISE_STORAGE_KEY,
        JSON.stringify(
          exerciseCatalog,
        ),
      )

      return exerciseCatalog
    }

    const parsed =
      JSON.parse(stored)

    if (!Array.isArray(parsed)) {
      return exerciseCatalog
    }

    return parsed
  } catch (error) {
    console.error(
      "Unable to load exercise library:",
      error,
    )

    return exerciseCatalog
  }
}

function saveExerciseLibrary(
  exercises,
) {
  localStorage.setItem(
    EXERCISE_STORAGE_KEY,
    JSON.stringify(
      exercises,
    ),
  )

  return exercises
}

function addExercise(
  exercise,
) {
  const exercises =
    getExerciseLibrary()

  const newExercise = {
    ...exercise,
    id:
      exercise.id ||
      `custom-${Date.now()}`,
    isCustom: true,
    createdAt:
      new Date().toISOString(),
  }

  return saveExerciseLibrary([
    ...exercises,
    newExercise,
  ])
}

function updateExercise(
  exerciseId,
  changes,
) {
  const exercises =
    getExerciseLibrary()

  const updated =
    exercises.map(
      (exercise) =>
        exercise.id === exerciseId
          ? {
              ...exercise,
              ...changes,
            }
          : exercise,
    )

  return saveExerciseLibrary(
    updated,
  )
}

function deleteExercise(
  exerciseId,
) {
  const exercises =
    getExerciseLibrary()

  const exercise =
    exercises.find(
      (item) =>
        item.id === exerciseId,
    )

  if (
    !exercise ||
    !exercise.isCustom
  ) {
    return exercises
  }

  return saveExerciseLibrary(
    exercises.filter(
      (item) =>
        item.id !==
        exerciseId,
    ),
  )
}

function getExercisesByCategory(
  category,
) {
  return getExerciseLibrary().filter(
    (exercise) =>
      exercise.category ===
      category,
  )
}

function searchExercises(
  query,
) {
  const normalized =
    query
      .trim()
      .toLowerCase()

  if (!normalized) {
    return getExerciseLibrary()
  }

  return getExerciseLibrary().filter(
    (exercise) =>
      exercise.name
        .toLowerCase()
        .includes(normalized) ||
      exercise.muscleGroup
        .toLowerCase()
        .includes(normalized) ||
      exercise.subcategory
        .toLowerCase()
        .includes(normalized) ||
      exercise.equipment
        .toLowerCase()
        .includes(normalized),
  )
}

export {
  getExerciseLibrary,
  saveExerciseLibrary,
  addExercise,
  updateExercise,
  deleteExercise,
  getExercisesByCategory,
  searchExercises,
}