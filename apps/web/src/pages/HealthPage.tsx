import { Container, Stack, Typography } from "@mui/material"
import { HealthStatusCard } from "../components/HealthStatusCard"

export function HealthPage() {
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Stack spacing={3}>
        <Typography variant="h4">Sistema de Gestión de Proyectos y Tareas</Typography>
        <Typography color="text.secondary">
          Fase 1 completada: frontend y backend iniciales ejecutables con arquitectura base.
        </Typography>
        <HealthStatusCard />
      </Stack>
    </Container>
  )
}
