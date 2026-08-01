import { createBrowserRouter, RouterProvider } from "react-router-dom"
import { ChangePasswordPage } from "../pages/ChangePasswordPage"
import { DashboardPage } from "../pages/DashboardPage"
import { HealthPage } from "../pages/HealthPage"
import { LoginPage } from "../pages/LoginPage"
import { ProjectDetailPage } from "../pages/ProjectDetailPage"
import { ProjectsPage } from "../pages/ProjectsPage"
import { TaskDetailPage } from "../pages/TaskDetailPage"
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
        path: "/projects",
        element: <ProjectsPage />
      },
      {
        path: "/projects/:id",
        element: <ProjectDetailPage />
      },
      {
        path: "/projects/:projectId/tasks/:taskId",
        element: <TaskDetailPage />
      },
      {
        element: <AdminRoute />,
        children: [
          {
            path: "/users",
            element: <UsersPage />
          },
          {
            path: "/dashboard",
            element: <DashboardPage />
          }
        ]
      }
    ]
  }
])

export function AppRouter() {
  return <RouterProvider router={router} />
}
