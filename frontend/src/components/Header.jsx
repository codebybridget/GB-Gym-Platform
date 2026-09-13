import { Bell } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useGym } from "../context/GymContext.jsx"

function Header() {
  const navigate = useNavigate()
  const { gym } = useGym() || {}
  const name = gym?.name || "GB Gym"

  return (
    <header className="border-b border-white/10 bg-black">
      <div className="mx-auto flex max-w-md items-center justify-between px-5 py-4">
        <div className="flex min-w-0 items-center gap-3">
          {gym?.logoUrl ? (
            <img src={gym.logoUrl} alt={`${name} logo`} className="h-10 w-10 shrink-0 rounded-xl object-cover" />
          ) : (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-yellow-400 text-sm font-black text-black">
              {name.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <p className="truncate text-lg font-black tracking-tight text-white">{name}</p>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-lime-400">Powered by GB</p>
          </div>
        </div>
        <button type="button" aria-label="Notifications" onClick={() => navigate("/notifications")} className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/15">
          <Bell size={20} strokeWidth={2} />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-yellow-400" />
        </button>
      </div>
    </header>
  )
}
export default Header
