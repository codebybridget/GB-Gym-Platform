const exerciseCatalog = [
  // ============================================================
  // UPPER BODY — CHEST
  // ============================================================

  {
    id: "upper-chest-001",
    name: "Barbell Bench Press",
    category: "upper_body",
    subcategory: "chest",
    muscleGroup: "Chest",
    secondaryMuscles: ["Triceps", "Front Deltoids"],
    equipment: "Barbell",
    difficulty: "Intermediate",
    movementType: "Push",
    defaultSets: 4,
    defaultReps: 10,
    defaultRest: "90 sec",
    instructions:
      "Lower the bar under control toward the mid chest and press it upward while keeping the shoulders stable.",
    safetyNotes:
      "Use controlled movement and appropriate load. Use a spotter when necessary.",
  },

  {
    id: "upper-chest-002",
    name: "Dumbbell Bench Press",
    category: "upper_body",
    subcategory: "chest",
    muscleGroup: "Chest",
    secondaryMuscles: ["Triceps", "Front Deltoids"],
    equipment: "Dumbbells",
    difficulty: "Beginner",
    movementType: "Push",
    defaultSets: 3,
    defaultReps: 10,
    defaultRest: "60 sec",
    instructions:
      "Press both dumbbells upward from chest level while keeping the wrists controlled.",
    safetyNotes:
      "Use a manageable weight and maintain stable shoulder positioning.",
  },

  {
    id: "upper-chest-003",
    name: "Incline Barbell Bench Press",
    category: "upper_body",
    subcategory: "chest",
    muscleGroup: "Upper Chest",
    secondaryMuscles: ["Triceps", "Front Deltoids"],
    equipment: "Barbell",
    difficulty: "Intermediate",
    movementType: "Push",
    defaultSets: 3,
    defaultReps: 10,
    defaultRest: "90 sec",
    instructions:
      "Press the bar from the upper chest while maintaining contact with the bench.",
    safetyNotes:
      "Avoid excessive shoulder strain and use an appropriate incline.",
  },

  {
    id: "upper-chest-004",
    name: "Incline Dumbbell Press",
    category: "upper_body",
    subcategory: "chest",
    muscleGroup: "Upper Chest",
    secondaryMuscles: ["Triceps", "Front Deltoids"],
    equipment: "Dumbbells",
    difficulty: "Beginner",
    movementType: "Push",
    defaultSets: 3,
    defaultReps: 10,
    defaultRest: "60 sec",
    instructions:
      "Press the dumbbells upward from the upper chest with controlled movement.",
    safetyNotes:
      "Do not use a load that causes loss of control.",
  },

  {
    id: "upper-chest-005",
    name: "Push-Up",
    category: "upper_body",
    subcategory: "chest",
    muscleGroup: "Chest",
    secondaryMuscles: ["Triceps", "Shoulders", "Core"],
    equipment: "Bodyweight",
    difficulty: "Beginner",
    movementType: "Push",
    defaultSets: 3,
    defaultReps: 12,
    defaultRest: "60 sec",
    instructions:
      "Maintain a straight body line and lower the chest toward the floor before pressing upward.",
    safetyNotes:
      "Keep the body aligned and avoid excessive lower-back movement.",
  },

  {
    id: "upper-chest-006",
    name: "Incline Push-Up",
    category: "upper_body",
    subcategory: "chest",
    muscleGroup: "Chest",
    secondaryMuscles: ["Triceps", "Shoulders"],
    equipment: "Bodyweight",
    difficulty: "Beginner",
    movementType: "Push",
    defaultSets: 3,
    defaultReps: 12,
    defaultRest: "45 sec",
    instructions:
      "Place the hands on a stable elevated surface and perform controlled push-ups.",
    safetyNotes:
      "Make sure the elevated surface is stable.",
  },

  {
    id: "upper-chest-007",
    name: "Chest Fly",
    category: "upper_body",
    subcategory: "chest",
    muscleGroup: "Chest",
    secondaryMuscles: ["Front Deltoids"],
    equipment: "Dumbbells",
    difficulty: "Beginner",
    movementType: "Isolation",
    defaultSets: 3,
    defaultReps: 12,
    defaultRest: "60 sec",
    instructions:
      "Open the arms under control and bring them together without aggressively locking the elbows.",
    safetyNotes:
      "Use light to moderate resistance and controlled range of motion.",
  },

  {
    id: "upper-chest-008",
    name: "Cable Chest Fly",
    category: "upper_body",
    subcategory: "chest",
    muscleGroup: "Chest",
    secondaryMuscles: ["Front Deltoids"],
    equipment: "Cable Machine",
    difficulty: "Beginner",
    movementType: "Isolation",
    defaultSets: 3,
    defaultReps: 12,
    defaultRest: "60 sec",
    instructions:
      "Bring the cable handles together in front of the chest while maintaining control.",
    safetyNotes:
      "Avoid excessive shoulder extension.",
  },

  // ============================================================
  // UPPER BODY — BACK
  // ============================================================

  {
    id: "upper-back-001",
    name: "Lat Pulldown",
    category: "upper_body",
    subcategory: "back",
    muscleGroup: "Latissimus Dorsi",
    secondaryMuscles: ["Biceps", "Upper Back"],
    equipment: "Cable Machine",
    difficulty: "Beginner",
    movementType: "Pull",
    defaultSets: 3,
    defaultReps: 12,
    defaultRest: "60 sec",
    instructions:
      "Pull the bar toward the upper chest while keeping the torso controlled.",
    safetyNotes:
      "Avoid pulling the bar aggressively behind the neck.",
  },

  {
    id: "upper-back-002",
    name: "Seated Cable Row",
    category: "upper_body",
    subcategory: "back",
    muscleGroup: "Upper Back",
    secondaryMuscles: ["Latissimus Dorsi", "Biceps"],
    equipment: "Cable Machine",
    difficulty: "Beginner",
    movementType: "Pull",
    defaultSets: 3,
    defaultReps: 12,
    defaultRest: "60 sec",
    instructions:
      "Pull the handle toward the torso while keeping the chest lifted.",
    safetyNotes:
      "Avoid excessive rounding or swinging.",
  },

  {
    id: "upper-back-003",
    name: "Barbell Bent-Over Row",
    category: "upper_body",
    subcategory: "back",
    muscleGroup: "Upper Back",
    secondaryMuscles: ["Latissimus Dorsi", "Biceps", "Core"],
    equipment: "Barbell",
    difficulty: "Intermediate",
    movementType: "Pull",
    defaultSets: 3,
    defaultReps: 10,
    defaultRest: "90 sec",
    instructions:
      "Hinge at the hips, maintain a neutral spine and pull the bar toward the torso.",
    safetyNotes:
      "Maintain a stable spine and avoid using excessive momentum.",
  },

  {
    id: "upper-back-004",
    name: "One-Arm Dumbbell Row",
    category: "upper_body",
    subcategory: "back",
    muscleGroup: "Latissimus Dorsi",
    secondaryMuscles: ["Biceps", "Upper Back"],
    equipment: "Dumbbell",
    difficulty: "Beginner",
    movementType: "Pull",
    defaultSets: 3,
    defaultReps: 10,
    defaultRest: "60 sec",
    instructions:
      "Pull the dumbbell toward the hip while maintaining a stable torso.",
    safetyNotes:
      "Do not rotate the torso excessively.",
  },

  {
    id: "upper-back-005",
    name: "Assisted Pull-Up",
    category: "upper_body",
    subcategory: "back",
    muscleGroup: "Latissimus Dorsi",
    secondaryMuscles: ["Biceps", "Core"],
    equipment: "Assisted Pull-Up Machine",
    difficulty: "Beginner",
    movementType: "Pull",
    defaultSets: 3,
    defaultReps: 8,
    defaultRest: "90 sec",
    instructions:
      "Pull the body upward while maintaining controlled movement.",
    safetyNotes:
      "Use sufficient assistance to maintain good technique.",
  },

  {
    id: "upper-back-006",
    name: "Pull-Up",
    category: "upper_body",
    subcategory: "back",
    muscleGroup: "Latissimus Dorsi",
    secondaryMuscles: ["Biceps", "Core"],
    equipment: "Pull-Up Bar",
    difficulty: "Advanced",
    movementType: "Pull",
    defaultSets: 3,
    defaultReps: 6,
    defaultRest: "90 sec",
    instructions:
      "Pull the body upward until the chin clears the bar while maintaining control.",
    safetyNotes:
      "Scale the movement if full repetitions cannot be performed safely.",
  },

  {
    id: "upper-back-007",
    name: "Straight-Arm Pulldown",
    category: "upper_body",
    subcategory: "back",
    muscleGroup: "Latissimus Dorsi",
    secondaryMuscles: ["Core"],
    equipment: "Cable Machine",
    difficulty: "Beginner",
    movementType: "Pull",
    defaultSets: 3,
    defaultReps: 12,
    defaultRest: "60 sec",
    instructions:
      "Pull the bar downward toward the thighs while keeping the arms mostly straight.",
    safetyNotes:
      "Keep the movement controlled.",
  },

  // ============================================================
  // UPPER BODY — SHOULDERS
  // ============================================================

  {
    id: "upper-shoulder-001",
    name: "Shoulder Press",
    category: "upper_body",
    subcategory: "shoulders",
    muscleGroup: "Shoulders",
    secondaryMuscles: ["Triceps", "Upper Chest"],
    equipment: "Dumbbells",
    difficulty: "Beginner",
    movementType: "Push",
    defaultSets: 3,
    defaultReps: 10,
    defaultRest: "60 sec",
    instructions:
      "Press the weights overhead while maintaining a stable torso.",
    safetyNotes:
      "Use a comfortable range of motion.",
  },

  {
    id: "upper-shoulder-002",
    name: "Barbell Overhead Press",
    category: "upper_body",
    subcategory: "shoulders",
    muscleGroup: "Shoulders",
    secondaryMuscles: ["Triceps", "Core"],
    equipment: "Barbell",
    difficulty: "Intermediate",
    movementType: "Push",
    defaultSets: 3,
    defaultReps: 8,
    defaultRest: "90 sec",
    instructions:
      "Press the bar vertically overhead while maintaining a braced torso.",
    safetyNotes:
      "Do not force the range of motion if shoulder mobility is limited.",
  },

  {
    id: "upper-shoulder-003",
    name: "Lateral Raise",
    category: "upper_body",
    subcategory: "shoulders",
    muscleGroup: "Side Deltoids",
    secondaryMuscles: [],
    equipment: "Dumbbells",
    difficulty: "Beginner",
    movementType: "Isolation",
    defaultSets: 3,
    defaultReps: 12,
    defaultRest: "45 sec",
    instructions:
      "Raise the dumbbells outward to shoulder height using controlled movement.",
    safetyNotes:
      "Avoid swinging the weights.",
  },

  {
    id: "upper-shoulder-004",
    name: "Front Raise",
    category: "upper_body",
    subcategory: "shoulders",
    muscleGroup: "Front Deltoids",
    secondaryMuscles: [],
    equipment: "Dumbbells",
    difficulty: "Beginner",
    movementType: "Isolation",
    defaultSets: 3,
    defaultReps: 12,
    defaultRest: "45 sec",
    instructions:
      "Raise the weights forward under control to approximately shoulder height.",
    safetyNotes:
      "Use light resistance.",
  },

  {
    id: "upper-shoulder-005",
    name: "Face Pull",
    category: "upper_body",
    subcategory: "shoulders",
    muscleGroup: "Rear Deltoids",
    secondaryMuscles: ["Upper Back"],
    equipment: "Cable Machine",
    difficulty: "Beginner",
    movementType: "Pull",
    defaultSets: 3,
    defaultReps: 15,
    defaultRest: "45 sec",
    instructions:
      "Pull the rope toward the face while rotating the hands outward.",
    safetyNotes:
      "Keep the movement controlled.",
  },

  // ============================================================
  // UPPER BODY — BICEPS
  // ============================================================

  {
    id: "upper-biceps-001",
    name: "Barbell Bicep Curl",
    category: "upper_body",
    subcategory: "biceps",
    muscleGroup: "Biceps",
    secondaryMuscles: ["Forearms"],
    equipment: "Barbell",
    difficulty: "Beginner",
    movementType: "Isolation",
    defaultSets: 3,
    defaultReps: 12,
    defaultRest: "45 sec",
    instructions:
      "Curl the bar toward the shoulders while keeping the elbows close to the torso.",
    safetyNotes:
      "Avoid swinging the body.",
  },

  {
    id: "upper-biceps-002",
    name: "Dumbbell Bicep Curl",
    category: "upper_body",
    subcategory: "biceps",
    muscleGroup: "Biceps",
    secondaryMuscles: ["Forearms"],
    equipment: "Dumbbells",
    difficulty: "Beginner",
    movementType: "Isolation",
    defaultSets: 3,
    defaultReps: 12,
    defaultRest: "45 sec",
    instructions:
      "Curl the dumbbells toward the shoulders while keeping the elbows stable.",
    safetyNotes:
      "Use controlled repetitions.",
  },

  {
    id: "upper-biceps-003",
    name: "Hammer Curl",
    category: "upper_body",
    subcategory: "biceps",
    muscleGroup: "Biceps",
    secondaryMuscles: ["Brachialis", "Forearms"],
    equipment: "Dumbbells",
    difficulty: "Beginner",
    movementType: "Isolation",
    defaultSets: 3,
    defaultReps: 12,
    defaultRest: "45 sec",
    instructions:
      "Curl the dumbbells with a neutral grip while keeping the elbows stable.",
    safetyNotes:
      "Avoid excessive swinging.",
  },

  {
    id: "upper-biceps-004",
    name: "Cable Bicep Curl",
    category: "upper_body",
    subcategory: "biceps",
    muscleGroup: "Biceps",
    secondaryMuscles: ["Forearms"],
    equipment: "Cable Machine",
    difficulty: "Beginner",
    movementType: "Isolation",
    defaultSets: 3,
    defaultReps: 12,
    defaultRest: "45 sec",
    instructions:
      "Curl the cable handle toward the shoulders with controlled tension.",
    safetyNotes:
      "Maintain stable elbows.",
  },

  // ============================================================
  // UPPER BODY — TRICEPS
  // ============================================================

  {
    id: "upper-triceps-001",
    name: "Tricep Pushdown",
    category: "upper_body",
    subcategory: "triceps",
    muscleGroup: "Triceps",
    secondaryMuscles: [],
    equipment: "Cable Machine",
    difficulty: "Beginner",
    movementType: "Isolation",
    defaultSets: 3,
    defaultReps: 12,
    defaultRest: "45 sec",
    instructions:
      "Push the cable attachment downward while keeping the elbows close to the torso.",
    safetyNotes:
      "Avoid excessive shoulder movement.",
  },

  {
    id: "upper-triceps-002",
    name: "Overhead Tricep Extension",
    category: "upper_body",
    subcategory: "triceps",
    muscleGroup: "Triceps",
    secondaryMuscles: [],
    equipment: "Dumbbell",
    difficulty: "Beginner",
    movementType: "Isolation",
    defaultSets: 3,
    defaultReps: 12,
    defaultRest: "45 sec",
    instructions:
      "Lower the weight behind the head and extend the elbows upward.",
    safetyNotes:
      "Use a controlled range of motion.",
  },

  {
    id: "upper-triceps-003",
    name: "Bench Dip",
    category: "upper_body",
    subcategory: "triceps",
    muscleGroup: "Triceps",
    secondaryMuscles: ["Chest", "Shoulders"],
    equipment: "Bench",
    difficulty: "Intermediate",
    movementType: "Push",
    defaultSets: 3,
    defaultReps: 10,
    defaultRest: "60 sec",
    instructions:
      "Lower the body by bending the elbows and press upward.",
    safetyNotes:
      "Do not force excessive shoulder extension.",
  },

  // ============================================================
  // LOWER BODY — QUADRICEPS
  // ============================================================

  {
    id: "lower-quads-001",
    name: "Barbell Back Squat",
    category: "lower_body",
    subcategory: "quadriceps",
    muscleGroup: "Quadriceps",
    secondaryMuscles: ["Glutes", "Hamstrings", "Core"],
    equipment: "Barbell",
    difficulty: "Intermediate",
    movementType: "Squat",
    defaultSets: 4,
    defaultReps: 10,
    defaultRest: "90 sec",
    instructions:
      "Brace the core, lower into a controlled squat and drive through the floor to stand.",
    safetyNotes:
      "Use a load appropriate for the individual's ability.",
  },

  {
    id: "lower-quads-002",
    name: "Goblet Squat",
    category: "lower_body",
    subcategory: "quadriceps",
    muscleGroup: "Quadriceps",
    secondaryMuscles: ["Glutes", "Core"],
    equipment: "Dumbbell",
    difficulty: "Beginner",
    movementType: "Squat",
    defaultSets: 3,
    defaultReps: 12,
    defaultRest: "60 sec",
    instructions:
      "Hold the weight near the chest and perform a controlled squat.",
    safetyNotes:
      "Maintain a stable torso and comfortable depth.",
  },

  {
    id: "lower-quads-003",
    name: "Leg Press",
    category: "lower_body",
    subcategory: "quadriceps",
    muscleGroup: "Quadriceps",
    secondaryMuscles: ["Glutes", "Hamstrings"],
    equipment: "Leg Press Machine",
    difficulty: "Beginner",
    movementType: "Push",
    defaultSets: 3,
    defaultReps: 12,
    defaultRest: "90 sec",
    instructions:
      "Press the platform away while maintaining controlled knee and hip movement.",
    safetyNotes:
      "Do not allow the knees to collapse inward.",
  },

  {
    id: "lower-quads-004",
    name: "Leg Extension",
    category: "lower_body",
    subcategory: "quadriceps",
    muscleGroup: "Quadriceps",
    secondaryMuscles: [],
    equipment: "Leg Extension Machine",
    difficulty: "Beginner",
    movementType: "Isolation",
    defaultSets: 3,
    defaultReps: 12,
    defaultRest: "60 sec",
    instructions:
      "Extend the knees under control and return slowly.",
    safetyNotes:
      "Use a comfortable resistance and avoid jerking.",
  },

  {
    id: "lower-quads-005",
    name: "Walking Lunge",
    category: "lower_body",
    subcategory: "quadriceps",
    muscleGroup: "Quadriceps",
    secondaryMuscles: ["Glutes", "Hamstrings"],
    equipment: "Bodyweight",
    difficulty: "Beginner",
    movementType: "Lunge",
    defaultSets: 3,
    defaultReps: 12,
    defaultRest: "60 sec",
    instructions:
      "Step forward, lower under control and drive through the front foot.",
    safetyNotes:
      "Keep the front knee aligned with the foot.",
  },

  {
    id: "lower-quads-006",
    name: "Reverse Lunge",
    category: "lower_body",
    subcategory: "quadriceps",
    muscleGroup: "Quadriceps",
    secondaryMuscles: ["Glutes", "Hamstrings"],
    equipment: "Dumbbells",
    difficulty: "Beginner",
    movementType: "Lunge",
    defaultSets: 3,
    defaultReps: 10,
    defaultRest: "60 sec",
    instructions:
      "Step backward and lower the body before returning to the starting position.",
    safetyNotes:
      "Maintain balance and controlled movement.",
  },

  // ============================================================
  // LOWER BODY — HAMSTRINGS
  // ============================================================

  {
    id: "lower-hamstring-001",
    name: "Romanian Deadlift",
    category: "lower_body",
    subcategory: "hamstrings",
    muscleGroup: "Hamstrings",
    secondaryMuscles: ["Glutes", "Lower Back"],
    equipment: "Barbell",
    difficulty: "Intermediate",
    movementType: "Hinge",
    defaultSets: 3,
    defaultReps: 10,
    defaultRest: "90 sec",
    instructions:
      "Push the hips backward while maintaining a neutral spine and return by driving the hips forward.",
    safetyNotes:
      "Keep the load controlled and maintain a neutral spine.",
  },

  {
    id: "lower-hamstring-002",
    name: "Leg Curl",
    category: "lower_body",
    subcategory: "hamstrings",
    muscleGroup: "Hamstrings",
    secondaryMuscles: ["Calves"],
    equipment: "Leg Curl Machine",
    difficulty: "Beginner",
    movementType: "Isolation",
    defaultSets: 3,
    defaultReps: 12,
    defaultRest: "60 sec",
    instructions:
      "Curl the lower legs toward the body under controlled resistance.",
    safetyNotes:
      "Avoid sudden movements.",
  },

  {
    id: "lower-hamstring-003",
    name: "Good Morning",
    category: "lower_body",
    subcategory: "hamstrings",
    muscleGroup: "Hamstrings",
    secondaryMuscles: ["Glutes", "Lower Back"],
    equipment: "Barbell",
    difficulty: "Intermediate",
    movementType: "Hinge",
    defaultSets: 3,
    defaultReps: 10,
    defaultRest: "90 sec",
    instructions:
      "Hinge at the hips while maintaining a stable spine and return to standing.",
    safetyNotes:
      "Use light resistance until technique is established.",
  },

  // ============================================================
  // LOWER BODY — GLUTES
  // ============================================================

  {
    id: "lower-glutes-001",
    name: "Barbell Hip Thrust",
    category: "lower_body",
    subcategory: "glutes",
    muscleGroup: "Glutes",
    secondaryMuscles: ["Hamstrings"],
    equipment: "Barbell",
    difficulty: "Intermediate",
    movementType: "Hip Extension",
    defaultSets: 4,
    defaultReps: 10,
    defaultRest: "90 sec",
    instructions:
      "Drive the hips upward while maintaining a stable torso and controlled descent.",
    safetyNotes:
      "Avoid excessive lower-back arching.",
  },

  {
    id: "lower-glutes-002",
    name: "Glute Bridge",
    category: "lower_body",
    subcategory: "glutes",
    muscleGroup: "Glutes",
    secondaryMuscles: ["Hamstrings"],
    equipment: "Bodyweight",
    difficulty: "Beginner",
    movementType: "Hip Extension",
    defaultSets: 3,
    defaultReps: 15,
    defaultRest: "45 sec",
    instructions:
      "Press through the feet and raise the hips while squeezing the glutes.",
    safetyNotes:
      "Avoid excessive spinal extension.",
  },

  {
    id: "lower-glutes-003",
    name: "Bulgarian Split Squat",
    category: "lower_body",
    subcategory: "glutes",
    muscleGroup: "Glutes",
    secondaryMuscles: ["Quadriceps", "Hamstrings"],
    equipment: "Dumbbells",
    difficulty: "Intermediate",
    movementType: "Single Leg",
    defaultSets: 3,
    defaultReps: 10,
    defaultRest: "60 sec",
    instructions:
      "Place the rear foot on a stable surface and lower the body through the front leg.",
    safetyNotes:
      "Use support if balance is limited.",
  },

  // ============================================================
  // LOWER BODY — CALVES
  // ============================================================

  {
    id: "lower-calves-001",
    name: "Standing Calf Raise",
    category: "lower_body",
    subcategory: "calves",
    muscleGroup: "Calves",
    secondaryMuscles: [],
    equipment: "Machine",
    difficulty: "Beginner",
    movementType: "Isolation",
    defaultSets: 3,
    defaultReps: 15,
    defaultRest: "45 sec",
    instructions:
      "Raise the heels through a controlled range of motion and lower slowly.",
    safetyNotes:
      "Avoid bouncing.",
  },

  {
    id: "lower-calves-002",
    name: "Seated Calf Raise",
    category: "lower_body",
    subcategory: "calves",
    muscleGroup: "Calves",
    secondaryMuscles: [],
    equipment: "Machine",
    difficulty: "Beginner",
    movementType: "Isolation",
    defaultSets: 3,
    defaultReps: 15,
    defaultRest: "45 sec",
    instructions:
      "Raise and lower the heels under controlled resistance.",
    safetyNotes:
      "Use a controlled range of motion.",
  },

  // ============================================================
  // LOWER BODY — ADDUCTORS / ABDUCTORS
  // ============================================================

  {
    id: "lower-hips-001",
    name: "Hip Abduction Machine",
    category: "lower_body",
    subcategory: "hips",
    muscleGroup: "Hip Abductors",
    secondaryMuscles: ["Glutes"],
    equipment: "Machine",
    difficulty: "Beginner",
    movementType: "Isolation",
    defaultSets: 3,
    defaultReps: 15,
    defaultRest: "45 sec",
    instructions:
      "Move the legs outward under controlled resistance.",
    safetyNotes:
      "Avoid using momentum.",
  },

  {
    id: "lower-hips-002",
    name: "Hip Adduction Machine",
    category: "lower_body",
    subcategory: "hips",
    muscleGroup: "Hip Adductors",
    secondaryMuscles: [],
    equipment: "Machine",
    difficulty: "Beginner",
    movementType: "Isolation",
    defaultSets: 3,
    defaultReps: 15,
    defaultRest: "45 sec",
    instructions:
      "Bring the legs inward against resistance under control.",
    safetyNotes:
      "Use controlled movement.",
  },

  // ============================================================
  // CROSSFIT — FOUNDATIONAL
  // ============================================================

  {
    id: "crossfit-foundation-001",
    name: "Air Squat",
    category: "crossfit",
    subcategory: "foundational",
    muscleGroup: "Full Lower Body",
    secondaryMuscles: ["Core"],
    equipment: "Bodyweight",
    difficulty: "Beginner",
    movementType: "Squat",
    defaultSets: 3,
    defaultReps: 15,
    defaultRest: "45 sec",
    instructions:
      "Perform a controlled squat using bodyweight while maintaining a stable torso.",
    safetyNotes:
      "Maintain sound squat mechanics before adding load.",
  },

  {
    id: "crossfit-foundation-002",
    name: "Front Squat",
    category: "crossfit",
    subcategory: "foundational",
    muscleGroup: "Quadriceps",
    secondaryMuscles: ["Glutes", "Core"],
    equipment: "Barbell",
    difficulty: "Intermediate",
    movementType: "Squat",
    defaultSets: 3,
    defaultReps: 10,
    defaultRest: "90 sec",
    instructions:
      "Hold the bar in the front rack position and perform a controlled squat.",
    safetyNotes:
      "Master the air squat before progressing to loaded variations.",
  },

  {
    id: "crossfit-foundation-003",
    name: "Overhead Squat",
    category: "crossfit",
    subcategory: "foundational",
    muscleGroup: "Full Lower Body",
    secondaryMuscles: ["Shoulders", "Core"],
    equipment: "Barbell",
    difficulty: "Advanced",
    movementType: "Squat",
    defaultSets: 3,
    defaultReps: 8,
    defaultRest: "90 sec",
    instructions:
      "Maintain the bar overhead while performing a controlled squat.",
    safetyNotes:
      "Requires adequate mobility and technical proficiency.",
  },

  {
    id: "crossfit-foundation-004",
    name: "Shoulder Press",
    category: "crossfit",
    subcategory: "foundational",
    muscleGroup: "Shoulders",
    secondaryMuscles: ["Triceps", "Core"],
    equipment: "Barbell",
    difficulty: "Beginner",
    movementType: "Press",
    defaultSets: 3,
    defaultReps: 10,
    defaultRest: "60 sec",
    instructions:
      "Press the bar from the shoulders to overhead without using leg drive.",
    safetyNotes:
      "Keep the torso controlled.",
  },

  {
    id: "crossfit-foundation-005",
    name: "Push Press",
    category: "crossfit",
    subcategory: "foundational",
    muscleGroup: "Shoulders",
    secondaryMuscles: ["Triceps", "Legs", "Core"],
    equipment: "Barbell",
    difficulty: "Intermediate",
    movementType: "Press",
    defaultSets: 3,
    defaultReps: 10,
    defaultRest: "60 sec",
    instructions:
      "Use a controlled dip and drive to press the bar overhead.",
    safetyNotes:
      "Keep the bar path controlled.",
  },

  {
    id: "crossfit-foundation-006",
    name: "Push Jerk",
    category: "crossfit",
    subcategory: "foundational",
    muscleGroup: "Shoulders",
    secondaryMuscles: ["Triceps", "Legs", "Core"],
    equipment: "Barbell",
    difficulty: "Advanced",
    movementType: "Jerk",
    defaultSets: 3,
    defaultReps: 8,
    defaultRest: "90 sec",
    instructions:
      "Drive the bar overhead and receive it with a controlled partial squat.",
    safetyNotes:
      "Technical movement requiring qualified coaching.",
  },

  {
    id: "crossfit-foundation-007",
    name: "Deadlift",
    category: "crossfit",
    subcategory: "foundational",
    muscleGroup: "Posterior Chain",
    secondaryMuscles: ["Glutes", "Hamstrings", "Back"],
    equipment: "Barbell",
    difficulty: "Intermediate",
    movementType: "Hinge",
    defaultSets: 3,
    defaultReps: 8,
    defaultRest: "90 sec",
    instructions:
      "Lift the bar from the floor by driving through the feet and extending the hips.",
    safetyNotes:
      "Maintain a neutral spine and appropriate load.",
  },

  {
    id: "crossfit-foundation-008",
    name: "Sumo Deadlift High Pull",
    category: "crossfit",
    subcategory: "foundational",
    muscleGroup: "Full Body",
    secondaryMuscles: ["Shoulders", "Back", "Legs"],
    equipment: "Barbell",
    difficulty: "Advanced",
    movementType: "Pull",
    defaultSets: 3,
    defaultReps: 10,
    defaultRest: "60 sec",
    instructions:
      "Use a wide stance and drive the bar upward through hip extension.",
    safetyNotes:
      "Requires technical instruction.",
  },

  {
    id: "crossfit-foundation-009",
    name: "Medicine Ball Clean",
    category: "crossfit",
    subcategory: "foundational",
    muscleGroup: "Full Body",
    secondaryMuscles: ["Legs", "Shoulders", "Core"],
    equipment: "Medicine Ball",
    difficulty: "Intermediate",
    movementType: "Clean",
    defaultSets: 3,
    defaultReps: 10,
    defaultRest: "60 sec",
    instructions:
      "Lift the medicine ball from the floor and receive it at the chest.",
    safetyNotes:
      "Use a manageable ball weight.",
  },

  // ============================================================
  // CROSSFIT — WEIGHTLIFTING
  // ============================================================

  {
    id: "crossfit-weightlifting-001",
    name: "Power Clean",
    category: "crossfit",
    subcategory: "weightlifting",
    muscleGroup: "Full Body",
    secondaryMuscles: ["Glutes", "Hamstrings", "Shoulders"],
    equipment: "Barbell",
    difficulty: "Advanced",
    movementType: "Olympic Lift",
    defaultSets: 4,
    defaultReps: 5,
    defaultRest: "120 sec",
    instructions:
      "Explosively extend the hips and pull the bar upward before receiving it in the front rack.",
    safetyNotes:
      "Requires qualified coaching and appropriate progression.",
  },

  {
    id: "crossfit-weightlifting-002",
    name: "Clean and Jerk",
    category: "crossfit",
    subcategory: "weightlifting",
    muscleGroup: "Full Body",
    secondaryMuscles: ["Legs", "Back", "Shoulders", "Triceps"],
    equipment: "Barbell",
    difficulty: "Advanced",
    movementType: "Olympic Lift",
    defaultSets: 4,
    defaultReps: 3,
    defaultRest: "150 sec",
    instructions:
      "Perform a clean into the front rack followed by a controlled jerk overhead.",
    safetyNotes:
      "Highly technical movement requiring coaching.",
  },

  {
    id: "crossfit-weightlifting-003",
    name: "Snatch",
    category: "crossfit",
    subcategory: "weightlifting",
    muscleGroup: "Full Body",
    secondaryMuscles: ["Shoulders", "Legs", "Back", "Core"],
    equipment: "Barbell",
    difficulty: "Advanced",
    movementType: "Olympic Lift",
    defaultSets: 4,
    defaultReps: 3,
    defaultRest: "150 sec",
    instructions:
      "Move the bar from the floor to overhead in one continuous movement.",
    safetyNotes:
      "Use technical progression before adding significant load.",
  },

  {
    id: "crossfit-weightlifting-004",
    name: "Hang Power Clean",
    category: "crossfit",
    subcategory: "weightlifting",
    muscleGroup: "Full Body",
    secondaryMuscles: ["Glutes", "Hamstrings", "Shoulders"],
    equipment: "Barbell",
    difficulty: "Advanced",
    movementType: "Olympic Lift",
    defaultSets: 3,
    defaultReps: 5,
    defaultRest: "120 sec",
    instructions:
      "Start from the hang position and explosively extend before receiving the bar.",
    safetyNotes:
      "Technical exercise requiring proper instruction.",
  },

  {
    id: "crossfit-weightlifting-005",
    name: "Power Snatch",
    category: "crossfit",
    subcategory: "weightlifting",
    muscleGroup: "Full Body",
    secondaryMuscles: ["Shoulders", "Legs", "Back"],
    equipment: "Barbell",
    difficulty: "Advanced",
    movementType: "Olympic Lift",
    defaultSets: 3,
    defaultReps: 5,
    defaultRest: "120 sec",
    instructions:
      "Move the bar explosively from the floor to overhead while receiving it in a partial squat.",
    safetyNotes:
      "Technical movement requiring qualified coaching.",
  },

  // ============================================================
  // CROSSFIT — GYMNASTICS
  // ============================================================

  {
    id: "crossfit-gym-001",
    name: "Strict Pull-Up",
    category: "crossfit",
    subcategory: "gymnastics",
    muscleGroup: "Back",
    secondaryMuscles: ["Biceps", "Core"],
    equipment: "Pull-Up Bar",
    difficulty: "Advanced",
    movementType: "Pull",
    defaultSets: 3,
    defaultReps: 5,
    defaultRest: "90 sec",
    instructions:
      "Pull the body upward using controlled upper-body strength.",
    safetyNotes:
      "Use an assisted variation if full repetitions are not available.",
  },

  {
    id: "crossfit-gym-002",
    name: "Kipping Pull-Up",
    category: "crossfit",
    subcategory: "gymnastics",
    muscleGroup: "Back",
    secondaryMuscles: ["Biceps", "Core"],
    equipment: "Pull-Up Bar",
    difficulty: "Advanced",
    movementType: "Gymnastics",
    defaultSets: 3,
    defaultReps: 8,
    defaultRest: "90 sec",
    instructions:
      "Use a controlled kip to assist the body through the pull-up.",
    safetyNotes:
      "Requires adequate pulling strength and movement skill.",
  },

  {
    id: "crossfit-gym-003",
    name: "Ring Row",
    category: "crossfit",
    subcategory: "gymnastics",
    muscleGroup: "Upper Back",
    secondaryMuscles: ["Biceps", "Core"],
    equipment: "Gymnastic Rings",
    difficulty: "Beginner",
    movementType: "Pull",
    defaultSets: 3,
    defaultReps: 10,
    defaultRest: "60 sec",
    instructions:
      "Pull the chest toward the rings while maintaining a straight body line.",
    safetyNotes:
      "Adjust body angle to control difficulty.",
  },

  {
    id: "crossfit-gym-004",
    name: "Ring Dip",
    category: "crossfit",
    subcategory: "gymnastics",
    muscleGroup: "Triceps",
    secondaryMuscles: ["Chest", "Shoulders"],
    equipment: "Gymnastic Rings",
    difficulty: "Advanced",
    movementType: "Push",
    defaultSets: 3,
    defaultReps: 6,
    defaultRest: "90 sec",
    instructions:
      "Lower and press the body between the rings with controlled movement.",
    safetyNotes:
      "Requires shoulder stability and adequate strength.",
  },

  {
    id: "crossfit-gym-005",
    name: "Burpee",
    category: "crossfit",
    subcategory: "gymnastics",
    muscleGroup: "Full Body",
    secondaryMuscles: ["Chest", "Legs", "Core"],
    equipment: "Bodyweight",
    difficulty: "Intermediate",
    movementType: "Conditioning",
    defaultSets: 3,
    defaultReps: 10,
    defaultRest: "45 sec",
    instructions:
      "Move from standing to the floor and return to standing using controlled continuous movement.",
    safetyNotes:
      "Scale the movement when fatigue causes loss of technique.",
  },

  {
    id: "crossfit-gym-006",
    name: "Box Jump",
    category: "crossfit",
    subcategory: "gymnastics",
    muscleGroup: "Lower Body",
    secondaryMuscles: ["Glutes", "Calves", "Core"],
    equipment: "Plyometric Box",
    difficulty: "Intermediate",
    movementType: "Jump",
    defaultSets: 3,
    defaultReps: 10,
    defaultRest: "60 sec",
    instructions:
      "Jump onto a stable box and step down under control.",
    safetyNotes:
      "Use a box height appropriate for the athlete.",
  },

  {
    id: "crossfit-gym-007",
    name: "Box Step-Up",
    category: "crossfit",
    subcategory: "gymnastics",
    muscleGroup: "Lower Body",
    secondaryMuscles: ["Glutes", "Quadriceps"],
    equipment: "Plyometric Box",
    difficulty: "Beginner",
    movementType: "Step",
    defaultSets: 3,
    defaultReps: 10,
    defaultRest: "45 sec",
    instructions:
      "Step onto the box using one leg and return under control.",
    safetyNotes:
      "Use a stable box and appropriate height.",
  },

  {
    id: "crossfit-gym-008",
    name: "Handstand Hold",
    category: "crossfit",
    subcategory: "gymnastics",
    muscleGroup: "Shoulders",
    secondaryMuscles: ["Core", "Triceps"],
    equipment: "Bodyweight",
    difficulty: "Advanced",
    movementType: "Gymnastics",
    defaultSets: 3,
    defaultReps: 30,
    defaultRest: "60 sec",
    instructions:
      "Maintain a controlled inverted body position.",
    safetyNotes:
      "Perform near a safe surface and use appropriate progression.",
  },

  // ============================================================
  // CROSSFIT — KETTLEBELL
  // ============================================================

  {
    id: "crossfit-kb-001",
    name: "Kettlebell Swing",
    category: "crossfit",
    subcategory: "kettlebell",
    muscleGroup: "Posterior Chain",
    secondaryMuscles: ["Shoulders", "Core"],
    equipment: "Kettlebell",
    difficulty: "Beginner",
    movementType: "Hinge",
    defaultSets: 3,
    defaultReps: 15,
    defaultRest: "60 sec",
    instructions:
      "Drive the kettlebell using hip extension and allow it to swing naturally.",
    safetyNotes:
      "The movement should come from the hips rather than lifting with the arms.",
  },

  {
    id: "crossfit-kb-002",
    name: "Kettlebell Goblet Squat",
    category: "crossfit",
    subcategory: "kettlebell",
    muscleGroup: "Quadriceps",
    secondaryMuscles: ["Glutes", "Core"],
    equipment: "Kettlebell",
    difficulty: "Beginner",
    movementType: "Squat",
    defaultSets: 3,
    defaultReps: 12,
    defaultRest: "45 sec",
    instructions:
      "Hold the kettlebell at the chest and perform a controlled squat.",
    safetyNotes:
      "Maintain stable posture.",
  },

  {
    id: "crossfit-kb-003",
    name: "Kettlebell Snatch",
    category: "crossfit",
    subcategory: "kettlebell",
    muscleGroup: "Full Body",
    secondaryMuscles: ["Shoulders", "Glutes", "Core"],
    equipment: "Kettlebell",
    difficulty: "Advanced",
    movementType: "Power",
    defaultSets: 3,
    defaultReps: 8,
    defaultRest: "60 sec",
    instructions:
      "Drive the kettlebell upward using hip extension and receive it overhead under control.",
    safetyNotes:
      "Requires technical instruction.",
  },

  {
    id: "crossfit-kb-004",
    name: "Farmer Carry",
    category: "crossfit",
    subcategory: "kettlebell",
    muscleGroup: "Full Body",
    secondaryMuscles: ["Grip", "Core", "Shoulders"],
    equipment: "Kettlebells",
    difficulty: "Beginner",
    movementType: "Carry",
    defaultSets: 3,
    defaultReps: 30,
    defaultRest: "60 sec",
    instructions:
      "Carry the weights while maintaining an upright and controlled posture.",
    safetyNotes:
      "Use a manageable load and clear walking path.",
  },

  // ============================================================
  // CROSSFIT — DUMBBELL
  // ============================================================

  {
    id: "crossfit-db-001",
    name: "Dumbbell Thruster",
    category: "crossfit",
    subcategory: "dumbbell",
    muscleGroup: "Full Body",
    secondaryMuscles: ["Legs", "Shoulders", "Core"],
    equipment: "Dumbbells",
    difficulty: "Intermediate",
    movementType: "Compound",
    defaultSets: 3,
    defaultReps: 10,
    defaultRest: "60 sec",
    instructions:
      "Perform a squat and use the upward drive to press the dumbbells overhead.",
    safetyNotes:
      "Use a load that allows controlled repetitions.",
  },

  {
    id: "crossfit-db-002",
    name: "Dumbbell Clean",
    category: "crossfit",
    subcategory: "dumbbell",
    muscleGroup: "Full Body",
    secondaryMuscles: ["Legs", "Shoulders", "Back"],
    equipment: "Dumbbells",
    difficulty: "Intermediate",
    movementType: "Clean",
    defaultSets: 3,
    defaultReps: 10,
    defaultRest: "60 sec",
    instructions:
      "Lift the dumbbells from the floor to the shoulders using hip extension.",
    safetyNotes:
      "Maintain control throughout the movement.",
  },

  {
    id: "crossfit-db-003",
    name: "Dumbbell Push Press",
    category: "crossfit",
    subcategory: "dumbbell",
    muscleGroup: "Shoulders",
    secondaryMuscles: ["Triceps", "Legs", "Core"],
    equipment: "Dumbbells",
    difficulty: "Intermediate",
    movementType: "Press",
    defaultSets: 3,
    defaultReps: 10,
    defaultRest: "60 sec",
    instructions:
      "Use a small leg drive to press the dumbbells overhead.",
    safetyNotes:
      "Keep the movement controlled.",
  },

  {
    id: "crossfit-db-004",
    name: "Dumbbell Front-Rack Lunge",
    category: "crossfit",
    subcategory: "dumbbell",
    muscleGroup: "Lower Body",
    secondaryMuscles: ["Core", "Shoulders"],
    equipment: "Dumbbells",
    difficulty: "Intermediate",
    movementType: "Lunge",
    defaultSets: 3,
    defaultReps: 10,
    defaultRest: "60 sec",
    instructions:
      "Hold the dumbbells at shoulder level while performing controlled lunges.",
    safetyNotes:
      "Maintain balance and controlled knee alignment.",
  },

  // ============================================================
  // CROSSFIT — CORE
  // ============================================================

  {
    id: "crossfit-core-001",
    name: "AbMat Sit-Up",
    category: "crossfit",
    subcategory: "core",
    muscleGroup: "Abdominals",
    secondaryMuscles: ["Hip Flexors"],
    equipment: "AbMat",
    difficulty: "Beginner",
    movementType: "Core",
    defaultSets: 3,
    defaultReps: 15,
    defaultRest: "45 sec",
    instructions:
      "Perform controlled sit-ups using the full comfortable range of motion.",
    safetyNotes:
      "Avoid forcing painful range of motion.",
  },

  {
    id: "crossfit-core-002",
    name: "Toes-to-Bar",
    category: "crossfit",
    subcategory: "core",
    muscleGroup: "Abdominals",
    secondaryMuscles: ["Hip Flexors", "Grip"],
    equipment: "Pull-Up Bar",
    difficulty: "Advanced",
    movementType: "Gymnastics",
    defaultSets: 3,
    defaultReps: 8,
    defaultRest: "60 sec",
    instructions:
      "Raise the feet toward the bar using controlled core and hip movement.",
    safetyNotes:
      "Use a scaled variation if control is insufficient.",
  },

  {
    id: "crossfit-core-003",
    name: "Plank",
    category: "crossfit",
    subcategory: "core",
    muscleGroup: "Core",
    secondaryMuscles: ["Shoulders", "Glutes"],
    equipment: "Bodyweight",
    difficulty: "Beginner",
    movementType: "Isometric",
    defaultSets: 3,
    defaultReps: 30,
    defaultRest: "30 sec",
    instructions:
      "Maintain a straight body position while bracing the core.",
    safetyNotes:
      "Stop if proper body alignment cannot be maintained.",
  },

  {
    id: "crossfit-core-004",
    name: "GHD Sit-Up",
    category: "crossfit",
    subcategory: "core",
    muscleGroup: "Abdominals",
    secondaryMuscles: ["Hip Flexors"],
    equipment: "GHD Machine",
    difficulty: "Advanced",
    movementType: "Core",
    defaultSets: 3,
    defaultReps: 10,
    defaultRest: "60 sec",
    instructions:
      "Perform controlled trunk flexion and extension on the GHD.",
    safetyNotes:
      "Requires proper instruction and appropriate range of motion.",
  },

  // ============================================================
  // CROSSFIT — CONDITIONING
  // ============================================================

  {
    id: "crossfit-conditioning-001",
    name: "Rowing",
    category: "crossfit",
    subcategory: "conditioning",
    muscleGroup: "Full Body",
    secondaryMuscles: ["Legs", "Back", "Core"],
    equipment: "Rowing Machine",
    difficulty: "Beginner",
    movementType: "Conditioning",
    defaultSets: 3,
    defaultReps: 500,
    defaultRest: "90 sec",
    instructions:
      "Use coordinated leg drive, hip movement and arm pull while maintaining rhythm.",
    safetyNotes:
      "Maintain controlled technique as fatigue increases.",
  },

  {
    id: "crossfit-conditioning-002",
    name: "Running",
    category: "crossfit",
    subcategory: "conditioning",
    muscleGroup: "Lower Body",
    secondaryMuscles: ["Core"],
    equipment: "None",
    difficulty: "Beginner",
    movementType: "Conditioning",
    defaultSets: 1,
    defaultReps: 800,
    defaultRest: "120 sec",
    instructions:
      "Run at a pace appropriate for the workout and fitness level.",
    safetyNotes:
      "Adjust distance and intensity according to ability.",
  },

  {
    id: "crossfit-conditioning-003",
    name: "Double-Under",
    category: "crossfit",
    subcategory: "conditioning",
    muscleGroup: "Lower Body",
    secondaryMuscles: ["Calves", "Shoulders", "Core"],
    equipment: "Jump Rope",
    difficulty: "Advanced",
    movementType: "Jump",
    defaultSets: 3,
    defaultReps: 30,
    defaultRest: "60 sec",
    instructions:
      "Jump while rotating the rope twice beneath the feet during each jump.",
    safetyNotes:
      "Use single-unders as a progression.",
  },

  {
    id: "crossfit-conditioning-004",
    name: "Single-Under",
    category: "crossfit",
    subcategory: "conditioning",
    muscleGroup: "Lower Body",
    secondaryMuscles: ["Calves", "Shoulders"],
    equipment: "Jump Rope",
    difficulty: "Beginner",
    movementType: "Jump",
    defaultSets: 3,
    defaultReps: 50,
    defaultRest: "45 sec",
    instructions:
      "Perform controlled jumps while passing the rope once under the feet.",
    safetyNotes:
      "Use a clear training area.",
  },

  // ============================================================
  // TABATA — UPPER BODY
  // ============================================================

  {
    id: "tabata-upper-001",
    name: "Tabata Push-Ups",
    category: "tabata",
    subcategory: "upper_body",
    muscleGroup: "Chest",
    secondaryMuscles: ["Triceps", "Shoulders", "Core"],
    equipment: "Bodyweight",
    difficulty: "Intermediate",
    movementType: "Tabata",
    workInterval: 20,
    restInterval: 10,
    rounds: 8,
    instructions:
      "Perform controlled push-ups during each 20-second work interval.",
    safetyNotes:
      "Use knee or incline push-ups if needed to maintain form.",
  },

  {
    id: "tabata-upper-002",
    name: "Tabata Shoulder Taps",
    category: "tabata",
    subcategory: "upper_body",
    muscleGroup: "Shoulders",
    secondaryMuscles: ["Core", "Chest"],
    equipment: "Bodyweight",
    difficulty: "Intermediate",
    movementType: "Tabata",
    workInterval: 20,
    restInterval: 10,
    rounds: 8,
    instructions:
      "From a stable plank position, tap opposite shoulders while minimizing hip rotation.",
    safetyNotes:
      "Reduce speed if body control is lost.",
  },

  {
    id: "tabata-upper-003",
    name: "Tabata Dumbbell Press",
    category: "tabata",
    subcategory: "upper_body",
    muscleGroup: "Chest",
    secondaryMuscles: ["Shoulders", "Triceps"],
    equipment: "Dumbbells",
    difficulty: "Intermediate",
    movementType: "Tabata",
    workInterval: 20,
    restInterval: 10,
    rounds: 8,
    instructions:
      "Perform controlled dumbbell presses during each work interval.",
    safetyNotes:
      "Use a light load suitable for repeated intervals.",
  },

  {
    id: "tabata-upper-004",
    name: "Tabata Mountain Climbers",
    category: "tabata",
    subcategory: "upper_body",
    muscleGroup: "Full Body",
    secondaryMuscles: ["Shoulders", "Core", "Legs"],
    equipment: "Bodyweight",
    difficulty: "Intermediate",
    movementType: "Tabata",
    workInterval: 20,
    restInterval: 10,
    rounds: 8,
    instructions:
      "From a plank position, drive the knees forward in alternating repetitions.",
    safetyNotes:
      "Maintain a stable shoulder position.",
  },

  // ============================================================
  // TABATA — LOWER BODY
  // ============================================================

  {
    id: "tabata-lower-001",
    name: "Tabata Air Squats",
    category: "tabata",
    subcategory: "lower_body",
    muscleGroup: "Quadriceps",
    secondaryMuscles: ["Glutes", "Core"],
    equipment: "Bodyweight",
    difficulty: "Beginner",
    movementType: "Tabata",
    workInterval: 20,
    restInterval: 10,
    rounds: 8,
    instructions:
      "Perform controlled bodyweight squats during each work interval.",
    safetyNotes:
      "Maintain proper squat mechanics as fatigue increases.",
  },

  {
    id: "tabata-lower-002",
    name: "Tabata Reverse Lunges",
    category: "tabata",
    subcategory: "lower_body",
    muscleGroup: "Legs",
    secondaryMuscles: ["Glutes", "Hamstrings"],
    equipment: "Bodyweight",
    difficulty: "Intermediate",
    movementType: "Tabata",
    workInterval: 20,
    restInterval: 10,
    rounds: 8,
    instructions:
      "Alternate controlled reverse lunges throughout the work interval.",
    safetyNotes:
      "Use a reduced range or support if balance is limited.",
  },

  {
    id: "tabata-lower-003",
    name: "Tabata Glute Bridges",
    category: "tabata",
    subcategory: "lower_body",
    muscleGroup: "Glutes",
    secondaryMuscles: ["Hamstrings"],
    equipment: "Bodyweight",
    difficulty: "Beginner",
    movementType: "Tabata",
    workInterval: 20,
    restInterval: 10,
    rounds: 8,
    instructions:
      "Raise and lower the hips with controlled glute contraction.",
    safetyNotes:
      "Avoid excessive lower-back arching.",
  },

  {
    id: "tabata-lower-004",
    name: "Tabata Jump Squats",
    category: "tabata",
    subcategory: "lower_body",
    muscleGroup: "Lower Body",
    secondaryMuscles: ["Glutes", "Calves"],
    equipment: "Bodyweight",
    difficulty: "Advanced",
    movementType: "Tabata",
    workInterval: 20,
    restInterval: 10,
    rounds: 8,
    instructions:
      "Perform controlled squats followed by an explosive jump.",
    safetyNotes:
      "Use regular squats as a lower-impact alternative.",
  },

  // ============================================================
  // TABATA — FULL BODY
  // ============================================================

  {
    id: "tabata-full-001",
    name: "Tabata Burpees",
    category: "tabata",
    subcategory: "full_body",
    muscleGroup: "Full Body",
    secondaryMuscles: ["Chest", "Legs", "Core"],
    equipment: "Bodyweight",
    difficulty: "Advanced",
    movementType: "Tabata",
    workInterval: 20,
    restInterval: 10,
    rounds: 8,
    instructions:
      "Perform controlled burpees during each work interval.",
    safetyNotes:
      "Use a step-back version for lower impact.",
  },

  {
    id: "tabata-full-002",
    name: "Tabata High Knees",
    category: "tabata",
    subcategory: "full_body",
    muscleGroup: "Full Body",
    secondaryMuscles: ["Core", "Calves"],
    equipment: "Bodyweight",
    difficulty: "Intermediate",
    movementType: "Tabata",
    workInterval: 20,
    restInterval: 10,
    rounds: 8,
    instructions:
      "Run in place while driving the knees upward at a controlled high intensity.",
    safetyNotes:
      "Reduce pace if balance or technique deteriorates.",
  },

  {
    id: "tabata-full-003",
    name: "Tabata Kettlebell Swings",
    category: "tabata",
    subcategory: "full_body",
    muscleGroup: "Posterior Chain",
    secondaryMuscles: ["Shoulders", "Core"],
    equipment: "Kettlebell",
    difficulty: "Intermediate",
    movementType: "Tabata",
    workInterval: 20,
    restInterval: 10,
    rounds: 8,
    instructions:
      "Perform controlled kettlebell swings using hip drive.",
    safetyNotes:
      "Use a manageable kettlebell weight.",
  },

  {
    id: "tabata-full-004",
    name: "Tabata Mountain Climbers",
    category: "tabata",
    subcategory: "full_body",
    muscleGroup: "Full Body",
    secondaryMuscles: ["Core", "Shoulders", "Legs"],
    equipment: "Bodyweight",
    difficulty: "Intermediate",
    movementType: "Tabata",
    workInterval: 20,
    restInterval: 10,
    rounds: 8,
    instructions:
      "Alternate knee drives from a stable plank position.",
    safetyNotes:
      "Maintain controlled shoulder and hip positioning.",
  },

  // ============================================================
  // TABATA — CORE
  // ============================================================

  {
    id: "tabata-core-001",
    name: "Tabata Plank",
    category: "tabata",
    subcategory: "core",
    muscleGroup: "Core",
    secondaryMuscles: ["Shoulders", "Glutes"],
    equipment: "Bodyweight",
    difficulty: "Beginner",
    movementType: "Tabata",
    workInterval: 20,
    restInterval: 10,
    rounds: 8,
    instructions:
      "Hold a stable plank position during each work interval.",
    safetyNotes:
      "Maintain a neutral spine.",
  },

  {
    id: "tabata-core-002",
    name: "Tabata Bicycle Crunch",
    category: "tabata",
    subcategory: "core",
    muscleGroup: "Abdominals",
    secondaryMuscles: ["Obliques"],
    equipment: "Bodyweight",
    difficulty: "Intermediate",
    movementType: "Tabata",
    workInterval: 20,
    restInterval: 10,
    rounds: 8,
    instructions:
      "Alternate elbow-to-opposite-knee movements in a controlled rhythm.",
    safetyNotes:
      "Avoid pulling aggressively on the neck.",
  },

  {
    id: "tabata-core-003",
    name: "Tabata Dead Bug",
    category: "tabata",
    subcategory: "core",
    muscleGroup: "Core",
    secondaryMuscles: ["Hip Flexors"],
    equipment: "Bodyweight",
    difficulty: "Beginner",
    movementType: "Tabata",
    workInterval: 20,
    restInterval: 10,
    rounds: 8,
    instructions:
      "Alternate opposite arm and leg movements while maintaining core control.",
    safetyNotes:
      "Keep the lower back controlled against the floor.",
  },

  // ============================================================
  // TABATA — CARDIO
  // ============================================================

  {
    id: "tabata-cardio-001",
    name: "Tabata Jumping Jacks",
    category: "tabata",
    subcategory: "cardio",
    muscleGroup: "Full Body",
    secondaryMuscles: ["Calves", "Shoulders"],
    equipment: "Bodyweight",
    difficulty: "Beginner",
    movementType: "Tabata",
    workInterval: 20,
    restInterval: 10,
    rounds: 8,
    instructions:
      "Perform rhythmic jumping jacks throughout each work interval.",
    safetyNotes:
      "Use step-out jacks as a lower-impact alternative.",
  },

  {
    id: "tabata-cardio-002",
    name: "Tabata Skaters",
    category: "tabata",
    subcategory: "cardio",
    muscleGroup: "Lower Body",
    secondaryMuscles: ["Glutes", "Core"],
    equipment: "Bodyweight",
    difficulty: "Intermediate",
    movementType: "Tabata",
    workInterval: 20,
    restInterval: 10,
    rounds: 8,
    instructions:
      "Move laterally from one leg to the other with controlled landing.",
    safetyNotes:
      "Reduce jump distance when necessary.",
  },

  {
    id: "tabata-cardio-003",
    name: "Tabata Fast Feet",
    category: "tabata",
    subcategory: "cardio",
    muscleGroup: "Lower Body",
    secondaryMuscles: ["Calves", "Core"],
    equipment: "Bodyweight",
    difficulty: "Intermediate",
    movementType: "Tabata",
    workInterval: 20,
    restInterval: 10,
    rounds: 8,
    instructions:
      "Perform quick controlled foot movements while maintaining balance.",
    safetyNotes:
      "Keep the training surface clear.",
  },
]

export default exerciseCatalog