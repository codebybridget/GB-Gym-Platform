import {
  BarChart3,
  Dumbbell,
  Home,
  User,
} from "lucide-react"
import { NavLink } from "react-router-dom"

const navigationItems = [
  {
    label: "Home",
    path: "/dashboard",
    icon: Home,
  },
  {
    label: "Workout",
    path: "/workout",
    icon: Dumbbell,
  },
  {
    label: "Progress",
    path: "/progress",
    icon: BarChart3,
  },
  {
    label: "Profile",
    path: "/profile",
    icon: User,
  },
]

function BottomNavigation() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-black/95 px-4 pb-[env(safe-area-inset-bottom)] pt-3 backdrop-blur-md">
      <div className="mx-auto flex max-w-md items-center justify-around">
        {navigationItems.map((item) => {
          const Icon = item.icon

          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/dashboard"}
              className={({ isActive }) =>
                `flex min-w-16 flex-col items-center gap-1 rounded-xl px-3 py-2 transition ${
                  isActive
                    ? "text-yellow-400"
                    : "text-gray-500 hover:text-white"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    size={21}
                    strokeWidth={isActive ? 2.5 : 2}
                  />

                  <span className="text-[11px] font-semibold">
                    {item.label}
                  </span>
                </>
              )}
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}

export default BottomNavigation