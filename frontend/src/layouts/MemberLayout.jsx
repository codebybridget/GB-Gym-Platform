import { Outlet } from "react-router-dom"
import BottomNavigation from "../components/BottomNavigation.jsx"
import "../member.css"

export default function MemberLayout() {
  return (
    <div className="member-page min-h-screen bg-black text-white">
      <Outlet />
      <BottomNavigation />
    </div>
  )
}
