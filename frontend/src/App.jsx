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
    <div className="flex min-h-screen items-center justify-center bg-[#020617] text-white">
      <p className="text-sm text-slate-400">
        Loading...
      </p>
    </div>
  )
}

/*
|--------------------------------------------------------------------------
| GYM ENTRY STORAGE
|--------------------------------------------------------------------------
*/

const GYM_ENTRY_KEY = "gb_entry_gym"

function getStoredGymSlug() {
  const sessionSlug =
    sessionStorage.getItem(GYM_ENTRY_KEY)

  if (sessionSlug?.trim()) {
    return sessionSlug.trim()
  }

  const localSlug =
    localStorage.getItem(GYM_ENTRY_KEY)

  if (localSlug?.trim()) {
    return localSlug.trim()
  }

  return ""
}

function saveGymSlug(gymSlug) {
  const cleanSlug =
    String(gymSlug || "").trim()

  if (!cleanSlug) {
    return
  }

  sessionStorage.setItem(
    GYM_ENTRY_KEY,
    cleanSlug,
  )

  localStorage.setItem(
    GYM_ENTRY_KEY,
    cleanSlug,
  )
}

/*
|--------------------------------------------------------------------------
| GENERIC GB PLATFORM AUTH
|
| These routes are ONLY for GB Platform users.
|--------------------------------------------------------------------------
*/

function getPlatformLoginPath() {
  return "/login"
}

/*
|--------------------------------------------------------------------------
| GYM-SCOPED AUTH PATHS
|
| These routes are ONLY for users entering through
| a gym QR code / gym portal.
|--------------------------------------------------------------------------
*/

function getGymLoginPath() {
  const gymSlug =
    getStoredGymSlug()

  if (!gymSlug) {
    return "/login"
  }

  return `/gym/${encodeURIComponent(
    gymSlug,
  )}/login`
}

function getGymRegisterPath() {
  const gymSlug =
    getStoredGymSlug()

  if (!gymSlug) {
    return "/register"
  }

  return `/gym/${encodeURIComponent(
    gymSlug,
  )}/register`
}

function getGymTrainerLoginPath() {
  const gymSlug =
    getStoredGymSlug()

  if (!gymSlug) {
    return "/trainer-login"
  }

  return `/gym/${encodeURIComponent(
    gymSlug,
  )}/trainer-login`
}

/*
|--------------------------------------------------------------------------
| AUTHENTICATED ROUTE
|--------------------------------------------------------------------------
*/

function AuthenticatedRoute() {
  const {
    isAuthenticated,
    loading,
  } = useAuth()

  const location =
    useLocation()

  if (loading) {
    return <LoadingScreen />
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to={getGymLoginPath()}
        replace
        state={{
          from:
            location.pathname,
        }}
      />
    )
  }

  return <Outlet />
}

/*
|--------------------------------------------------------------------------
| PLATFORM LAYOUT
|--------------------------------------------------------------------------
*/

function PlatformLayout() {
  return <AppShell />
}

/*
|--------------------------------------------------------------------------
| MEMBER ROUTE
|--------------------------------------------------------------------------
*/

function ProtectedRoute() {
  const {
    isAuthenticated,
    isMember,
    loading,
  } = useAuth()

  const location =
    useLocation()

  if (loading) {
    return <LoadingScreen />
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to={getGymLoginPath()}
        replace
        state={{
          from:
            location.pathname,
        }}
      />
    )
  }

  if (!isMember) {
    return (
      <Navigate
        to={getGymLoginPath()}
        replace
      />
    )
  }

  return <Outlet />
}

/*
|--------------------------------------------------------------------------
| PAID MEMBER ROUTE
|--------------------------------------------------------------------------
*/

function PaidMemberRoute() {
  const {
    isAuthenticated,
    isMember,
    isTrainer,
    isAdmin,
    loading,
  } = useAuth()

  const location =
    useLocation()

  const [
    subscriptionLoading,
    setSubscriptionLoading,
  ] = useState(true)

  const [
    hasActiveSubscription,
    setHasActiveSubscription,
  ] = useState(false)

  useEffect(() => {
    let cancelled = false

    const checkSubscription =
      async () => {
        if (loading) {
          return
        }

        if (
          !isAuthenticated ||
          !isMember
        ) {
          if (!cancelled) {
            setSubscriptionLoading(
              false,
            )
          }

          return
        }

        try {
          setSubscriptionLoading(
            true,
          )

          const data =
            await getMySubscription()

          if (cancelled) {
            return
          }

          setHasActiveSubscription(
            Boolean(
              data?.hasActiveSubscription,
            ),
          )
        } catch (error) {
          if (cancelled) {
            return
          }

          console.error(
            "Subscription check error:",
            error,
          )

          setHasActiveSubscription(
            false,
          )
        } finally {
          if (!cancelled) {
            setSubscriptionLoading(
              false,
            )
          }
        }
      }

    checkSubscription()

    return () => {
      cancelled = true
    }
  }, [
    loading,
    isAuthenticated,
    isMember,
  ])

  if (loading) {
    return <LoadingScreen />
  }

  if (
    isAuthenticated &&
    isTrainer
  ) {
    return (
      <Navigate
        to={getGymTrainerLoginPath()}
        replace
      />
    )
  }

  if (
    isAuthenticated &&
    isAdmin
  ) {
    return (
      <Navigate
        to={getGymLoginPath()}
        replace
      />
    )
  }

  if (
    subscriptionLoading &&
    isAuthenticated &&
    isMember
  ) {
    return <LoadingScreen />
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to={getGymLoginPath()}
        replace
        state={{
          from:
            location.pathname,
        }}
      />
    )
  }

  if (!isMember) {
    return (
      <Navigate
        to={getGymLoginPath()}
        replace
      />
    )
  }

  if (!hasActiveSubscription) {
    return (
      <Navigate
        to="/membership-plans"
        replace
        state={{
          from:
            location.pathname,
          subscriptionRequired:
            true,
        }}
      />
    )
  }

  return <Outlet />
}

/*
|--------------------------------------------------------------------------
| ADMIN ROUTE
|--------------------------------------------------------------------------
*/

function AdminRoute() {
  const {
    isAuthenticated,
    isAdmin,
    loading,
  } = useAuth()

  const location =
    useLocation()

  if (loading) {
    return <LoadingScreen />
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to={getGymLoginPath()}
        replace
        state={{
          from:
            location.pathname,
        }}
      />
    )
  }

  if (!isAdmin) {
    return (
      <Navigate
        to={getGymLoginPath()}
        replace
        state={{
          from:
            location.pathname,
        }}
      />
    )
  }

  return <Outlet />
}

/*
|--------------------------------------------------------------------------
| TRAINER ROUTE
|--------------------------------------------------------------------------
*/

function TrainerRoute() {
  const {
    isAuthenticated,
    user,
    isTrainer,
    loading,
  } = useAuth()

  const location =
    useLocation()

  if (loading) {
    return <LoadingScreen />
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to={getGymTrainerLoginPath()}
        replace
        state={{
          from:
            location.pathname,
        }}
      />
    )
  }

  if (
    !isTrainer ||
    user?.role !== "trainer"
  ) {
    return (
      <Navigate
        to={getGymLoginPath()}
        replace
      />
    )
  }

  return <Outlet />
}

/*
|--------------------------------------------------------------------------
| PUBLIC GB PLATFORM ENTRY
|--------------------------------------------------------------------------
*/

function PublicEntry() {
  const {
    isAuthenticated,
    isMember,
    isTrainer,
    isPlatformOwner,
    isAdmin,
    loading,
  } = useAuth()

  const navigate =
    useNavigate()

  if (loading) {
    return <LoadingScreen />
  }

  if (isAuthenticated) {
    if (isPlatformOwner) {
      return (
        <Navigate
          to="/platform"
          replace
        />
      )
    }

    if (isAdmin) {
      return (
        <Navigate
          to="/admin"
          replace
        />
      )
    }

    if (isTrainer) {
      return (
        <Navigate
          to="/trainer"
          replace
        />
      )
    }

    if (isMember) {
      return (
        <Navigate
          to="/dashboard"
          replace
        />
      )
    }
  }

  return (
    <div className="min-h-screen bg-[#020617] px-4 py-8 text-white">
      <div className="flex min-h-[calc(100vh-4rem)] w-full items-center justify-center">
        <div className="w-full max-w-2xl rounded-[2rem] border border-white/10 bg-white/5 px-8 py-11 shadow-2xl backdrop-blur-xl sm:px-11 sm:py-12">
          <div className="text-center">
            <div className="mx-auto mb-7 flex h-[90px] w-[90px] items-center justify-center rounded-[1.4rem] bg-[#D9FF3F] text-3xl font-black text-[#020617]">
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
              onClick={() =>
                navigate(
                  "/register-gym",
                )
              }
              className="block w-full rounded-2xl bg-[#D9FF3F] px-6 py-5 text-center text-xl font-medium text-[#020617] transition hover:bg-[#E7FF72]"
            >
              Register Your Gym
            </button>

            <button
              type="button"
              onClick={() =>
                navigate(
                  getPlatformLoginPath(),
                )
              }
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

/*
|--------------------------------------------------------------------------
| MEMBER ASSIGNMENTS ROUTE
|--------------------------------------------------------------------------
*/

function MemberAssignmentsRoute() {
  const navigate =
    useNavigate()

  const { memberId } =
    useParams()

  return (
    <MemberAssignments
      memberId={memberId}
      onBack={() =>
        navigate(
          "/admin/assignments",
        )
      }
    />
  )
}

/*
|--------------------------------------------------------------------------
| PLATFORM ROUTE
|
| Platform authentication ALWAYS goes through /login.
| A gym QR code can never redirect into this area.
|--------------------------------------------------------------------------
*/

function PlatformRoute() {
  const {
    isAuthenticated,
    isPlatformOwner,
    loading,
  } = useAuth()

  const location =
    useLocation()

  if (loading) {
    return <LoadingScreen />
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          from:
            location.pathname,
        }}
      />
    )
  }

  if (!isPlatformOwner) {
    return (
      <Navigate
        to="/"
        replace
      />
    )
  }

  return <Outlet />
}

/*
|--------------------------------------------------------------------------
| GYM-SCOPED AUTH ROUTES
|--------------------------------------------------------------------------
*/

function GymScopedLoginRoute() {
  const { gymSlug } =
    useParams()

  useEffect(() => {
    if (gymSlug?.trim()) {
      saveGymSlug(gymSlug)
    }
  }, [gymSlug])

  if (!gymSlug?.trim()) {
    return (
      <Navigate
        to="/"
        replace
      />
    )
  }

  return (
    <Login
      key={`login-${gymSlug}`}
      gymSlug={gymSlug}
    />
  )
}

function GymScopedRegisterRoute() {
  const { gymSlug } =
    useParams()

  useEffect(() => {
    if (gymSlug?.trim()) {
      saveGymSlug(gymSlug)
    }
  }, [gymSlug])

  if (!gymSlug?.trim()) {
    return (
      <Navigate
        to="/"
        replace
      />
    )
  }

  return (
    <Register
      key={`register-${gymSlug}`}
      gymSlug={gymSlug}
    />
  )
}

function GymScopedTrainerLoginRoute() {
  const { gymSlug } =
    useParams()

  useEffect(() => {
    if (gymSlug?.trim()) {
      saveGymSlug(gymSlug)
    }
  }, [gymSlug])

  if (!gymSlug?.trim()) {
    return (
      <Navigate
        to="/"
        replace
      />
    )
  }

  return (
    <TrainerLogin
      key={`trainer-${gymSlug}`}
      gymSlug={gymSlug}
    />
  )
}

/*
|--------------------------------------------------------------------------
| APPLICATION
|--------------------------------------------------------------------------
*/

function App() {
  return (
    <Routes>
      {/* ================================================================
          GB PLATFORM
          ================================================================ */}

      <Route
        path="/"
        element={<PublicEntry />}
      />

      {/* ================================================================
          GYM ENTRY PORTAL
          QR CODE DESTINATION
          Example: /gym/cgf-fitness
          ================================================================ */}

      <Route
        path="/gym/:gymSlug"
        element={<GymEntry />}
      />

      {/* ================================================================
          GYM-SCOPED MEMBER LOGIN
          Example: /gym/cgf-fitness/login
          ================================================================ */}

      <Route
        path="/gym/:gymSlug/login"
        element={
          <GymScopedLoginRoute />
        }
      />

      {/* ================================================================
          GYM-SCOPED MEMBER REGISTRATION
          Example: /gym/cgf-fitness/register
          ================================================================ */}

      <Route
        path="/gym/:gymSlug/register"
        element={
          <GymScopedRegisterRoute />
        }
      />

      {/* ================================================================
          GYM-SCOPED TRAINER LOGIN
          Example: /gym/cgf-fitness/trainer-login
          ================================================================ */}

      <Route
        path="/gym/:gymSlug/trainer-login"
        element={
          <GymScopedTrainerLoginRoute />
        }
      />

      {/* ================================================================
          GENERIC GB PLATFORM AUTH
          These are NOT gym QR routes.
          ================================================================ */}

      <Route
        path="/login"
        element={<Login />}
      />

      <Route
        path="/trainer-login"
        element={<TrainerLogin />}
      />

      <Route
        path="/register-gym"
        element={<RegisterGym />}
      />

      <Route
        path="/register"
        element={<Register />}
      />

      <Route
        path="/forgot-password"
        element={<ForgotPassword />}
      />

      <Route
        path="/reset-password"
        element={<ResetPassword />}
      />

      <Route
        path="/admin-forgot-password"
        element={
          <AdminForgotPassword />
        }
      />

      <Route
        path="/admin-login"
        element={<AdminLogin />}
      />

      {/* ================================================================
          PLATFORM
          ================================================================ */}

      <Route element={<PlatformRoute />}>
        <Route
          element={<PlatformLayout />}
        >
          <Route
            path="/platform"
            element={
              <PlatformDashboard />
            }
          />

          <Route
            path="/platform/gyms"
            element={<PlatformGyms />}
          />

          <Route
            path="/platform/subscriptions"
            element={
              <PlatformSubscriptions />
            }
          />

          <Route
            path="/platform/revenue"
            element={
              <PlatformRevenue />
            }
          />

          <Route
            path="/platform/plans"
            element={<PlatformPlans />}
          />

          <Route
            path="/platform/settings"
            element={
              <PlatformSettings />
            }
          />
        </Route>
      </Route>

      {/* ================================================================
          PAYMENT CALLBACK
          ================================================================ */}

      <Route
        path="/payment/callback"
        element={
          <PaymentCallback />
        }
      />

      {/* ================================================================
          MEMBERS
          ================================================================ */}

      <Route
        element={<ProtectedRoute />}
      >
        <Route
          element={<MemberLayout />}
        >
          <Route
            path="/membership-plans"
            element={
              <MemberMembershipPlans />
            }
          />

          <Route
            path="/membership"
            element={
              <MemberMembershipPlans />
            }
          />

          <Route
            path="/payment"
            element={<Payment />}
          />

          <Route
            element={
              <PaidMemberRoute />
            }
          >
            <Route
              path="/dashboard"
              element={<Home />}
            />

            <Route
              path="/workout"
              element={<Workout />}
            />

            <Route
              path="/workout-history"
              element={
                <WorkoutHistory />
              }
            />

            <Route
              path="/progress"
              element={
                <MemberProgress />
              }
            />

            <Route
              path="/weekly-schedule"
              element={
                <WeeklySchedule />
              }
            />

            <Route
              path="/attendance"
              element={
                <Attendance />
              }
            />

            <Route
              path="/profile"
              element={<Profile />}
            />

            <Route
              path="/gym-social-media"
              element={
                <GymSocialMedia />
              }
            />

            <Route
              path="/settings"
              element={
                <MemberSettings />
              }
            />
          </Route>
        </Route>
      </Route>

      {/* ================================================================
          TRAINERS
          ================================================================ */}

      <Route
        element={<TrainerRoute />}
      >
        <Route
          element={<AppShell />}
        >
          <Route
            path="/trainer"
            element={
              <TrainerDashboard />
            }
          />

          <Route
            path="/trainer/members"
            element={
              <TrainerMembers />
            }
          />

          <Route
            path="/trainer/exercises"
            element={
              <TrainerExercises />
            }
          />

          <Route
            path="/trainer/programs"
            element={
              <TrainerPrograms />
            }
          />

          <Route
            path="/trainer/assignments"
            element={
              <TrainerAssignments />
            }
          />

          <Route
            path="/trainer/schedule"
            element={
              <TrainerSchedule />
            }
          />

          <Route
            path="/trainer/progress"
            element={
              <TrainerProgress />
            }
          />

          <Route
            path="/trainer/profile"
            element={
              <TrainerProfile />
            }
          />
        </Route>
      </Route>

      {/* ================================================================
          SHARED AUTHENTICATED PAGES
          ================================================================ */}

      <Route
        element={
          <AuthenticatedRoute />
        }
      >
        <Route
          element={<AppShell />}
        >
          <Route
            path="/notifications"
            element={
              <Notifications />
            }
          />
        </Route>
      </Route>

      {/* ================================================================
          ADMIN
          ================================================================ */}

      <Route
        element={<AdminRoute />}
      >
        <Route
          path="/admin"
          element={<AdminLayout />}
        >
          <Route
            index
            element={
              <AdminDashboard />
            }
          />

          <Route
            path="members"
            element={<Members />}
          />

          <Route
            path="trainers"
            element={<Trainers />}
          />

          <Route
            path="membership"
            element={
              <AdminMembershipPlans />
            }
          />

          <Route
            path="membership-plans"
            element={
              <AdminMembershipPlans />
            }
          />

          <Route
            path="subscription"
            element={
              <AdminSubscription />
            }
          />

          <Route
            path="schedule"
            element={
              <WeeklyScheduleAdmin />
            }
          />

          <Route
            path="exercises"
            element={<Exercises />}
          />

          <Route
            path="programs"
            element={
              <ProgramBuilder />
            }
          />

          <Route
            path="program-builder"
            element={
              <ProgramBuilder />
            }
          />

          <Route
            path="workouts"
            element={<Workouts />}
          />

          <Route
            path="assignments"
            element={
              <Assignments />
            }
          />

          <Route
            path="progress"
            element={<Progress />}
          />

          <Route
            path="attendance"
            element={
              <AdminAttendance />
            }
          />

          <Route
            path="revenue"
            element={
              <AdminRevenue />
            }
          />

          <Route
            path="social-media"
            element={
              <AdminSocialMedia />
            }
          />

          <Route
            path="assignments/member/:memberId"
            element={
              <MemberAssignmentsRoute />
            }
          />

          <Route
            path="profile"
            element={
              <AdminProfile />
            }
          />

          <Route
            path="settings"
            element={<Settings />}
          />
        </Route>
      </Route>

      {/* ================================================================
          FALLBACK
          ================================================================ */}

      <Route
        path="*"
        element={
          <Navigate
            to="/"
            replace
          />
        }
      />
    </Routes>
  )
}

export default App