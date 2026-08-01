import { AppBar, Button, Stack, Toolbar, Typography } from "@mui/material"
import { Link as RouterLink } from "react-router-dom"
import { useSession } from "../hooks/useSession"

export function AppHeader() {
  const { session, logout } = useSession()

  return (
    <AppBar position="static" color="default" elevation={0}>
      <Toolbar sx={{ justifyContent: "space-between", flexWrap: "wrap", gap: 2 }}>
        <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
          <Typography
            variant="h6"
            component={RouterLink}
            to="/"
            sx={{ textDecoration: "none", color: "inherit", mr: 2 }}
          >
            Gestión de Proyectos y Tareas
          </Typography>
          <Button component={RouterLink} to="/">
            Inicio
          </Button>
          {session.user?.role === "admin" && (
            <Button component={RouterLink} to="/users">
              Usuarios
            </Button>
          )}
          <Button component={RouterLink} to="/account/password">
            Cambiar contraseña
          </Button>
        </Stack>
        {session.user && (
          <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
            <Typography color="text.secondary">{session.user.name}</Typography>
            <Button variant="outlined" onClick={logout}>
              Cerrar sesión
            </Button>
          </Stack>
        )}
      </Toolbar>
    </AppBar>
  )
}
