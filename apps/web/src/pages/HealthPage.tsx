import { Container, Stack, Typography } from "@mui/material"
import { AppHeader } from "../components/AppHeader"
import { HealthStatusCard } from "../components/HealthStatusCard"

export function HealthPage() {
  return (
    <>
      <AppHeader />
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Stack spacing={3}>
          <Typography variant="h4">Sistema de Gestión de Proyectos y Tareas</Typography>
          <Typography color="text.secondary">
            Fase 4 completada: gestión de usuarios (crear, editar, activar, desactivar, cambio de contraseña).
          </Typography>
          <HealthStatusCard />
        </Stack>
      </Container>
    </>
  )
}
