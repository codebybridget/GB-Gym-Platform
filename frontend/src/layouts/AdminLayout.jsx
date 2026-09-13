import AppShell from "../components/AppShell"

/*
 * AdminLayout is the layout for every /admin/* route.
 * AppShell renders the admin navigation and its <Outlet /> renders the
 * currently selected admin page (Members, Trainers, Revenue, etc.).
 */
export default function AdminLayout() {
  return <AppShell />
}
