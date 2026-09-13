const PROGRAM_STORAGE_KEY =
  "gb_training_programs"

const defaultPrograms = [
  {
    id: "monday-lower-body",
    day: "Monday",
    workoutType: "Lower Body",
    workoutTypeKey: "lower_body",
    title: "Lower Body",
    description:
      "Lower body strength and conditioning workout.",
    exercises: [],
  },
  {
    id: "tuesday-upper-body",
    day: "Tuesday",
    workoutType: "Upper Body",
    workoutTypeKey: "upper_body",
    title: "Upper Body",
    description:
      "Upper body strength and conditioning workout.",
    exercises: [],
  },
  {
    id: "wednesday-lower-body",
    day: "Wednesday",
    workoutType: "Lower Body",
    workoutTypeKey: "lower_body",
    title: "Lower Body",
    description:
      "Lower body strength and conditioning workout.",
    exercises: [],
  },
  {
    id: "thursday-upper-body",
    day: "Thursday",
    workoutType: "Upper Body",
    workoutTypeKey: "upper_body",
    title: "Upper Body",
    description:
      "Upper body strength and conditioning workout.",
    exercises: [],
  },
  {
    id: "friday-crossfit",
    day: "Friday",
    workoutType: "CrossFit",
    workoutTypeKey: "crossfit",
    title: "CrossFit",
    description:
      "High-intensity CrossFit conditioning workout.",
    exercises: [],
  },
  {
    id: "saturday-tabata",
    day: "Saturday",
    workoutType: "Tabata",
    workoutTypeKey: "tabata",
    title: "Tabata",
    description:
      "High-intensity Tabata interval workout.",
    time: "8:00 AM - 9:00 AM",
    exercises: [],
  },
]

/*
|--------------------------------------------------------------------------
| Workout type helpers
|--------------------------------------------------------------------------
*/

function normalizeWorkoutType(
  workoutType,
) {
  if (!workoutType) {
    return ""
  }

  return String(
    workoutType,
  )
    .trim()
    .toLowerCase()
    .replace(/[-\s]+/g, "_")
}

function getWorkoutTypeLabel(
  workoutType,
) {
  const key =
    normalizeWorkoutType(
      workoutType,
    )

  const labels = {
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
    labels[key] ||
    workoutType
  )
}

/*
|--------------------------------------------------------------------------
| Normalize one program
|--------------------------------------------------------------------------
*/

function normalizeProgram(
  program,
) {
  if (!program) {
    return null
  }

  const workoutTypeKey =
    normalizeWorkoutType(
      program.workoutTypeKey ||
        program.workoutType,
    )

  const exercises =
    Array.isArray(
      program.exercises,
    )
      ? program.exercises
      : []

  return {
    ...program,

    workoutType:
      getWorkoutTypeLabel(
        workoutTypeKey,
      ),

    workoutTypeKey,

    title:
      program.title ||
      program.name ||
      getWorkoutTypeLabel(
        workoutTypeKey,
      ),

    description:
      program.description ||
      program.programDescription ||
      "",

    exercises,
  }
}

/*
|--------------------------------------------------------------------------
| Get all programs
|--------------------------------------------------------------------------
*/

function getPrograms() {
  try {
    const stored =
      localStorage.getItem(
        PROGRAM_STORAGE_KEY,
      )

    if (!stored) {
      const normalized =
        defaultPrograms.map(
          normalizeProgram,
        )

      localStorage.setItem(
        PROGRAM_STORAGE_KEY,
        JSON.stringify(
          normalized,
        ),
      )

      return normalized
    }

    const parsed =
      JSON.parse(stored)

    if (!Array.isArray(parsed)) {
      return defaultPrograms.map(
        normalizeProgram,
      )
    }

    return parsed.map(
      normalizeProgram,
    )
  } catch (error) {
    console.error(
      "Unable to load GB programs:",
      error,
    )

    return defaultPrograms.map(
      normalizeProgram,
    )
  }
}

/*
|--------------------------------------------------------------------------
| Get program by workout type
|--------------------------------------------------------------------------
*/

function getProgram(
  workoutType,
) {
  const requestedType =
    normalizeWorkoutType(
      workoutType,
    )

  if (!requestedType) {
    return null
  }

  const programs =
    getPrograms()

  return (
    programs.find(
      (program) =>
        normalizeWorkoutType(
          program.workoutTypeKey ||
            program.workoutType,
        ) === requestedType,
    ) || null
  )
}

/*
|--------------------------------------------------------------------------
| Get program by ID
|--------------------------------------------------------------------------
*/

function getProgramById(
  programId,
) {
  if (!programId) {
    return null
  }

  return (
    getPrograms().find(
      (program) =>
        program.id ===
        programId,
    ) || null
  )
}

/*
|--------------------------------------------------------------------------
| Save all programs
|--------------------------------------------------------------------------
*/

function savePrograms(
  programs,
) {
  const normalizedPrograms =
    Array.isArray(programs)
      ? programs.map(
          normalizeProgram,
        )
      : []

  localStorage.setItem(
    PROGRAM_STORAGE_KEY,
    JSON.stringify(
      normalizedPrograms,
    ),
  )

  return normalizedPrograms
}

/*
|--------------------------------------------------------------------------
| Save one program
|--------------------------------------------------------------------------
*/

function saveProgram(
  program,
) {
  if (!program) {
    return null
  }

  /*
  |----------------------------------------------------------------------
  | Support both:
  |
  | saveProgram(program)
  |
  | and the older:
  |
  | saveProgram(workoutType, program)
  |----------------------------------------------------------------------
  */

  let workoutType =
    null

  let programData =
    null

  if (
    typeof program ===
    "string"
  ) {
    workoutType =
      program

    programData =
      arguments[1]
  } else {
    programData =
      program
  }

  if (!programData) {
    return null
  }

  const normalizedType =
    normalizeWorkoutType(
      workoutType ||
        programData.workoutTypeKey ||
        programData.workoutType,
    )

  const normalizedProgram =
    normalizeProgram({
      ...programData,

      workoutTypeKey:
        normalizedType,

      workoutType:
        getWorkoutTypeLabel(
          normalizedType,
        ),

      id:
        programData.id ||
        normalizedType,

      title:
        programData.title ||
        getWorkoutTypeLabel(
          normalizedType,
        ),

      exercises:
        Array.isArray(
          programData.exercises,
        )
          ? programData.exercises
          : [],
    })

  const programs =
    getPrograms()

  const existingIndex =
    programs.findIndex(
      (item) =>
        normalizeWorkoutType(
          item.workoutTypeKey ||
            item.workoutType,
        ) === normalizedType,
    )

  let updatedPrograms

  if (
    existingIndex === -1
  ) {
    updatedPrograms = [
      ...programs,
      normalizedProgram,
    ]
  } else {
    updatedPrograms =
      programs.map(
        (item, index) =>
          index ===
          existingIndex
            ? {
                ...item,
                ...normalizedProgram,
              }
            : item,
      )
  }

  savePrograms(
    updatedPrograms,
  )

  return normalizedProgram
}

/*
|--------------------------------------------------------------------------
| Add exercise to program
|--------------------------------------------------------------------------
*/

function addExerciseToProgram(
  programId,
  exercise,
  settings = {},
) {
  const programs =
    getPrograms()

  const updatedPrograms =
    programs.map(
      (program) => {
        if (
          program.id !==
          programId
        ) {
          return program
        }

        const existingExercises =
          Array.isArray(
            program.exercises,
          )
            ? program.exercises
            : []

        const alreadyExists =
          existingExercises.some(
            (item) =>
              item.exerciseId ===
                exercise.id ||
              item.libraryId ===
                exercise.id,
          )

        if (alreadyExists) {
          return program
        }

        const programExercise = {
          id: `${exercise.id}-${Date.now()}`,

          libraryId:
            exercise.id,

          exerciseId:
            exercise.id,

          name:
            exercise.name,

          category:
            exercise.category,

          subcategory:
            exercise.subcategory,

          muscleGroup:
            exercise.muscleGroup,

          equipment:
            exercise.equipment,

          difficulty:
            exercise.difficulty,

          sets:
            settings.sets ??
            exercise.defaultSets ??
            exercise.sets ??
            3,

          reps:
            settings.reps ??
            exercise.defaultReps ??
            exercise.reps ??
            10,

          weight:
            settings.weight ??
            exercise.weight ??
            "",

          rest:
            settings.rest ??
            exercise.defaultRest ??
            exercise.rest ??
            "60 sec",

          instructions:
            settings.instructions ??
            exercise.instructions ??
            "",

          notes:
            settings.notes ??
            "",

          workInterval:
            exercise.workInterval ??
            null,

          restInterval:
            exercise.restInterval ??
            null,

          rounds:
            exercise.rounds ??
            null,
        }

        return {
          ...program,

          exercises: [
            ...existingExercises,
            programExercise,
          ],
        }
      },
    )

  return savePrograms(
    updatedPrograms,
  )
}

/*
|--------------------------------------------------------------------------
| Remove exercise from program
|--------------------------------------------------------------------------
*/

function removeExerciseFromProgram(
  programId,
  programExerciseId,
) {
  const programs =
    getPrograms()

  const updatedPrograms =
    programs.map(
      (program) => {
        if (
          program.id !==
          programId
        ) {
          return program
        }

        return {
          ...program,

          exercises:
            program.exercises.filter(
              (exercise) =>
                exercise.id !==
                  programExerciseId &&
                exercise.libraryId !==
                  programExerciseId,
            ),
        }
      },
    )

  return savePrograms(
    updatedPrograms,
  )
}

/*
|--------------------------------------------------------------------------
| Update program exercise
|--------------------------------------------------------------------------
*/

function updateProgramExercise(
  programId,
  programExerciseId,
  changes,
) {
  const programs =
    getPrograms()

  const updatedPrograms =
    programs.map(
      (program) => {
        if (
          program.id !==
          programId
        ) {
          return program
        }

        return {
          ...program,

          exercises:
            program.exercises.map(
              (exercise) =>
                exercise.id ===
                  programExerciseId ||
                exercise.libraryId ===
                  programExerciseId
                  ? {
                      ...exercise,
                      ...changes,
                    }
                  : exercise,
            ),
        }
      },
    )

  return savePrograms(
    updatedPrograms,
  )
}

/*
|--------------------------------------------------------------------------
| Reorder program exercises
|--------------------------------------------------------------------------
*/

function reorderProgramExercises(
  programId,
  exerciseIds,
) {
  const programs =
    getPrograms()

  const updatedPrograms =
    programs.map(
      (program) => {
        if (
          program.id !==
          programId
        ) {
          return program
        }

        const orderedExercises =
          exerciseIds
            .map((id) =>
              program.exercises.find(
                (exercise) =>
                  exercise.id ===
                    id ||
                  exercise.libraryId ===
                    id,
              ),
            )
            .filter(Boolean)

        return {
          ...program,

          exercises:
            orderedExercises,
        }
      },
    )

  return savePrograms(
    updatedPrograms,
  )
}

/*
|--------------------------------------------------------------------------
| Update program
|--------------------------------------------------------------------------
*/

function updateProgram(
  programId,
  changes,
) {
  const programs =
    getPrograms()

  const updatedPrograms =
    programs.map(
      (program) =>
        program.id ===
        programId
          ? normalizeProgram({
              ...program,
              ...changes,
            })
          : program,
    )

  return savePrograms(
    updatedPrograms,
  )
}

/*
|--------------------------------------------------------------------------
| Reset programs
|--------------------------------------------------------------------------
*/

function resetPrograms() {
  const normalized =
    defaultPrograms.map(
      normalizeProgram,
    )

  localStorage.setItem(
    PROGRAM_STORAGE_KEY,
    JSON.stringify(
      normalized,
    ),
  )

  return normalized
}

/*
|--------------------------------------------------------------------------
| Exports
|--------------------------------------------------------------------------
*/

export {
  getPrograms,
  getProgram,
  savePrograms,
  saveProgram,
  getProgramById,
  addExerciseToProgram,
  removeExerciseFromProgram,
  updateProgramExercise,
  reorderProgramExercises,
  updateProgram,
  resetPrograms,
}