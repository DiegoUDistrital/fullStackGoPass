import { Button, Container, Stack, Typography } from "@mui/material"
import { HealthStatusCard } from "../components/HealthStatusCard"
import { useSession } from "../hooks/useSession"

export function HealthPage() {
  const { session, logout } = useSession()

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Stack spacing={3}>
        <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="h4">Sistema de Gestión de Proyectos y Tareas</Typography>
          {session.user && (
            <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
              <Typography color="text.secondary">{session.user.name}</Typography>
              <Button variant="outlined" onClick={logout}>
                Cerrar sesión
              </Button>
            </Stack>
          )}
        </Stack>
        <Typography color="text.secondary">
          Fase 3 completada: autenticación JWT y sesión funcional extremo a extremo.
        </Typography>
        <HealthStatusCard />
      </Stack>
    </Container>
  )
}
