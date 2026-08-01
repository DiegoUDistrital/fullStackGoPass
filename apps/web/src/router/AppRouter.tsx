import { createBrowserRouter, RouterProvider } from "react-router-dom"
import { HealthPage } from "../pages/HealthPage"
import { LoginPage } from "../pages/LoginPage"
import { ProtectedRoute } from "./ProtectedRoute"

const router = createBrowserRouter([
  {
    path: "/login",
    element: <LoginPage />
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: "/",
        element: <HealthPage />
      }
    ]
  }
])

export function AppRouter() {
  return <RouterProvider router={router} />
}
