const workoutPrograms = {
  "upper-body": {
    id: "upper-body",
    name: "Upper Body",
    category: "Upper Body",
    description: "Upper-body strength and conditioning workout.",
    estimatedDuration: 60,

    exercises: [
      {
        id: "bench-press",
        name: "Barbell Bench Press",
        sets: 4,
        reps: 10,
        weight: "40 kg",
        rest: "90 sec",
        media: {
          type: "image",
          url: "",
        },
      },
      {
        id: "lat-pulldown",
        name: "Lat Pulldown",
        sets: 3,
        reps: 12,
        weight: "35 kg",
        rest: "60 sec",
        media: {
          type: "image",
          url: "",
        },
      },
      {
        id: "shoulder-press",
        name: "Shoulder Press",
        sets: 3,
        reps: 10,
        weight: "15 kg",
        rest: "60 sec",
        media: {
          type: "image",
          url: "",
        },
      },
      {
        id: "seated-cable-row",
        name: "Seated Cable Row",
        sets: 3,
        reps: 12,
        weight: "30 kg",
        rest: "60 sec",
        media: {
          type: "image",
          url: "",
        },
      },
      {
        id: "bicep-curl",
        name: "Bicep Curl",
        sets: 3,
        reps: 12,
        weight: "10 kg",
        rest: "45 sec",
        media: {
          type: "image",
          url: "",
        },
      },
      {
        id: "tricep-pushdown",
        name: "Tricep Pushdown",
        sets: 2,
        reps: 15,
        weight: "20 kg",
        rest: "45 sec",
        media: {
          type: "image",
          url: "",
        },
      },
    ],
  },

  "lower-body": {
    id: "lower-body",
    name: "Lower Body",
    category: "Lower Body",
    description: "Lower-body strength and conditioning workout.",
    estimatedDuration: 55,

    exercises: [
      {
        id: "squat",
        name: "Barbell Squat",
        sets: 4,
        reps: 10,
        weight: "40 kg",
        rest: "90 sec",
        media: {
          type: "image",
          url: "",
        },
      },
      {
        id: "leg-press",
        name: "Leg Press",
        sets: 3,
        reps: 12,
        weight: "60 kg",
        rest: "60 sec",
        media: {
          type: "image",
          url: "",
        },
      },
      {
        id: "walking-lunge",
        name: "Walking Lunges",
        sets: 3,
        reps: 12,
        weight: "10 kg",
        rest: "60 sec",
        media: {
          type: "image",
          url: "",
        },
      },
      {
        id: "leg-curl",
        name: "Leg Curl",
        sets: 3,
        reps: 12,
        weight: "25 kg",
        rest: "60 sec",
        media: {
          type: "image",
          url: "",
        },
      },
    ],
  },

  "crossfit": {
    id: "crossfit",
    name: "CrossFit",
    category: "General Body",
    description: "High-intensity general-body functional training.",
    estimatedDuration: 60,

    exercises: [
      {
        id: "burpees",
        name: "Burpees",
        sets: 3,
        reps: 15,
        weight: "Bodyweight",
        rest: "45 sec",
        media: {
          type: "video",
          url: "",
        },
      },
      {
        id: "kettlebell-swings",
        name: "Kettlebell Swings",
        sets: 3,
        reps: 15,
        weight: "12 kg",
        rest: "60 sec",
        media: {
          type: "video",
          url: "",
        },
      },
      {
        id: "box-jumps",
        name: "Box Jumps",
        sets: 3,
        reps: 10,
        weight: "Bodyweight",
        rest: "60 sec",
        media: {
          type: "video",
          url: "",
        },
      },
    ],
  },

  tabata: {
    id: "tabata",
    name: "Tabata",
    category: "Saturday Class",
    description: "High-intensity Tabata training session.",
    estimatedDuration: 60,

    exercises: [
      {
        id: "tabata-squats",
        name: "Tabata Squats",
        sets: 8,
        reps: 20,
        weight: "Bodyweight",
        rest: "10 sec",
        media: {
          type: "video",
          url: "",
        },
      },
      {
        id: "tabata-burpees",
        name: "Tabata Burpees",
        sets: 8,
        reps: 10,
        weight: "Bodyweight",
        rest: "10 sec",
        media: {
          type: "video",
          url: "",
        },
      },
      {
        id: "tabata-mountain-climbers",
        name: "Tabata Mountain Climbers",
        sets: 8,
        reps: 20,
        weight: "Bodyweight",
        rest: "10 sec",
        media: {
          type: "video",
          url: "",
        },
      },
    ],
  },

  "weight-loss": {
    id: "weight-loss",
    name: "Weight Loss",
    category: "Weight Loss Program",
    description: "Cardio and conditioning program focused on weight management.",
    estimatedDuration: 50,

    exercises: [
      {
        id: "treadmill-walk",
        name: "Treadmill Walk",
        sets: 1,
        reps: 1,
        weight: "20 min",
        rest: "2 min",
        media: {
          type: "video",
          url: "",
        },
      },
      {
        id: "step-ups",
        name: "Step Ups",
        sets: 3,
        reps: 15,
        weight: "Bodyweight",
        rest: "45 sec",
        media: {
          type: "video",
          url: "",
        },
      },
      {
        id: "mountain-climbers",
        name: "Mountain Climbers",
        sets: 3,
        reps: 20,
        weight: "Bodyweight",
        rest: "45 sec",
        media: {
          type: "video",
          url: "",
        },
      },
    ],
  },
}

export { workoutPrograms }