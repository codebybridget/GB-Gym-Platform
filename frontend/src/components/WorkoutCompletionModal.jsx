import {
  Check,
  Clock3,
  Dumbbell,
  X,
} from "lucide-react"

function WorkoutCompletionModal({
  duration,
  completedSets,
  totalSets,
  onConfirm,
  onCancel,
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 p-0 backdrop-blur-sm sm:items-center sm:p-5">
      <div className="w-full max-w-md rounded-t-3xl bg-white p-6 text-black sm:rounded-3xl">
        <div className="flex items-start justify-between">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-lime-400">
            <Dumbbell size={22} />
          </div>

          <button
            type="button"
            onClick={onCancel}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mt-5">
          <p className="text-xs font-bold uppercase tracking-wider text-gray-500">
            Workout Complete
          </p>

          <h2 className="mt-1 text-2xl font-black">
            Great work!
          </h2>

          <p className="mt-2 text-sm leading-6 text-gray-500">
            You have completed every prescribed set for today's workout.
            Are you ready to finish the session?
          </p>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-gray-100 p-4">
            <div className="flex items-center gap-2">
              <Check
                size={15}
                className="text-lime-600"
              />

              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                Sets
              </p>
            </div>

            <p className="mt-2 text-xl font-black">
              {completedSets}/{totalSets}
            </p>
          </div>

          <div className="rounded-2xl bg-gray-100 p-4">
            <div className="flex items-center gap-2">
              <Clock3
                size={15}
                className="text-gray-500"
              />

              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                Duration
              </p>
            </div>

            <p className="mt-2 text-xl font-black">
              {duration}
            </p>
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-2xl bg-gray-100 px-4 py-4 text-sm font-black"
          >
            NOT YET
          </button>

          <button
            type="button"
            onClick={onConfirm}
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-lime-400 px-4 py-4 text-sm font-black text-black"
          >
            <Check size={17} />
            COMPLETE
          </button>
        </div>
      </div>
    </div>
  )
}

export default WorkoutCompletionModal