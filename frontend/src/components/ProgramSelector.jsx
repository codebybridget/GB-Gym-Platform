import { ChevronDown, Dumbbell } from "lucide-react"

function ProgramSelector({
  programs,
  selectedProgram,
  onProgramChange,
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-400 text-black">
          <Dumbbell size={19} />
        </div>

        <div className="flex-1">
          <p className="text-xs font-bold uppercase tracking-wider text-gray-500">
            Training program
          </p>

          <p className="mt-1 text-sm font-bold text-white">
            Select workout program
          </p>
        </div>
      </div>

      <div className="relative mt-4">
        <select
          value={selectedProgram}
          onChange={(event) =>
            onProgramChange(event.target.value)
          }
          className="w-full appearance-none rounded-2xl border border-white/10 bg-black px-4 py-4 pr-10 text-sm font-bold text-white outline-none transition focus:border-yellow-400"
        >
          {programs.map((program) => (
            <option
              key={program.id}
              value={program.id}
              className="bg-black text-white"
            >
              {program.name}
            </option>
          ))}
        </select>

        <ChevronDown
          size={18}
          className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-500"
        />
      </div>
    </div>
  )
}

export default ProgramSelector