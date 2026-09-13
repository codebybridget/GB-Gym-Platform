const programs = [
  {
    id: "upper-body",
    name: "Upper Body",
    category: "Upper Body",
    description: "Upper-body strength and conditioning program.",
    estimatedDuration: 60,
    exercises: [
      {
        exerciseId: "EX-001",
        sets: 4,
        reps: 10,
        weight: "40 kg",
        rest: "90 sec",
      },
      {
        exerciseId: "EX-002",
        sets: 3,
        reps: 12,
        weight: "35 kg",
        rest: "60 sec",
      },
      {
        exerciseId: "EX-003",
        sets: 3,
        reps: 10,
        weight: "15 kg",
        rest: "60 sec",
      },
    ],
  },

  {
    id: "lower-body",
    name: "Lower Body",
    category: "Lower Body",
    description: "Lower-body strength and conditioning program.",
    estimatedDuration: 55,
    exercises: [
      {
        exerciseId: "EX-004",
        sets: 4,
        reps: 10,
        weight: "40 kg",
        rest: "90 sec",
      },
      {
        exerciseId: "EX-005",
        sets: 3,
        reps: 12,
        weight: "60 kg",
        rest: "60 sec",
      },
      {
        exerciseId: "EX-006",
        sets: 3,
        reps: 12,
        weight: "10 kg",
        rest: "60 sec",
      },
    ],
  },

  {
    id: "crossfit",
    name: "CrossFit",
    category: "General Body",
    description: "Friday general-body CrossFit training.",
    estimatedDuration: 60,
    exercises: [
      {
        exerciseId: "EX-007",
        sets: 3,
        reps: 15,
        weight: "Bodyweight",
        rest: "45 sec",
      },
      {
        exerciseId: "EX-008",
        sets: 3,
        reps: 15,
        weight: "12 kg",
        rest: "60 sec",
      },
    ],
  },

  {
    id: "weight-loss",
    name: "Weight Loss",
    category: "Weight Loss",
    description: "Cardio and conditioning program for members focused on weight loss.",
    estimatedDuration: 50,
    exercises: [
      {
        exerciseId: "EX-009",
        sets: 3,
        reps: 20,
        weight: "Bodyweight",
        rest: "45 sec",
      },
      {
        exerciseId: "EX-006",
        sets: 3,
        reps: 12,
        weight: "Bodyweight",
        rest: "45 sec",
      },
    ],
  },

  {
    id: "tabata",
    name: "Tabata",
    category: "Saturday Class",
    description: "Saturday morning Tabata training.",
    estimatedDuration: 60,
    exercises: [
      {
        exerciseId: "EX-004",
        sets: 8,
        reps: 20,
        weight: "Bodyweight",
        rest: "10 sec",
      },
      {
        exerciseId: "EX-007",
        sets: 8,
        reps: 10,
        weight: "Bodyweight",
        rest: "10 sec",
      },
    ],
  },
]

export default programs