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
            Autenticación, usuarios, proyectos, tareas, comentarios y dashboard integrados.
          </Typography>
          <HealthStatusCard />
        </Stack>
      </Container>
    </>
  )
}
