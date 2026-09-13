import {
  Navigate,
  Route,
  Routes,
  Outlet,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom"

import {
  useEffect,
  useState,
} from "react"

import Home from "./pages/Home"
import Login from "./pages/Login"
import TrainerLogin from "./pages/TrainerLogin"
import GymEntry from "./pages/GymEntry"
import PlatformDashboard from "./pages/platform/Dashboard"
import PlatformGyms from "./pages/platform/Gyms"
import PlatformSubscriptions from "./pages/platform/Subscriptions"
import PlatformRevenue from "./pages/platform/Revenue"
import PlatformPlans from "./pages/platform/Plans"
import PlatformSettings from "./pages/platform/Settings"
import AdminLogin from "./pages/AdminLogin"
import Register from "./pages/Register"
import RegisterGym from "./pages/RegisterGym"
import ForgotPassword from "./pages/ForgotPassword"
import AdminForgotPassword from "./pages/AdminForgotPassword"
import ResetPassword from "./pages/ResetPassword"

import MemberMembershipPlans from "./pages/MembershipPlans.jsx"
import PaymentCallback from "./pages/PaymentCallback.jsx"

import Progress from "./pages/admin/Progress"
import Settings from "./pages/admin/Settings"

import Workout from "./pages/Workout"
import WorkoutHistory from "./pages/WorkoutHistory"
import MemberProgress from "./pages/Progress"
import Profile from "./pages/Profile"
import WeeklySchedule from "./pages/WeeklySchedule"
import Payment from "./pages/Payment"

import AdminMembershipPlans from "./pages/admin/MembershipPlans"
import AdminSubscription from "./pages/admin/Subscription"
import AdminRevenue from "./pages/admin/Revenue"
import AdminSocialMedia from "./pages/admin/SocialMedia"

import AdminLayout from "./layouts/AdminLayout"
import AdminDashboard from "./pages/admin/AdminDashboard"
import AdminProfile from "./pages/admin/AdminProfile"
import Members from "./pages/admin/Members"
import Trainers from "./pages/admin/Trainers"
import Workouts from "./pages/admin/Workouts"
import ProgramBuilder from "./pages/admin/ProgramBuilder"
import Assignments from "./pages/admin/Assignments"
import MemberAssignments from "./pages/admin/MemberAssignments"
import WeeklyScheduleAdmin from "./pages/admin/WeeklySchedule"
import Exercises from "./pages/admin/Exercises"
import Attendance from "./pages/Attendance"
import AdminAttendance from "./pages/admin/Attendance"
import TrainerDashboard from "./pages/trainer/TrainerDashboard"
import TrainerMembers from "./pages/trainer/Members"
import TrainerExercises from "./pages/trainer/Exercises"
import TrainerPrograms from "./pages/trainer/Programs"
import TrainerAssignments from "./pages/trainer/Assignments"
import TrainerSchedule from "./pages/trainer/Schedule"
import TrainerProgress from "./pages/trainer/Progress"
import TrainerProfile from "./pages/trainer/Profile"
import MemberLayout from "./layouts/MemberLayout"
import AppShell from "./components/AppShell"
import Notifications from "./pages/Notifications"
import GymSocialMedia from "./pages/GymSocialMedia"
import MemberSettings from "./pages/MemberSettings"

import {
  useAuth,
} from "./context/AuthContext.jsx"

import {
  getMySubscription,
} from "./api/api.js"

function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
      <p className="text-sm text-slate-400">
        Loading...
      </p>
    </div>
  )
}

function AuthenticatedRoute() {
  const { isAuthenticated, loading } = useAuth()
  const location = useLocation()

  if (loading) return <LoadingScreen />

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return <Outlet />
}

function PlatformLayout() {
  return <AppShell />
}

function ProtectedRoute() {
  const {
    isAuthenticated,
    isMember,
    loading,
  } = useAuth()

  const location = useLocation()

  if (loading) {
    return <LoadingScreen />
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          from: location.pathname,
        }}
      />
    )
  }

  if (!isMember) {
    return (
      <Navigate
        to="/"
        replace
      />
    )
  }

  return <Outlet />
}

function PaidMemberRoute() {
  const {
    isAuthenticated,
    isMember,
    isTrainer,
    isAdmin,
    loading,
  } = useAuth()

  const location = useLocation()

  const [subscriptionLoading, setSubscriptionLoading] = useState(true)
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false)

  useEffect(() => {
    let cancelled = false

    const checkSubscription = async () => {
      if (loading) return

      if (!isAuthenticated || !isMember) {
        if (!cancelled) setSubscriptionLoading(false)
        return
      }

      try {
        setSubscriptionLoading(true)
        const data = await getMySubscription()

        if (cancelled) return

        setHasActiveSubscription(Boolean(data?.hasActiveSubscription))
      } catch (error) {
        if (cancelled) return

        console.error("Subscription check error:", error)
        setHasActiveSubscription(false)
      } finally {
        if (!cancelled) setSubscriptionLoading(false)
      }
    }

    checkSubscription()

    return () => {
      cancelled = true
    }
  }, [loading, isAuthenticated, isMember])

  if (loading) {
    return <LoadingScreen />
  }

  if (isAuthenticated && isTrainer) {
    return <Navigate to="/trainer" replace />
  }

  if (isAuthenticated && isAdmin) {
    return <Navigate to="/admin" replace />
  }

  if (subscriptionLoading && isAuthenticated && isMember) {
    return <LoadingScreen />
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          from: location.pathname,
        }}
      />
    )
  }

  if (!isMember) {
    return <Navigate to="/" replace />
  }

  if (!hasActiveSubscription) {
    return (
      <Navigate
        to="/membership-plans"
        replace
        state={{
          from: location.pathname,
          subscriptionRequired: true,
        }}
      />
    )
  }

  return <Outlet />
}

function AdminRoute() {
  const {
    isAuthenticated,
    isAdmin,
    loading,
  } = useAuth()

  const location = useLocation()

  if (loading) {
    return <LoadingScreen />
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          from: location.pathname,
        }}
      />
    )
  }

  if (!isAdmin) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          from: location.pathname,
        }}
      />
    )
  }

  return <Outlet />
}

function TrainerRoute() {
  const {
    isAuthenticated,
    user,
    isTrainer,
    loading,
  } = useAuth()

  const location = useLocation()

  if (loading) {
    return <LoadingScreen />
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/trainer-login"
        replace
        state={{
          from: location.pathname,
        }}
      />
    )
  }

  if (!isTrainer || user?.role !== "trainer") {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}

function PublicEntry() {
  const {
    isAuthenticated,
    isAdmin,
    isMember,
    isTrainer,
    isPlatformOwner,
    loading,
  } = useAuth()

  const navigate = useNavigate()

  if (loading) {
    return <LoadingScreen />
  }

  if (isAuthenticated) {
    if (isPlatformOwner) return <Navigate to="/platform" replace />
    if (isAdmin) return <Navigate to="/admin" replace />
    if (isTrainer) return <Navigate to="/trainer" replace />
    if (isMember) return <Navigate to="/dashboard" replace />
  }

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-8 text-white">
      <div className="flex min-h-[calc(100vh-4rem)] w-full items-center justify-center">
        <div className="w-full max-w-2xl rounded-[2rem] border border-white/10 bg-white/5 px-8 py-11 shadow-2xl backdrop-blur-xl sm:px-11 sm:py-12">
          <div className="text-center">
            <div className="mx-auto mb-7 flex h-[90px] w-[90px] items-center justify-center rounded-[1.4rem] bg-lime-400 text-3xl font-black text-slate-950">
              GB
            </div>

            <h1 className="text-4xl font-bold tracking-tight sm:text-[40px]">
              GB Gym Platform
            </h1>

            <p className="mt-4 text-lg text-slate-400">
              Sign in or create your gym account.
            </p>
          </div>

          <div className="mt-12 space-y-4">
            <button
              type="button"
              onClick={() => navigate("/register-gym")}
              className="block w-full rounded-2xl bg-lime-400 px-6 py-5 text-center text-xl font-medium text-slate-950 transition hover:bg-lime-300"
            >
              Register Your Gym
            </button>

            <button
              type="button"
              onClick={() => navigate("/login")}
              className="block w-full rounded-2xl border border-white/10 bg-white/5 px-6 py-5 text-center text-xl font-medium text-white transition hover:bg-white/10"
            >
              Sign In
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function MemberAssignmentsRoute() {
  const navigate = useNavigate()
  const { memberId } = useParams()

  return (
    <MemberAssignments
      memberId={memberId}
      onBack={() => navigate("/admin/assignments")}
    />
  )
}


function PlatformRoute() {
  const {
    isAuthenticated,
    isPlatformOwner,
    loading,
  } = useAuth()

  const location = useLocation()

  if (loading) {
    return <LoadingScreen />
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname }}
      />
    )
  }

  if (!isPlatformOwner) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<PublicEntry />} />

      <Route path="/gym/:gymSlug" element={<GymEntry />} />

      <Route path="/login" element={<Login />} />

      <Route
        path="/trainer-login"
        element={<TrainerLogin />}
      />

      <Route path="/register-gym" element={<RegisterGym />} />

      <Route path="/register" element={<Register />} />

      <Route path="/forgot-password" element={<ForgotPassword />} />

      <Route path="/reset-password" element={<ResetPassword />} />

      <Route
        path="/admin-forgot-password"
        element={<AdminForgotPassword />}
      />

      <Route path="/admin-login" element={<AdminLogin />} />

      <Route element={<PlatformRoute />}>
        <Route element={<PlatformLayout />}>
          <Route path="/platform" element={<PlatformDashboard />} />
          <Route path="/platform/gyms" element={<PlatformGyms />} />
          <Route path="/platform/subscriptions" element={<PlatformSubscriptions />} />
          <Route path="/platform/revenue" element={<PlatformRevenue />} />
          <Route path="/platform/plans" element={<PlatformPlans />} />
          <Route path="/platform/settings" element={<PlatformSettings />} />
        </Route>
      </Route>

      <Route path="/payment/callback" element={<PaymentCallback />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<MemberLayout />}>
          <Route path="/membership-plans" element={<MemberMembershipPlans />} />
          <Route path="/membership" element={<MemberMembershipPlans />} />
          <Route path="/payment" element={<Payment />} />

          <Route element={<PaidMemberRoute />}>
            <Route path="/dashboard" element={<Home />} />
            <Route path="/workout" element={<Workout />} />
            <Route path="/workout-history" element={<WorkoutHistory />} />
            <Route path="/progress" element={<MemberProgress />} />
            <Route path="/weekly-schedule" element={<WeeklySchedule />} />
            <Route path="/attendance" element={<Attendance />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/gym-social-media" element={<GymSocialMedia />} />
            <Route path="/settings" element={<MemberSettings />} />
          </Route>
        </Route>
      </Route>

      <Route element={<TrainerRoute />}>
        <Route element={<AppShell />}>
          <Route path="/trainer" element={<TrainerDashboard />} />
          <Route path="/trainer/members" element={<TrainerMembers />} />
          <Route path="/trainer/exercises" element={<TrainerExercises />} />
          <Route path="/trainer/programs" element={<TrainerPrograms />} />
          <Route path="/trainer/assignments" element={<TrainerAssignments />} />
          <Route path="/trainer/schedule" element={<TrainerSchedule />} />
          <Route path="/trainer/progress" element={<TrainerProgress />} />
          <Route path="/trainer/profile" element={<TrainerProfile />} />
        </Route>
      </Route>

      <Route element={<AuthenticatedRoute />}>
        <Route element={<AppShell />}>
          <Route path="/notifications" element={<Notifications />} />
        </Route>
      </Route>

      <Route element={<AdminRoute />}>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="members" element={<Members />} />
          <Route path="trainers" element={<Trainers />} />
          <Route path="membership" element={<AdminMembershipPlans />} />
          <Route path="membership-plans" element={<AdminMembershipPlans />} />
          <Route path="subscription" element={<AdminSubscription />} />
          <Route path="schedule" element={<WeeklyScheduleAdmin />} />
          <Route path="exercises" element={<Exercises />} />
          <Route path="programs" element={<ProgramBuilder />} />
          <Route path="program-builder" element={<ProgramBuilder />} />
          <Route path="workouts" element={<Workouts />} />
          <Route path="assignments" element={<Assignments />} />
          <Route path="progress" element={<Progress />} />
          <Route path="attendance" element={<AdminAttendance />} />
          <Route path="revenue" element={<AdminRevenue />} />
          <Route path="social-media" element={<AdminSocialMedia />} />

          <Route
            path="assignments/member/:memberId"
            element={<MemberAssignmentsRoute />}
          />

          <Route path="profile" element={<AdminProfile />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
