import { Box } from "@mui/material"
import { Outlet } from "react-router-dom"
import { Sidebar } from "./Sidebar"

export function AppLayout() {
  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />
      <Box component="main" sx={{ flex: 1, minWidth: 0 }}>
        <Box sx={{ maxWidth: 1400, mx: "auto", px: { xs: 3, md: 5 }, py: 4 }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  )
}
