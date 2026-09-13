import {
  useEffect,
  useMemo,
  useState,
} from "react"

import {
  useLocation,
  useNavigate,
} from "react-router-dom"

import {
  useGym,
} from "../../context/GymContext.jsx"

import {
  createExercise,
  createProgram,
  deleteExercise,
  getExercises,
  updateExercise,
} from "../../api/api.js"

const CATEGORY_OPTIONS = [
  "Upper Body",
  "Lower Body",
  "CrossFit",
  "Tabata",
]

const DIFFICULTY_OPTIONS = [
  "Beginner",
  "Intermediate",
  "Advanced",
]

const EMPTY_FORM = {
  name: "",
  category: "Upper Body",
  muscleGroup: "",
  secondaryMuscles: "",
  targetGender: ["Male", "Female"],
  fitnessGoals: ["Keep Fit"],
  description: "",
  instructions: "",
  safetyTips: "",
  equipment: "",
  difficulty: "Beginner",
  defaultSets: 3,
  defaultReps: "",
  defaultDuration: "",
  defaultRest: 60,
  caloriesEstimate: "",
  imageUrl: "",
  videoUrl: "",
}

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

function normalizeArray(value) {
  if (Array.isArray(value)) {
    return value
      .map((item) =>
        String(item).trim(),
      )
      .filter(Boolean)
  }

  if (!value) {
    return []
  }

  return String(value)
    .split(",")
    .map((item) =>
      item.trim(),
    )
    .filter(Boolean)
}

function exerciseToForm(
  exercise,
) {
  return {
    name:
      exercise.name || "",

    category:
      exercise.category ||
      "Upper Body",

    muscleGroup:
      exercise.muscleGroup ||
      "",

    secondaryMuscles:
      Array.isArray(exercise.secondaryMuscles)
        ? exercise.secondaryMuscles.join(", ")
        : "",

    targetGender:
      Array.isArray(exercise.targetGender) &&
      exercise.targetGender.length
        ? exercise.targetGender
        : ["Male", "Female"],

    fitnessGoals:
      Array.isArray(exercise.fitnessGoals)
        ? exercise.fitnessGoals
        : [],

    description:
      exercise.description ||
      "",

    instructions:
      Array.isArray(
        exercise.instructions,
      )
        ? exercise.instructions.join(
            "\n",
          )
        : exercise.instructions || "",

    safetyTips:
      Array.isArray(
        exercise.safetyTips,
      )
        ? exercise.safetyTips.join(
            "\n",
          )
        : exercise.safetyTips || "",

    equipment:
      Array.isArray(
        exercise.equipment,
      )
        ? exercise.equipment.join(
            ", ",
          )
        : "",

    difficulty:
      exercise.difficulty ||
      "Beginner",

    defaultSets:
      exercise.defaultSets ??
      3,

    defaultReps:
      exercise.defaultReps ??
      "",

    defaultDuration:
      exercise.defaultDuration ??
      "",

    defaultRest:
      exercise.defaultRest ??
      60,

    caloriesEstimate:
      exercise.caloriesEstimate ??
      "",

    imageUrl:
      exercise.imageUrl || "",

    videoUrl:
      exercise.videoUrl || "",
  }
}

function buildPayload(
  form,
) {
  return {
    name:
      form.name.trim(),

    category:
      form.category,

    muscleGroup:
      form.muscleGroup.trim(),

    secondaryMuscles:
      normalizeArray(
        form.secondaryMuscles,
      ),

    targetGender:
      Array.isArray(form.targetGender)
        ? form.targetGender
        : ["Male", "Female"],

    fitnessGoals:
      Array.isArray(form.fitnessGoals)
        ? form.fitnessGoals
        : [],

    description:
      form.description.trim(),

    instructions:
      normalizeInstructions(
        form.instructions,
      ),

    safetyTips:
      normalizeInstructions(
        form.safetyTips,
      ),

    equipment:
      normalizeArray(
        form.equipment,
      ),

    difficulty:
      form.difficulty,

    defaultSets:
      Number(
        form.defaultSets,
      ) || 3,

    defaultReps:
      form.defaultReps ===
        "" ||
      form.defaultReps ===
        null
        ? null
        : Number(
            form.defaultReps,
          ),

    defaultDuration:
      form.defaultDuration ===
        "" ||
      form.defaultDuration ===
        null
        ? null
        : Number(
            form.defaultDuration,
          ),

    defaultRest:
      Number(
        form.defaultRest,
      ) || 0,

    caloriesEstimate:
      form.caloriesEstimate ===
        "" ||
      form.caloriesEstimate ===
        null
        ? null
        : Number(
            form.caloriesEstimate,
          ),
  }
}

function normalizeInstructions(
  value,
) {
  if (Array.isArray(value)) {
    return value
      .map((item) =>
        String(item).trim(),
      )
      .filter(Boolean)
  }

  if (!value) {
    return []
  }

  return String(value)
    .split("\n")
    .map((item) =>
      item.trim(),
    )
    .filter(Boolean)
}

/*
|--------------------------------------------------------------------------
| File size formatting
|--------------------------------------------------------------------------
*/

function formatFileSize(
  bytes,
) {
  if (!bytes) {
    return "0 KB"
  }

  const megabytes =
    bytes /
    1024 /
    1024

  if (
    megabytes >= 1
  ) {
    return `${megabytes.toFixed(
      1,
    )} MB`
  }

  return `${Math.max(
    1,
    Math.round(
      bytes / 1024,
    ),
  )} KB`
}

/*
|--------------------------------------------------------------------------
| Main component
|--------------------------------------------------------------------------
*/

export default function Exercises() {
  const navigate = useNavigate()
  const location = useLocation()

  const {
    gym,
  } = useGym() || {}

  const gymName =
    gym?.name?.trim() ||
    "Gym"

  const [
    exercises,
    setExercises,
  ] = useState([])

  const [
    loading,
    setLoading,
  ] = useState(true)

  const [
    saving,
    setSaving,
  ] = useState(false)

  const [
    error,
    setError,
  ] = useState("")

  const [
    success,
    setSuccess,
  ] = useState("")

  const [
    search,
    setSearch,
  ] = useState("")

  const [
    categoryFilter,
    setCategoryFilter,
  ] = useState("All")

  const [
    difficultyFilter,
    setDifficultyFilter,
  ] = useState("All")

  const [
    showForm,
    setShowForm,
  ] = useState(false)

  const [
    editingExercise,
    setEditingExercise,
  ] = useState(null)

  const [
    deleteConfirmExercise,
    setDeleteConfirmExercise,
  ] = useState(null)

  /*
  |--------------------------------------------------------------------------
  | Program creation mode
  |--------------------------------------------------------------------------
  */

  const createProgramMode =
    Boolean(
      location.state?.createProgram,
    )

  const [
    selectedProgramExercises,
    setSelectedProgramExercises,
  ] = useState([])

  const [
    showProgramForm,
    setShowProgramForm,
  ] = useState(false)

  const [
    programName,
    setProgramName,
  ] = useState("")

  const [
    programWorkoutType,
    setProgramWorkoutType,
  ] = useState("Lower Body")

  const [
    creatingProgram,
    setCreatingProgram,
  ] = useState(false)

  const [
    programError,
    setProgramError,
  ] = useState("")

  const [
    form,
    setForm,
  ] = useState(
    EMPTY_FORM,
  )

  /*
  |--------------------------------------------------------------------------
  | Uploaded files
  |--------------------------------------------------------------------------
  */

  const [
    imageFile,
    setImageFile,
  ] = useState(null)

  const [
    videoFile,
    setVideoFile,
  ] = useState(null)

  /*
  |--------------------------------------------------------------------------
  | Local previews
  |--------------------------------------------------------------------------
  */

  const [
    imagePreview,
    setImagePreview,
  ] = useState("")

  const [
    videoPreview,
    setVideoPreview,
  ] = useState("")

  /*
  |--------------------------------------------------------------------------
  | Media tab
  |--------------------------------------------------------------------------
  */

  const [
    mediaTab,
    setMediaTab,
  ] = useState("image")

  /*
  |--------------------------------------------------------------------------
  | Load exercises
  |--------------------------------------------------------------------------
  */

  const loadExercises =
    async () => {
      try {
        setLoading(true)
        setError("")

        const response =
          await getExercises({
            active: true,
          })

        setExercises(
          Array.isArray(
            response?.exercises,
          )
            ? response.exercises
            : [],
        )
      } catch (
        loadError
      ) {
        console.error(
          "Unable to load exercises:",
          loadError,
        )

        setError(
          loadError.response
            ?.data?.message ||
            loadError.message ||
            "Unable to load exercises.",
        )
      } finally {
        setLoading(false)
      }
    }

  useEffect(() => {
    loadExercises()
  }, [])

  /*
  |--------------------------------------------------------------------------
  | Create local image preview
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (!imageFile) {
      setImagePreview(
        form.imageUrl ||
          "",
      )

      return undefined
    }

    const previewUrl =
      URL.createObjectURL(
        imageFile,
      )

    setImagePreview(
      previewUrl,
    )

    return () => {
      URL.revokeObjectURL(
        previewUrl,
      )
    }
  }, [
    imageFile,
    form.imageUrl,
  ])

  /*
  |--------------------------------------------------------------------------
  | Create local video preview
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (!videoFile) {
      setVideoPreview(
        form.videoUrl ||
          "",
      )

      return undefined
    }

    const previewUrl =
      URL.createObjectURL(
        videoFile,
      )

    setVideoPreview(
      previewUrl,
    )

    return () => {
      URL.revokeObjectURL(
        previewUrl,
      )
    }
  }, [
    videoFile,
    form.videoUrl,
  ])

  /*
  |--------------------------------------------------------------------------
  | Filter exercises
  |--------------------------------------------------------------------------
  */

  const filteredExercises =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase()

      return exercises.filter(
        (exercise) => {
          const matchesSearch =
            !query ||
            exercise.name
              ?.toLowerCase()
              .includes(query) ||
            exercise.muscleGroup
              ?.toLowerCase()
              .includes(query) ||
            exercise.description
              ?.toLowerCase()
              .includes(query)

          const matchesCategory =
            categoryFilter ===
              "All" ||
            exercise.category ===
              categoryFilter

          const matchesDifficulty =
            difficultyFilter ===
              "All" ||
            exercise.difficulty ===
              difficultyFilter

          return (
            matchesSearch &&
            matchesCategory &&
            matchesDifficulty
          )
        },
      )
    }, [
      exercises,
      search,
      categoryFilter,
      difficultyFilter,
    ])

  /*
  |--------------------------------------------------------------------------
  | Open create form
  |--------------------------------------------------------------------------
  */

  const openCreateForm =
    () => {
      setEditingExercise(
        null,
      )

      setForm({
        ...EMPTY_FORM,
      })

      setImageFile(null)
      setVideoFile(null)

      setImagePreview("")
      setVideoPreview("")

      setMediaTab("image")

      setError("")
      setSuccess("")

      setShowForm(true)
    }

  /*
  |--------------------------------------------------------------------------
  | Open edit form
  |--------------------------------------------------------------------------
  */

  const openEditForm =
    (exercise) => {
      setEditingExercise(
        exercise,
      )

      setForm(
        exerciseToForm(
          exercise,
        ),
      )

      setImageFile(null)
      setVideoFile(null)

      setImagePreview(
        exercise.imageUrl ||
          "",
      )

      setVideoPreview(
        exercise.videoUrl ||
          "",
      )

      setMediaTab(
        exercise.imageUrl
          ? "image"
          : "video",
      )

      setError("")
      setSuccess("")

      setShowForm(true)
    }

  /*
  |--------------------------------------------------------------------------
  | Close form
  |--------------------------------------------------------------------------
  */

  const closeForm =
    () => {
      if (saving) {
        return
      }

      setShowForm(false)

      setEditingExercise(
        null,
      )

      setForm({
        ...EMPTY_FORM,
      })

      setImageFile(null)
      setVideoFile(null)

      setImagePreview("")
      setVideoPreview("")
    }

  /*
  |--------------------------------------------------------------------------
  | Handle normal fields
  |--------------------------------------------------------------------------
  */

  const handleChange =
    (event) => {
      const {
        name,
        value,
      } = event.target

      setForm(
        (current) => ({
          ...current,
          [name]: value,
        }),
      )
    }

  /*
  |--------------------------------------------------------------------------
  | Image selection
  |--------------------------------------------------------------------------
  */

  const handleImageChange =
    (event) => {
      const file =
        event.target
          .files?.[0]

      if (!file) {
        return
      }

      const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/gif",
      ]

      if (
        !allowedTypes.includes(
          file.type,
        )
      ) {
        setError(
          "Please select a JPG, PNG, WEBP or GIF image.",
        )

        event.target.value =
          ""

        return
      }

      const maxSize =
        10 *
        1024 *
        1024

      if (
        file.size >
        maxSize
      ) {
        setError(
          "Image must be 10 MB or smaller.",
        )

        event.target.value =
          ""

        return
      }

      setError("")

      setImageFile(
        file,
      )

      setMediaTab(
        "image",
      )
    }

  /*
  |--------------------------------------------------------------------------
  | Video selection
  |--------------------------------------------------------------------------
  */

  const handleVideoChange =
    (event) => {
      const file =
        event.target
          .files?.[0]

      if (!file) {
        return
      }

      const allowedTypes = [
        "video/mp4",
        "video/webm",
        "video/quicktime",
        "video/x-msvideo",
      ]

      if (
        !allowedTypes.includes(
          file.type,
        )
      ) {
        setError(
          "Please select an MP4, WEBM, MOV or AVI video.",
        )

        event.target.value =
          ""

        return
      }

      const maxSize =
        100 *
        1024 *
        1024

      if (
        file.size >
        maxSize
      ) {
        setError(
          "Video must be 100 MB or smaller.",
        )

        event.target.value =
          ""

        return
      }

      setError("")

      setVideoFile(
        file,
      )

      setMediaTab(
        "video",
      )
    }

  /*
  |--------------------------------------------------------------------------
  | Submit exercise
  |--------------------------------------------------------------------------
  */

  const handleSubmit =
    async (event) => {
      event.preventDefault()

      setError("")
      setSuccess("")

      if (
        !form.name.trim()
      ) {
        setError(
          "Exercise name is required.",
        )

        return
      }

      if (
        !form.category
      ) {
        setError(
          "Exercise category is required.",
        )

        return
      }

      try {
        setSaving(true)

        const payload =
          buildPayload(
            form,
          )

        /*
        |--------------------------------------------------------------------------
        | Build multipart form
        |--------------------------------------------------------------------------
        */

        const formData =
          new FormData()

        formData.append(
          "name",
          payload.name,
        )

        formData.append(
          "category",
          payload.category,
        )

        formData.append(
          "muscleGroup",
          payload.muscleGroup,
        )

        formData.append(
          "secondaryMuscles",
          JSON.stringify(
            payload.secondaryMuscles,
          ),
        )

        formData.append(
          "targetGender",
          JSON.stringify(
            payload.targetGender,
          ),
        )

        formData.append(
          "fitnessGoals",
          JSON.stringify(
            payload.fitnessGoals,
          ),
        )

        formData.append(
          "description",
          payload.description,
        )

        formData.append(
          "difficulty",
          payload.difficulty,
        )

        formData.append(
          "defaultSets",
          String(
            payload.defaultSets,
          ),
        )

        if (
          payload.defaultReps !==
          null
        ) {
          formData.append(
            "defaultReps",
            String(
              payload.defaultReps,
            ),
          )
        }

        if (
          payload.defaultDuration !==
          null
        ) {
          formData.append(
            "defaultDuration",
            String(
              payload.defaultDuration,
            ),
          )
        }

        formData.append(
          "defaultRest",
          String(
            payload.defaultRest,
          ),
        )

        if (
          payload.caloriesEstimate !==
          null
        ) {
          formData.append(
            "caloriesEstimate",
            String(
              payload.caloriesEstimate,
            ),
          )
        }

        /*
        |--------------------------------------------------------------------------
        | Instructions
        |--------------------------------------------------------------------------
        |
        | Backend accepts newline-separated instructions.
        |
        */

        formData.append(
          "instructions",
          payload.instructions.join(
            "\n",
          ),
        )

        formData.append(
          "safetyTips",
          payload.safetyTips.join(
            "\n",
          ),
        )

        /*
        |--------------------------------------------------------------------------
        | Equipment
        |--------------------------------------------------------------------------
        */

        formData.append(
          "equipment",
          payload.equipment.join(
            ", ",
          ),
        )

        /*
        |--------------------------------------------------------------------------
        | Image file
        |--------------------------------------------------------------------------
        */

        if (
          imageFile
        ) {
          formData.append(
            "image",
            imageFile,
          )
        }

        /*
        |--------------------------------------------------------------------------
        | Video file
        |--------------------------------------------------------------------------
        */

        if (
          videoFile
        ) {
          formData.append(
            "video",
            videoFile,
          )
        }

        /*
        |--------------------------------------------------------------------------
        | Save
        |--------------------------------------------------------------------------
        */

        if (
          editingExercise
        ) {
          const response =
            await updateExercise(
              editingExercise._id,
              formData,
            )

          const updatedExercise =
            response?.exercise

          if (
            updatedExercise
          ) {
            setExercises(
              (current) =>
                current.map(
                  (exercise) =>
                    exercise._id ===
                    updatedExercise._id
                      ? updatedExercise
                      : exercise,
                ),
            )
          }

          setSuccess(
            "Exercise updated successfully.",
          )
        } else {
          const response =
            await createExercise(
              formData,
            )

          const createdExercise =
            response?.exercise

          if (
            createdExercise
          ) {
            setExercises(
              (current) => [
                createdExercise,
                ...current,
              ],
            )
          }

          setSuccess(
            "Exercise created successfully.",
          )
        }

        setShowForm(false)

        setEditingExercise(
          null,
        )

        setForm({
          ...EMPTY_FORM,
        })

        setImageFile(null)
        setVideoFile(null)

        setImagePreview("")
        setVideoPreview("")
      } catch (
        saveError
      ) {
        console.error(
          "Unable to save exercise:",
          saveError,
        )

        setError(
          saveError.response
            ?.data?.message ||
            saveError.message ||
            "Unable to save exercise.",
        )
      } finally {
        setSaving(false)
      }
    }

  /*
  |--------------------------------------------------------------------------
  | Program creation workflow
  |--------------------------------------------------------------------------
  */

  const toggleProgramExercise =
    (exercise) => {
      const exerciseId =
        String(exercise?._id || "")

      if (!exerciseId) {
        return
      }

      setProgramError("")

      setSelectedProgramExercises(
        (current) => {
          const exists = current.some(
            (id) => String(id) === exerciseId,
          )

          if (exists) {
            return current.filter(
              (id) =>
                String(id) !== exerciseId,
            )
          }

          return [
            ...current,
            exerciseId,
          ]
        },
      )
    }

  const openProgramForm =
    () => {
      if (
        selectedProgramExercises.length ===
        0
      ) {
        setProgramError(
          "Select at least one exercise to create the program.",
        )
        return
      }

      setProgramError("")
      setShowProgramForm(true)
    }

  const closeProgramForm =
    () => {
      if (creatingProgram) {
        return
      }

      setShowProgramForm(false)
    }

  const handleCreateProgram =
    async () => {
      if (!programName.trim()) {
        setProgramError(
          "Program name is required.",
        )
        return
      }

      if (
        selectedProgramExercises.length ===
        0
      ) {
        setProgramError(
          "Select at least one exercise to create the program.",
        )
        return
      }

      try {
        setCreatingProgram(true)
        setProgramError("")

        const selectedExercises =
          selectedProgramExercises
            .map((id) =>
              exercises.find(
                (exercise) =>
                  String(exercise._id) ===
                  String(id),
              ),
            )
            .filter(Boolean)

        if (
          selectedExercises.length === 0
        ) {
          throw new Error(
            "The selected exercises could not be found.",
          )
        }

        const response =
          await createProgram({
            name: programName.trim(),
            description: `${programWorkoutType} training program.`,
            workoutType: programWorkoutType,
            exercises: selectedExercises.map(
              (exercise, index) => ({
                exercise: exercise._id,
                order: index + 1,
                sets: Number(
                  exercise.defaultSets,
                ) || 3,
                reps:
                  exercise.defaultReps ===
                    null ||
                  exercise.defaultReps ===
                    undefined ||
                  exercise.defaultReps ===
                    ""
                    ? null
                    : Number(
                        exercise.defaultReps,
                      ),
                duration:
                  exercise.defaultDuration ===
                    null ||
                  exercise.defaultDuration ===
                    undefined ||
                  exercise.defaultDuration ===
                    ""
                    ? null
                    : Number(
                        exercise.defaultDuration,
                      ),
                rest:
                  Number(
                    exercise.defaultRest,
                  ) || 0,
                notes: "",
              }),
            ),
            isActive: true,
          })

        const createdProgram =
          response?.program

        if (!createdProgram?._id) {
          throw new Error(
            response?.message ||
              "The program could not be created.",
          )
        }

        setShowProgramForm(false)
        setSelectedProgramExercises([])
        setProgramName("")
        setProgramWorkoutType(
          "Lower Body",
        )

        navigate(
          "/admin/programs",
          {
            replace: true,
            state: {
              createdProgramId:
                createdProgram._id,
            },
          },
        )
      } catch (error) {
        console.error(
          "Create program error:",
          error,
        )

        setProgramError(
          error.response?.data
            ?.message ||
            error.message ||
            "Unable to create workout program.",
        )
      } finally {
        setCreatingProgram(false)
      }
    }

  /*
  |--------------------------------------------------------------------------
  | Deactivate exercise
  |--------------------------------------------------------------------------
  */

  const handleDeactivate =
    (exercise) => {
      setError("")
      setSuccess("")
      setDeleteConfirmExercise(exercise)
    }

  const confirmDeactivate =
    async () => {
      if (!deleteConfirmExercise?._id) {
        return
      }

      const exercise =
        deleteConfirmExercise

      try {
        setDeleteConfirmExercise(null)
        setError("")
        setSuccess("")

        await deleteExercise(
          exercise._id,
        )

        setExercises(
          (current) =>
            current.filter(
              (item) =>
                item._id !==
                exercise._id,
            ),
        )

        setSuccess(
          "Exercise removed successfully.",
        )
      } catch (
        deleteError
      ) {
        console.error(
          "Unable to remove exercise:",
          deleteError,
        )

        setError(
          deleteError.response
            ?.data?.message ||
            deleteError.message ||
            "Unable to remove exercise.",
        )
      }
    }

  /*
  |--------------------------------------------------------------------------
  | Render
  |--------------------------------------------------------------------------
  */

  return (
    <div className="min-h-screen bg-black px-4 py-6 text-white sm:px-6 lg:px-8">

      <div className="mx-auto max-w-7xl">

        {/* ================================================================ */}
        {/* HEADER                                                           */}
        {/* ================================================================ */}

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

          <div>

            <p className="text-xs font-bold uppercase tracking-[0.2em] text-lime-400">
              {gymName} Admin
            </p>

            <h1 className="mt-1 text-3xl font-black tracking-tight">
              Exercise Library
            </h1>

            <p className="mt-1 text-sm text-slate-400">
              Manage exercises available
              for {gymName} workout programs.
            </p>

          </div>

          <button
            type="button"
            onClick={
              openCreateForm
            }
            className="rounded-xl bg-yellow-400 px-5 py-3 text-sm font-bold text-black transition hover:bg-yellow-300"
          >
            + Add Exercise
          </button>

        </div>

        {createProgramMode && (
          <div className="mt-6 rounded-2xl border border-lime-400/20 bg-lime-400/10 p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-wider text-lime-400">
                  Create Workout Program
                </p>
                <p className="mt-1 text-sm text-gray-300">
                  Select the exercises you want to include, then continue to create the program.
                </p>
                <p className="mt-2 text-xs font-bold text-lime-300">
                  {selectedProgramExercises.length} exercise{selectedProgramExercises.length === 1 ? "" : "s"} selected
                </p>
              </div>

              <button
                type="button"
                onClick={openProgramForm}
                disabled={selectedProgramExercises.length === 0}
                className="rounded-xl bg-lime-400 px-5 py-3 text-sm font-black text-black disabled:cursor-not-allowed disabled:opacity-40"
              >
                CONTINUE TO PROGRAM
              </button>
            </div>

            {programError && (
              <p className="mt-3 text-sm font-bold text-red-300">
                {programError}
              </p>
            )}
          </div>
        )}

        {/* ================================================================ */}
        {/* MESSAGES                                                         */}
        {/* ================================================================ */}

        {error && (
          <div className="mt-5 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {success && (
          <div className="mt-5 rounded-xl border border-lime-400/20 bg-lime-400/10 px-4 py-3 text-sm text-lime-300">
            {success}
          </div>
        )}

        {/* ================================================================ */}
        {/* FILTERS                                                          */}
        {/* ================================================================ */}

        <div className="mt-6 grid gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 md:grid-cols-4">

          <input
            type="text"
            value={search}
            onChange={(
              event,
            ) =>
              setSearch(
                event.target.value,
              )
            }
            placeholder="Search exercises..."
            className="rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-lime-400/50"
          />

          <select
            value={
              categoryFilter
            }
            onChange={(
              event,
            ) =>
              setCategoryFilter(
                event.target.value,
              )
            }
            className="rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none focus:border-lime-400/50"
          >
            <option value="All">
              All Categories
            </option>

            {CATEGORY_OPTIONS.map(
              (
                category,
              ) => (
                <option
                  key={
                    category
                  }
                  value={
                    category
                  }
                >
                  {category}
                </option>
              ),
            )}

          </select>

          <select
            value={
              difficultyFilter
            }
            onChange={(
              event,
            ) =>
              setDifficultyFilter(
                event.target.value,
              )
            }
            className="rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none focus:border-lime-400/50"
          >
            <option value="All">
              All Difficulties
            </option>

            {DIFFICULTY_OPTIONS.map(
              (
                difficulty,
              ) => (
                <option
                  key={
                    difficulty
                  }
                  value={
                    difficulty
                  }
                >
                  {difficulty}
                </option>
              ),
            )}

          </select>

          <div className="flex items-center rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-slate-400">
            {filteredExercises.length}{" "}
            exercise
            {filteredExercises.length ===
            1
              ? ""
              : "s"}
          </div>

        </div>

        {/* ================================================================ */}
        {/* EXERCISE LIST                                                    */}
        {/* ================================================================ */}

        <div className="mt-6">

          {loading ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-10 text-center text-sm text-slate-400">
              Loading exercises...
            </div>
          ) : filteredExercises.length ===
            0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] p-10 text-center">

              <h2 className="text-lg font-bold text-white">
                No exercises found
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Add an exercise to
                start building your
                workout programs.
              </p>

              <button
                type="button"
                onClick={
                  openCreateForm
                }
                className="mt-5 rounded-xl bg-yellow-400 px-5 py-3 text-sm font-bold text-black"
              >
                Add Exercise
              </button>

            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">

              {filteredExercises.map(
                (
                  exercise,
                ) => (
                  <div
                    key={
                      exercise._id
                    }
                    className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]"
                  >

                    {/* ---------------------------------------------------- */}
                    {/* Exercise image                                       */}
                    {/* ---------------------------------------------------- */}

                    {exercise.imageUrl ? (
                      <img
                        src={
                          exercise.imageUrl
                        }
                        alt={
                          exercise.name
                        }
                        className="h-56 w-full bg-black object-contain"
                      />
                    ) : (
                      <div className="flex h-56 items-center justify-center bg-slate-900 text-4xl font-black text-slate-700">
                        {exercise.name
                          ?.charAt(
                            0,
                          )
                          ?.toUpperCase() ||
                          "E"}
                      </div>
                    )}

                    <div className="p-5">

                      <div className="flex items-start justify-between gap-3">

                        <div>

                          <h2 className="font-bold text-white">
                            {
                              exercise.name
                            }
                          </h2>

                          <p className="mt-1 text-xs text-slate-500">
                            {
                              exercise.muscleGroup
                            }
                          </p>

                        </div>

                        <span className="rounded-full bg-lime-400/10 px-2.5 py-1 text-[10px] font-bold uppercase text-lime-300">
                          {
                            exercise.difficulty
                          }
                        </span>

                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-2">
                        <div className="rounded-lg bg-white/5 p-3">
                          <p className="text-[10px] font-bold uppercase text-slate-500">Sets</p>
                          <p className="mt-1 text-sm font-bold text-white">{exercise.defaultSets ?? 3}</p>
                        </div>

                        <div className="rounded-lg bg-white/5 p-3">
                          <p className="text-[10px] font-bold uppercase text-slate-500">Reps</p>
                          <p className="mt-1 text-sm font-bold text-white">{exercise.defaultReps || "—"}</p>
                        </div>

                        <div className="rounded-lg bg-white/5 p-3">
                          <p className="text-[10px] font-bold uppercase text-slate-500">Duration</p>
                          <p className="mt-1 text-sm font-bold text-white">
                            {exercise.defaultDuration ? `${exercise.defaultDuration} sec` : "—"}
                          </p>
                        </div>

                        <div className="rounded-lg bg-white/5 p-3">
                          <p className="text-[10px] font-bold uppercase text-slate-500">Rest</p>
                          <p className="mt-1 text-sm font-bold text-white">
                            {exercise.defaultRest != null ? `${exercise.defaultRest} sec` : "—"}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 space-y-3 text-sm">
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Secondary Muscles</p>
                          <p className="mt-1 text-slate-300">
                            {Array.isArray(exercise.secondaryMuscles) && exercise.secondaryMuscles.length
                              ? exercise.secondaryMuscles.join(", ")
                              : "None specified"}
                          </p>
                        </div>

                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Equipment</p>
                          <p className="mt-1 text-slate-300">
                            {Array.isArray(exercise.equipment)
                              ? exercise.equipment.join(", ")
                              : exercise.equipment || "No equipment"}
                          </p>
                        </div>

                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Recommended For</p>
                          <p className="mt-1 text-slate-300">
                            {Array.isArray(exercise.targetGender) && exercise.targetGender.length
                              ? exercise.targetGender.join(", ")
                              : "Male, Female"}
                          </p>
                        </div>

                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Fitness Goals</p>
                          <p className="mt-1 text-slate-300">
                            {Array.isArray(exercise.fitnessGoals) && exercise.fitnessGoals.length
                              ? exercise.fitnessGoals.join(", ")
                              : "Not specified"}
                          </p>
                        </div>

                        {exercise.caloriesEstimate != null && exercise.caloriesEstimate !== "" && (
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Calories Estimate</p>
                            <p className="mt-1 text-slate-300">{exercise.caloriesEstimate} kcal</p>
                          </div>
                        )}
                      </div>

                      {exercise.description && (
                        <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] p-4">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Description</p>
                          <p className="mt-2 text-sm leading-6 text-slate-300">
                            {exercise.description}
                          </p>
                        </div>
                      )}

                      {Array.isArray(exercise.instructions) && exercise.instructions.length > 0 && (
                        <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] p-4">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Instructions</p>
                          <ol className="mt-2 space-y-2 text-sm leading-6 text-slate-300">
                            {exercise.instructions.map((instruction, index) => (
                              <li key={`${exercise._id}-instruction-${index}`}>
                                <span className="font-bold text-lime-400">{index + 1}.</span>{" "}
                                {instruction}
                              </li>
                            ))}
                          </ol>
                        </div>
                      )}

                      {Array.isArray(exercise.safetyTips) && exercise.safetyTips.length > 0 && (
                        <div className="mt-4 rounded-xl border border-yellow-400/10 bg-yellow-400/[0.03] p-4">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-yellow-400">Safety Tips</p>
                          <ul className="mt-2 space-y-2 text-sm leading-6 text-slate-300">
                            {exercise.safetyTips.map((tip, index) => (
                              <li key={`${exercise._id}-safety-${index}`}>
                                • {tip}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {exercise.videoUrl && (
                        <div className="mt-4 overflow-hidden rounded-xl border border-white/10 bg-black">
                          <video
                            src={exercise.videoUrl}
                            controls
                            preload="metadata"
                            className="max-h-52 w-full"
                          />
                        </div>
                      )}

                      <div className="mt-5 flex gap-2">

                        {createProgramMode && (
                          <button
                            type="button"
                            onClick={() =>
                              toggleProgramExercise(
                                exercise,
                              )
                            }
                            className={`flex-1 rounded-xl px-3 py-2.5 text-sm font-bold transition ${
                              selectedProgramExercises.some(
                                (id) =>
                                  String(id) ===
                                  String(exercise._id),
                              )
                                ? "bg-lime-400 text-black"
                                : "border border-lime-400/30 text-lime-300 hover:bg-lime-400/10"
                            }`}
                          >
                            {selectedProgramExercises.some(
                              (id) =>
                                String(id) ===
                                String(exercise._id),
                            )
                              ? "SELECTED"
                              : "SELECT"}
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() =>
                            openEditForm(
                              exercise,
                            )
                          }
                          className="flex-1 rounded-xl border border-white/10 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-white/5"
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            handleDeactivate(
                              exercise,
                            )
                          }
                          className="rounded-xl border border-red-500/20 px-3 py-2.5 text-sm font-semibold text-red-300 transition hover:bg-red-500/10"
                        >
                          Deactivate
                        </button>

                      </div>

                    </div>

                  </div>
                ),
              )}

            </div>
          )}

        </div>

      </div>

      {showProgramForm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-slate-950 p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-lime-400">
                  New Workout Program
                </p>
                <h2 className="mt-1 text-2xl font-black text-white">
                  Program Details
                </h2>
                <p className="mt-2 text-sm text-slate-500">
                  {selectedProgramExercises.length} exercise{selectedProgramExercises.length === 1 ? "" : "s"} selected from the library.
                </p>
              </div>

              <button
                type="button"
                onClick={closeProgramForm}
                disabled={creatingProgram}
                className="rounded-xl border border-white/10 px-3 py-2 text-slate-400 hover:bg-white/5 disabled:opacity-50"
              >
                ×
              </button>
            </div>

            <div className="mt-6 space-y-4">
              <div>
                <label className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">
                  Program Name
                </label>
                <input
                  value={programName}
                  onChange={(event) =>
                    setProgramName(
                      event.target.value,
                    )
                  }
                  placeholder="e.g. Upper Body Beginner"
                  className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-sm font-bold text-white outline-none placeholder:text-slate-600 focus:border-lime-400/50"
                  autoFocus
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">
                  Workout Type
                </label>
                <select
                  value={programWorkoutType}
                  onChange={(event) =>
                    setProgramWorkoutType(
                      event.target.value,
                    )
                  }
                  className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-sm font-bold text-white outline-none focus:border-lime-400/50"
                >
                  {CATEGORY_OPTIONS.map(
                    (category) => (
                      <option
                        key={category}
                        value={category}
                      >
                        {category}
                      </option>
                    ),
                  )}
                </select>
              </div>

              {programError && (
                <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm font-bold text-red-300">
                  {programError}
                </div>
              )}

              <button
                type="button"
                onClick={handleCreateProgram}
                disabled={creatingProgram}
                className="w-full rounded-xl bg-yellow-400 px-5 py-3.5 text-sm font-black text-black transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {creatingProgram
                  ? "CREATING PROGRAM..."
                  : "CREATE PROGRAM"}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteConfirmExercise && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-950 p-6 shadow-2xl">
            <h2 className="text-xl font-black text-white">
              Remove Exercise
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-400">
              Are you sure you want to remove{" "}
              <span className="font-bold text-white">
                {deleteConfirmExercise.name}
              </span>
              ?
            </p>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() =>
                  setDeleteConfirmExercise(null)
                }
                className="flex-1 rounded-xl border border-white/10 px-4 py-3 text-sm font-bold text-slate-300 transition hover:bg-white/5"
              >
                CANCEL
              </button>
              <button
                type="button"
                onClick={confirmDeactivate}
                className="flex-1 rounded-xl bg-red-500 px-4 py-3 text-sm font-black text-white transition hover:bg-red-400"
              >
                REMOVE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================== */}
      {/* CREATE / EDIT MODAL                                                */}
      {/* ================================================================== */}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">

          <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-3xl border border-white/10 bg-slate-950 p-6 shadow-2xl">

            {/* ============================================================ */}
            {/* MODAL HEADER                                                  */}
            {/* ============================================================ */}

            <div className="flex items-start justify-between gap-4">

              <div>

                <p className="text-xs font-bold uppercase tracking-[0.2em] text-lime-400">
                  Exercise Library
                </p>

                <h2 className="mt-1 text-2xl font-black">
                  {editingExercise
                    ? "Edit Exercise"
                    : "Add Exercise"}
                </h2>

                <p className="mt-2 text-sm text-slate-500">
                  Add the exercise information
                  and upload demonstration
                  media directly from your
                  device.
                </p>

              </div>

              <button
                type="button"
                onClick={
                  closeForm
                }
                disabled={saving}
                className="rounded-xl border border-white/10 px-3 py-2 text-slate-400 transition hover:bg-white/5 hover:text-white disabled:opacity-50"
              >
                ✕
              </button>

            </div>

            {/* ============================================================ */}
            {/* FORM                                                          */}
            {/* ============================================================ */}

            <form
              onSubmit={
                handleSubmit
              }
              className="mt-6 space-y-6"
            >

              {/* ========================================================== */}
              {/* BASIC INFORMATION                                           */}
              {/* ========================================================== */}

              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">

                <div className="mb-5">

                  <h3 className="text-base font-black">
                    Exercise Information
                  </h3>

                  <p className="mt-1 text-xs text-slate-500">
                    Enter the basic details
                    for this exercise.
                  </p>

                </div>

                <div className="grid gap-4 md:grid-cols-2">

                  {/* Exercise name */}

                  <div className="md:col-span-2">

                    <label className="mb-2 block text-sm font-medium text-slate-300">
                      Exercise Name
                    </label>

                    <input
                      name="name"
                      value={
                        form.name
                      }
                      onChange={
                        handleChange
                      }
                      required
                      placeholder="e.g. Barbell Squat"
                      className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-lime-400/50"
                    />

                  </div>

                  {/* Category */}

                  <div>

                    <label className="mb-2 block text-sm font-medium text-slate-300">
                      Category
                    </label>

                    <select
                      name="category"
                      value={
                        form.category
                      }
                      onChange={
                        handleChange
                      }
                      className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none focus:border-lime-400/50"
                    >
                      {CATEGORY_OPTIONS.map(
                        (
                          category,
                        ) => (
                          <option
                            key={
                              category
                            }
                            value={
                              category
                            }
                          >
                            {
                              category
                            }
                          </option>
                        ),
                      )}
                    </select>

                  </div>

                  {/* Muscle group */}

                  <div>

                    <label className="mb-2 block text-sm font-medium text-slate-300">
                      Muscle Group
                    </label>

                    <input
                      name="muscleGroup"
                      value={
                        form.muscleGroup
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="e.g. Quadriceps"
                      className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-lime-400/50"
                    />

                  </div>

                  {/* Secondary muscles */}

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-300">
                      Secondary Muscles
                    </label>

                    <input
                      name="secondaryMuscles"
                      value={form.secondaryMuscles}
                      onChange={handleChange}
                      placeholder="e.g. Triceps, Shoulders, Core"
                      className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-lime-400/50"
                    />

                    <p className="mt-2 text-xs text-slate-600">
                      Separate muscle groups with commas.
                    </p>
                  </div>

                  {/* Target gender */}

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-300">
                      Target Gender
                    </label>

                    <div className="grid grid-cols-2 gap-2">
                      {["Male", "Female"].map((gender) => {
                        const selected = form.targetGender.includes(gender)

                        return (
                          <button
                            key={gender}
                            type="button"
                            onClick={() =>
                              setForm((current) => ({
                                ...current,
                                targetGender: selected
                                  ? current.targetGender.filter(
                                      (item) => item !== gender,
                                    )
                                  : [...current.targetGender, gender],
                              }))
                            }
                            className={`rounded-xl px-4 py-3 text-sm font-bold transition ${
                              selected
                                ? "bg-lime-400 text-black"
                                : "border border-white/10 bg-slate-900 text-slate-400"
                            }`}
                          >
                            {selected ? "✓ " : ""}
                            {gender}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Fitness goals */}

                  <div className="md:col-span-2">
                    <label className="mb-2 block text-sm font-medium text-slate-300">
                      Fitness Goals
                    </label>

                    <div className="grid gap-2 sm:grid-cols-2">
                      {[
                        "Lose Weight",
                        "Keep Fit",
                        "Gain Weight",
                        "Train to Become a Trainer",
                      ].map((goal) => {
                        const selected = form.fitnessGoals.includes(goal)

                        return (
                          <button
                            key={goal}
                            type="button"
                            onClick={() =>
                              setForm((current) => ({
                                ...current,
                                fitnessGoals: selected
                                  ? current.fitnessGoals.filter(
                                      (item) => item !== goal,
                                    )
                                  : [...current.fitnessGoals, goal],
                              }))
                            }
                            className={`rounded-xl px-4 py-3 text-left text-sm font-bold transition ${
                              selected
                                ? "bg-lime-400 text-black"
                                : "border border-white/10 bg-slate-900 text-slate-400"
                            }`}
                          >
                            {selected ? "✓ " : ""}
                            {goal}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Difficulty */}

                  <div>

                    <label className="mb-2 block text-sm font-medium text-slate-300">
                      Difficulty
                    </label>

                    <select
                      name="difficulty"
                      value={
                        form.difficulty
                      }
                      onChange={
                        handleChange
                      }
                      className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none focus:border-lime-400/50"
                    >
                      {DIFFICULTY_OPTIONS.map(
                        (
                          difficulty,
                        ) => (
                          <option
                            key={
                              difficulty
                            }
                            value={
                              difficulty
                            }
                          >
                            {
                              difficulty
                            }
                          </option>
                        ),
                      )}
                    </select>

                  </div>

                  {/* Sets */}

                  <div>

                    <label className="mb-2 block text-sm font-medium text-slate-300">
                      Default Sets
                    </label>

                    <input
                      name="defaultSets"
                      type="number"
                      min="1"
                      value={
                        form.defaultSets
                      }
                      onChange={
                        handleChange
                      }
                      className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none focus:border-lime-400/50"
                    />

                  </div>

                  {/* Reps */}

                  <div>

                    <label className="mb-2 block text-sm font-medium text-slate-300">
                      Default Reps
                    </label>

                    <input
                      name="defaultReps"
                      type="number"
                      min="1"
                      value={
                        form.defaultReps
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="e.g. 10"
                      className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-lime-400/50"
                    />

                  </div>

                  {/* Duration */}

                  <div>

                    <label className="mb-2 block text-sm font-medium text-slate-300">
                      Default Duration
                      (seconds)
                    </label>

                    <input
                      name="defaultDuration"
                      type="number"
                      min="1"
                      value={
                        form.defaultDuration
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="Optional"
                      className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-lime-400/50"
                    />

                  </div>

                  {/* Rest */}

                  <div>

                    <label className="mb-2 block text-sm font-medium text-slate-300">
                      Default Rest
                      (seconds)
                    </label>

                    <input
                      name="defaultRest"
                      type="number"
                      min="0"
                      value={
                        form.defaultRest
                      }
                      onChange={
                        handleChange
                      }
                      className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none focus:border-lime-400/50"
                    />

                  </div>

                  {/* Calories */}

                  <div>

                    <label className="mb-2 block text-sm font-medium text-slate-300">
                      Calories Estimate
                    </label>

                    <input
                      name="caloriesEstimate"
                      type="number"
                      min="0"
                      value={
                        form.caloriesEstimate
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="Optional"
                      className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-lime-400/50"
                    />

                  </div>

                </div>

              </div>

              {/* ========================================================== */}
              {/* DESCRIPTION                                                 */}
              {/* ========================================================== */}

              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">

                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Description
                </label>

                <textarea
                  name="description"
                  value={
                    form.description
                  }
                  onChange={
                    handleChange
                  }
                  rows="4"
                  placeholder="Describe the exercise..."
                  className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-lime-400/50"
                />

              </div>

              {/* ========================================================== */}
              {/* INSTRUCTIONS                                                */}
              {/* ========================================================== */}

              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">

                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Exercise Instructions
                </label>

                <textarea
                  name="instructions"
                  value={
                    form.instructions
                  }
                  onChange={
                    handleChange
                  }
                  rows="6"
                  placeholder="Enter one instruction per line..."
                  className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-lime-400/50"
                />

                <p className="mt-2 text-xs text-slate-600">
                  Enter one instruction
                  per line.
                </p>

              </div>

              {/* ========================================================== */}
              {/* SAFETY TIPS                                                  */}
              {/* ========================================================== */}

              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">

                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Safety Tips
                </label>

                <textarea
                  name="safetyTips"
                  value={form.safetyTips}
                  onChange={handleChange}
                  rows="5"
                  placeholder="Enter one safety tip per line..."
                  className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-lime-400/50"
                />

                <p className="mt-2 text-xs text-slate-600">
                  Enter one safety tip per line.
                </p>

              </div>

              {/* ========================================================== */}
              {/* EQUIPMENT                                                   */}
              {/* ========================================================== */}

              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">

                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Equipment
                </label>

                <input
                  name="equipment"
                  value={
                    form.equipment
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="e.g. Barbell, Bench"
                  className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-lime-400/50"
                />

                <p className="mt-2 text-xs text-slate-600">
                  Separate multiple
                  items with commas.
                </p>

              </div>

              {/* ========================================================== */}
              {/* DEMONSTRATION MEDIA                                         */}
              {/* ========================================================== */}

              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">

                <div className="mb-5">

                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-lime-400">
                    Demonstration Media
                  </p>

                  <h3 className="mt-1 text-lg font-black">
                    Add a picture or
                    video
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    Choose a file directly
                    from your laptop,
                    tablet or phone.
                  </p>

                </div>

                {/* -------------------------------------------------------- */}
                {/* Tabs                                                      */}
                {/* -------------------------------------------------------- */}

                <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-900 p-1">

                  <button
                    type="button"
                    onClick={() =>
                      setMediaTab(
                        "image",
                      )
                    }
                    className={`rounded-lg px-4 py-3 text-sm font-bold transition ${
                      mediaTab ===
                      "image"
                        ? "bg-yellow-400 text-black"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    IMAGE
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setMediaTab(
                        "video",
                      )
                    }
                    className={`rounded-lg px-4 py-3 text-sm font-bold transition ${
                      mediaTab ===
                      "video"
                        ? "bg-yellow-400 text-black"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    VIDEO
                  </button>

                </div>

                {/* -------------------------------------------------------- */}
                {/* IMAGE UPLOAD                                               */}
                {/* -------------------------------------------------------- */}

                {mediaTab ===
                  "image" && (
                  <div className="mt-5">

                    <label className="block cursor-pointer">

                      <div className="overflow-hidden rounded-2xl border-2 border-dashed border-white/10 bg-black transition hover:border-yellow-400/40">

                        {imagePreview ? (
                          <div>

                            <img
                              src={
                                imagePreview
                              }
                              alt="Exercise preview"
                              className="max-h-72 w-full object-contain"
                            />

                            <div className="border-t border-white/10 px-4 py-4">

                              <p className="text-sm font-bold text-white">
                                {imageFile
                                  ? imageFile.name
                                  : "Current exercise image"}
                              </p>

                              {imageFile && (
                                <p className="mt-1 text-xs text-slate-500">
                                  {
                                    formatFileSize(
                                      imageFile.size,
                                    )
                                  }
                                </p>
                              )}

                              <p className="mt-3 text-xs font-semibold text-yellow-400">
                                Click to choose a
                                different image
                              </p>

                            </div>

                          </div>
                        ) : (
                          <div className="flex min-h-64 flex-col items-center justify-center px-6 py-10 text-center">

                            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-yellow-400 text-3xl text-black">
                              🖼️
                            </div>

                            <h4 className="mt-5 text-base font-black">
                              Choose an image
                            </h4>

                            <p className="mt-2 text-sm text-slate-500">
                              Tap here to select
                              a picture from your
                              device.
                            </p>

                            <p className="mt-3 text-xs text-slate-600">
                              JPG, PNG, WEBP or
                              GIF · Maximum 10 MB
                            </p>

                          </div>
                        )}

                      </div>

                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        onChange={
                          handleImageChange
                        }
                        className="hidden"
                      />

                    </label>

                  </div>
                )}

                {/* -------------------------------------------------------- */}
                {/* VIDEO UPLOAD                                               */}
                {/* -------------------------------------------------------- */}

                {mediaTab ===
                  "video" && (
                  <div className="mt-5">

                    <label className="block cursor-pointer">

                      <div className="overflow-hidden rounded-2xl border-2 border-dashed border-white/10 bg-black transition hover:border-yellow-400/40">

                        {videoPreview ? (
                          <div>

                            <video
                              src={
                                videoPreview
                              }
                              controls
                              preload="metadata"
                              className="max-h-80 w-full bg-black"
                            />

                            <div className="border-t border-white/10 px-4 py-4">

                              <p className="text-sm font-bold text-white">
                                {videoFile
                                  ? videoFile.name
                                  : "Current exercise video"}
                              </p>

                              {videoFile && (
                                <p className="mt-1 text-xs text-slate-500">
                                  {
                                    formatFileSize(
                                      videoFile.size,
                                    )
                                  }
                                </p>
                              )}

                              <p className="mt-3 text-xs font-semibold text-yellow-400">
                                Click to choose a
                                different video
                              </p>

                            </div>

                          </div>
                        ) : (
                          <div className="flex min-h-64 flex-col items-center justify-center px-6 py-10 text-center">

                            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-yellow-400 text-3xl text-black">
                              🎥
                            </div>

                            <h4 className="mt-5 text-base font-black">
                              Choose a video
                            </h4>

                            <p className="mt-2 text-sm text-slate-500">
                              Tap here to select
                              a demonstration
                              video from your
                              device.
                            </p>

                            <p className="mt-3 text-xs text-slate-600">
                              MP4, WEBM, MOV or
                              AVI · Maximum 100 MB
                            </p>

                          </div>
                        )}

                      </div>

                      <input
                        type="file"
                        accept="video/mp4,video/webm,video/quicktime,video/x-msvideo"
                        onChange={
                          handleVideoChange
                        }
                        className="hidden"
                      />

                    </label>

                  </div>
                )}

                {/* -------------------------------------------------------- */}
                {/* Selected files summary                                    */}
                {/* -------------------------------------------------------- */}

                {(imageFile ||
                  videoFile) && (
                  <div className="mt-5 rounded-xl border border-lime-400/20 bg-lime-400/5 p-4">

                    <p className="text-xs font-bold uppercase tracking-wider text-lime-400">
                      Files selected
                    </p>

                    <div className="mt-3 space-y-2">

                      {imageFile && (
                        <div className="flex items-center justify-between gap-3 text-sm">

                          <span className="truncate text-slate-300">
                            🖼️{" "}
                            {
                              imageFile.name
                            }
                          </span>

                          <span className="shrink-0 text-xs text-slate-500">
                            {
                              formatFileSize(
                                imageFile.size,
                              )
                            }
                          </span>

                        </div>
                      )}

                      {videoFile && (
                        <div className="flex items-center justify-between gap-3 text-sm">

                          <span className="truncate text-slate-300">
                            🎥{" "}
                            {
                              videoFile.name
                            }
                          </span>

                          <span className="shrink-0 text-xs text-slate-500">
                            {
                              formatFileSize(
                                videoFile.size,
                              )
                            }
                          </span>

                        </div>
                      )}

                    </div>

                  </div>
                )}

              </div>

              {/* ========================================================== */}
              {/* ACTIONS                                                      */}
              {/* ========================================================== */}

              <div className="flex flex-col-reverse gap-3 border-t border-white/10 pt-5 sm:flex-row sm:justify-end">

                <button
                  type="button"
                  onClick={
                    closeForm
                  }
                  disabled={saving}
                  className="rounded-xl border border-white/10 px-6 py-3 text-sm font-semibold text-slate-300 transition hover:bg-white/5 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-yellow-400 px-6 py-3 text-sm font-bold text-black transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving
                    ? "Uploading & Saving..."
                    : editingExercise
                      ? "Save Changes"
                      : "Create Exercise"}
                </button>

              </div>

            </form>

          </div>

        </div>
      )}

    </div>
  )
}