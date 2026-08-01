import { createBrowserRouter, RouterProvider } from "react-router-dom"
import { ChangePasswordPage } from "../pages/ChangePasswordPage"
import { HealthPage } from "../pages/HealthPage"
import { LoginPage } from "../pages/LoginPage"
import { UsersPage } from "../pages/UsersPage"
import { AdminRoute } from "./AdminRoute"
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
      },
      {
        path: "/account/password",
        element: <ChangePasswordPage />
      },
      {
        element: <AdminRoute />,
        children: [
          {
            path: "/users",
            element: <UsersPage />
          }
        ]
      }
    ]
  }
])

export function AppRouter() {
  return <RouterProvider router={router} />
}
