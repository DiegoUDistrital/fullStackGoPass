import { Navigate, Outlet } from "react-router-dom"
import { useSession } from "../hooks/useSession"

export function AdminRoute() {
  const { session } = useSession()

  if (session.user?.role !== "admin") {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}
