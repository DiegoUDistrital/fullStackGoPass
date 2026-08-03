import { Stack, Typography } from "@mui/material"
import { HealthStatusCard } from "../components/HealthStatusCard"

export function HealthPage() {
  return (
    <Stack spacing={3}>
      <Typography variant="h4">Sistema de Gestión de Proyectos y Tareas</Typography>
      <Typography color="text.secondary">
        Autenticación, usuarios, proyectos, tareas, comentarios y dashboard integrados.
      </Typography>
      <HealthStatusCard />
    </Stack>
  )
}
