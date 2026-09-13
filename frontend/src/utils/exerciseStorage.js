const EXERCISE_STORAGE_KEY =
  "gb_trainer_exercises"

const defaultExercises = [
  {
    id: 101,
    name: "Barbell Squat",
    category: "lower_body",
    sets: 4,
    reps: 10,
    weight: "40 kg",
    rest: "90 sec",
    instructions:
      "Keep your chest up, brace your core and lower under control.",
    createdAt: new Date().toISOString(),
  },

  {
    id: 102,
    name: "Romanian Deadlift",
    category: "lower_body",
    sets: 3,
    reps: 10,
    weight: "30 kg",
    rest: "90 sec",
    instructions:
      "Keep your back neutral and push your hips backwards during the movement.",
    createdAt: new Date().toISOString(),
  },

  {
    id: 103,
    name: "Walking Lunges",
    category: "lower_body",
    sets: 3,
    reps: 12,
    weight: "10 kg",
    rest: "60 sec",
    instructions:
      "Take controlled steps and keep your front knee aligned with your foot.",
    createdAt: new Date().toISOString(),
  },

  {
    id: 201,
    name: "Barbell Bench Press",
    category: "upper_body",
    sets: 4,
    reps: 10,
    weight: "40 kg",
    rest: "90 sec",
    instructions:
      "Keep your shoulder blades stable and lower the bar with control.",
    createdAt: new Date().toISOString(),
  },

  {
    id: 202,
    name: "Lat Pulldown",
    category: "upper_body",
    sets: 3,
    reps: 12,
    weight: "35 kg",
    rest: "60 sec",
    instructions:
      "Pull the bar toward your upper chest while keeping your torso controlled.",
    createdAt: new Date().toISOString(),
  },

  {
    id: 203,
    name: "Shoulder Press",
    category: "upper_body",
    sets: 3,
    reps: 10,
    weight: "15 kg",
    rest: "60 sec",
    instructions:
      "Press upward without locking your elbows aggressively.",
    createdAt: new Date().toISOString(),
  },

  {
    id: 301,
    name: "Air Squats",
    category: "crossfit",
    sets: 3,
    reps: 20,
    weight: "Bodyweight",
    rest: "45 sec",
    instructions:
      "Perform controlled squats while maintaining good posture.",
    createdAt: new Date().toISOString(),
  },

  {
    id: 302,
    name: "Push Ups",
    category: "crossfit",
    sets: 3,
    reps: 15,
    weight: "Bodyweight",
    rest: "45 sec",
    instructions:
      "Keep your body straight and lower your chest toward the floor.",
    createdAt: new Date().toISOString(),
  },

  {
    id: 303,
    name: "Kettlebell Swings",
    category: "crossfit",
    sets: 3,
    reps: 15,
    weight: "12 kg",
    rest: "60 sec",
    instructions:
      "Drive the movement from your hips rather than lifting with your arms.",
    createdAt: new Date().toISOString(),
  },

  {
    id: 401,
    name: "Jumping Jacks",
    category: "tabata",
    sets: 4,
    reps: 20,
    weight: "Bodyweight",
    rest: "20 sec",
    instructions:
      "Maintain a steady rhythm throughout the interval.",
    createdAt: new Date().toISOString(),
  },

  {
    id: 402,
    name: "High Knees",
    category: "tabata",
    sets: 4,
    reps: 20,
    weight: "Bodyweight",
    rest: "20 sec",
    instructions:
      "Drive your knees upward while maintaining a fast controlled pace.",
    createdAt: new Date().toISOString(),
  },
]

function getExercises() {
  try {
    const stored =
      localStorage.getItem(
        EXERCISE_STORAGE_KEY,
      )

    if (!stored) {
      return defaultExercises
    }

    const parsed =
      JSON.parse(stored)

    if (!Array.isArray(parsed)) {
      return defaultExercises
    }

    return parsed
  } catch (error) {
    console.error(
      "Unable to load exercises:",
      error,
    )

    return defaultExercises
  }
}

function saveExercises(
  exercises,
) {
  localStorage.setItem(
    EXERCISE_STORAGE_KEY,
    JSON.stringify(exercises),
  )

  return exercises
}

function createExercise(
  exercise,
) {
  const exercises =
    getExercises()

  const newExercise = {
    ...exercise,
    id: Date.now(),
    createdAt:
      new Date().toISOString(),
  }

  return saveExercises([
    ...exercises,
    newExercise,
  ])
}

function updateExercise(
  exerciseId,
  changes,
) {
  const exercises =
    getExercises()

  const updated =
    exercises.map((exercise) =>
      exercise.id === exerciseId
        ? {
            ...exercise,
            ...changes,
          }
        : exercise,
    )

  return saveExercises(
    updated,
  )
}

function deleteExercise(
  exerciseId,
) {
  const exercises =
    getExercises()

  const updated =
    exercises.filter(
      (exercise) =>
        exercise.id !==
        exerciseId,
    )

  return saveExercises(
    updated,
  )
}

function getExercisesByCategory(
  category,
) {
  return getExercises().filter(
    (exercise) =>
      exercise.category ===
      category,
  )
}

export {
  getExercises,
  saveExercises,
  createExercise,
  updateExercise,
  deleteExercise,
  getExercisesByCategory,
}