import { useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { useGym } from "../context/GymContext"
import PageHeader from "../components/PageHeader"

export default function MemberSettings() {
  const { user, logout } = useAuth(); const { gym } = useGym(); const navigate = useNavigate()
  return <><PageHeader title="Account & Settings" description="Manage your GB account and view your gym information." /><div className="grid gap-4 md:grid-cols-3"><div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6"><h3 className="font-black">Account</h3><p className="mt-3 text-sm text-white">{user?.firstName} {user?.lastName}</p><p className="mt-1 text-sm text-gray-500">{user?.email}</p><button className="btn ghost mt-5" onClick={() => navigate("/profile")}>Open Profile</button></div><div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6"><h3 className="font-black">Your Gym</h3><p className="mt-3 text-sm text-white">{gym?.name || "Gym"}</p><p className="mt-1 text-sm text-gray-500">{gym?.address || [gym?.city, gym?.state].filter(Boolean).join(", ") || ""}</p><button className="btn ghost mt-5" onClick={() => navigate("/gym-social-media")}>Gym Social Media</button></div><div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6"><h3 className="font-black">Security</h3><p className="mt-3 text-sm text-gray-500">Authentication is managed securely by GB JWT sessions.</p><button className="btn danger mt-5" onClick={async () => { await logout(); navigate("/login", { replace: true }) }}>Sign out</button></div></div></>
}
