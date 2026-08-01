import { Container, CircularProgress } from "@mui/material"
import { Navigate, Outlet } from "react-router-dom"
import { useSession } from "../hooks/useSession"

export function ProtectedRoute() {
  const { session } = useSession()

  if (session.isLoading) {
    return (
      <Container sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress />
      </Container>
    )
  }

  if (!session.token || !session.user) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}
