import {
  Dumbbell,
  Scale,
  Target,
  TrendingUp,
} from "lucide-react"

const goals = [
  {
    id: "lose_weight",
    label: "Lose Weight",
    description:
      "Reduce body weight and improve body composition.",
    icon: Scale,
  },
  {
    id: "keep_fit",
    label: "Keep Fit",
    description:
      "Maintain your fitness, strength and overall health.",
    icon: Dumbbell,
  },
  {
    id: "gain_weight",
    label: "Gain Weight",
    description:
      "Build healthy body weight and muscle.",
    icon: TrendingUp,
  },
  {
    id: "become_trainer",
    label: "Train to Become a Trainer",
    description:
      "Develop your fitness knowledge and training ability.",
    icon: Target,
  },
]

function FitnessGoalSelector({
  value,
  onChange,
}) {
  return (
    <div className="space-y-3">
      {goals.map((goal) => {
        const Icon = goal.icon
        const selected =
          value === goal.id

        return (
          <button
            key={goal.id}
            type="button"
            onClick={() =>
              onChange(goal.id)
            }
            className={`flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition ${
              selected
                ? "border-lime-400 bg-lime-400/10"
                : "border-white/10 bg-white/5 hover:border-yellow-400/30"
            }`}
          >
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                selected
                  ? "bg-lime-400 text-black"
                  : "bg-white/5 text-gray-500"
              }`}
            >
              <Icon size={18} />
            </div>

            <div className="flex-1">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-black">
                  {goal.label}
                </p>

                <div
                  className={`h-4 w-4 rounded-full border ${
                    selected
                      ? "border-lime-400 bg-lime-400"
                      : "border-white/20"
                  }`}
                />
              </div>

              <p className="mt-1 text-xs leading-5 text-gray-600">
                {goal.description}
              </p>
            </div>
          </button>
        )
      })}
    </div>
  )
}

export default FitnessGoalSelector