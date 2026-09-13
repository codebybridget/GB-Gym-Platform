function ProgressBar({ value = 0, label = "Progress" }) {
  const progress = Math.min(Math.max(value, 0), 100)

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-semibold text-white">{label}</span>

        <span className="text-sm font-bold text-lime-400">
          {progress}%
        </span>
      </div>

      <div className="h-2.5 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-lime-400 transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  )
}

export default ProgressBar