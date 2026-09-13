import { ExternalLink, ArrowLeft } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useGym } from "../context/GymContext"

const items = [
  ["instagram", "Instagram", "ig"],
  ["facebook", "Facebook", "f"],
  ["tiktok", "TikTok", "tt"],
  ["youtube", "YouTube", "yt"],
  ["x", "X", "x"],
  ["whatsapp", "WhatsApp", "wa"],
  ["website", "Website", "www"],
]

export default function GymSocialMedia() {
  const navigate = useNavigate()
  const { gym, loading } = useGym()
  const social = gym?.socialMedia || {}
  const active = items.filter(([key]) => social[key])

  return (
    <div className="min-h-full text-white">
      <button type="button" className="mb-7 inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-gray-500 hover:text-lime-400" onClick={() => navigate(-1)}>
        <ArrowLeft size={16} /> Back
      </button>
      <div className="mb-7">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-lime-400">{gym?.name || "Your Gym"}</p>
        <h1 className="mt-2 text-3xl font-black">Gym Social Media</h1>
        <p className="mt-2 text-sm text-gray-500">Official social accounts and links provided by your gym.</p>
      </div>
      {loading ? <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-gray-400">Loading gym information...</div> : active.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-white/10 bg-white/[0.03] p-10 text-center"><h3 className="font-black">No social accounts added yet.</h3><p className="mt-2 text-sm text-gray-500">Your gym administrator can add the official accounts.</p></div>
      ) : (
        <div className="space-y-3">
          {active.map(([key, label, badge]) => (
            <a key={key} className="flex items-center gap-4 rounded-3xl border border-white/10 bg-white/[0.03] p-5 transition hover:border-lime-400/30" href={social[key]} target="_blank" rel="noreferrer">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/5 text-xs font-black uppercase text-lime-400">{badge}</span>
              <span className="min-w-0 flex-1"><strong className="block text-sm font-black">{label}</strong><small className="mt-1 block truncate text-xs text-gray-600">{social[key]}</small></span>
              <ExternalLink size={17} className="text-lime-400" />
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
