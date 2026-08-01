import { createBrowserRouter, RouterProvider } from "react-router-dom"
import { HealthPage } from "../pages/HealthPage"

const router = createBrowserRouter([
  {
    path: "/",
    element: <HealthPage />
  }
])

export function AppRouter() {
  return <RouterProvider router={router} />
}
