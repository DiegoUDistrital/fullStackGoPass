import {
  Avatar,
  Box,
  Button,
  Divider,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  Typography
} from "@mui/material"
import AssignmentOutlinedIcon from "@mui/icons-material/AssignmentOutlined"
import DashboardOutlinedIcon from "@mui/icons-material/DashboardOutlined"
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined"
import LockResetOutlinedIcon from "@mui/icons-material/LockResetOutlined"
import LogoutOutlinedIcon from "@mui/icons-material/LogoutOutlined"
import PeopleOutlinedIcon from "@mui/icons-material/PeopleOutlined"
import { alpha } from "@mui/material/styles"
import type { SvgIconProps } from "@mui/material/SvgIcon"
import type { ComponentType } from "react"
import { Link as RouterLink, useLocation } from "react-router-dom"
import { useSession } from "../../hooks/useSession"

export const SIDEBAR_WIDTH = 248

interface NavItem {
  label: string
  to: string
  icon: ComponentType<SvgIconProps>
  adminOnly?: boolean
}

const NAV_ITEMS: NavItem[] = [
  { label: "Inicio", to: "/", icon: HomeOutlinedIcon },
  { label: "Proyectos", to: "/projects", icon: AssignmentOutlinedIcon },
  { label: "Usuarios", to: "/users", icon: PeopleOutlinedIcon, adminOnly: true },
  { label: "Dashboard", to: "/dashboard", icon: DashboardOutlinedIcon, adminOnly: true },
  { label: "Cambiar contraseña", to: "/account/password", icon: LockResetOutlinedIcon }
]

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("")
}

export function Sidebar() {
  const { session, logout } = useSession()
  const location = useLocation()
  const isAdmin = session.user?.role === "admin"

  return (
    <Box
      component="nav"
      sx={{
        width: SIDEBAR_WIDTH,
        flexShrink: 0,
        height: "100vh",
        position: "sticky",
        top: 0,
        display: "flex",
        flexDirection: "column",
        borderRight: "1px solid",
        borderColor: "divider",
        bgcolor: "background.paper"
      }}
    >
      <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", px: 2.5, py: 2.5 }}>
        <Avatar variant="rounded" sx={{ bgcolor: "primary.main", width: 32, height: 32, fontSize: 14 }}>
          GP
        </Avatar>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
          Gestión de Proyectos
        </Typography>
      </Stack>

      <Divider />

      <List sx={{ flex: 1, px: 1.5, py: 1.5 }}>
        {NAV_ITEMS.filter((item) => !item.adminOnly || isAdmin).map((item) => {
          const isSelected = item.to === "/" ? location.pathname === "/" : location.pathname.startsWith(item.to)
          const Icon = item.icon

          return (
            <ListItemButton
              key={item.to}
              component={RouterLink}
              to={item.to}
              selected={isSelected}
              sx={(theme) => ({
                borderRadius: 1.5,
                mb: 0.5,
                color: isSelected ? "primary.main" : "text.primary",
                "&.Mui-selected": {
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  "&:hover": { bgcolor: alpha(theme.palette.primary.main, 0.16) }
                }
              })}
            >
              <ListItemIcon sx={{ minWidth: 36, color: isSelected ? "primary.main" : "text.secondary" }}>
                <Icon fontSize="small" />
              </ListItemIcon>
              <ListItemText
                primary={item.label}
                slotProps={{ primary: { variant: "body2", sx: { fontWeight: isSelected ? 600 : 500 } } }}
              />
            </ListItemButton>
          )
        })}
      </List>

      <Divider />

      {session.user && (
        <Stack spacing={1.5} sx={{ p: 2 }}>
          <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
            <Avatar sx={{ width: 32, height: 32, fontSize: 13 }}>{getInitials(session.user.name)}</Avatar>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
                {session.user.name}
              </Typography>
              <Typography variant="caption" color="text.secondary" noWrap>
                {isAdmin ? "Administrador" : "Usuario"}
              </Typography>
            </Box>
          </Stack>
          <Button
            size="small"
            variant="outlined"
            startIcon={<LogoutOutlinedIcon fontSize="small" />}
            onClick={logout}
          >
            Cerrar sesión
          </Button>
        </Stack>
      )}
    </Box>
  )
}
