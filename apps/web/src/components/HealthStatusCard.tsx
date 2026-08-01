import { Alert, Button, Card, CardContent, Stack, Typography } from "@mui/material"
import { useHealthCheck } from "../hooks/useHealthCheck"

export function HealthStatusCard() {
  const { data, isLoading, isError, error, refetch } = useHealthCheck()

  if (isLoading) {
    return (
      <Card>
        <CardContent>
          <Typography>Cargando estado del backend...</Typography>
        </CardContent>
      </Card>
    )
  }

  if (isError) {
    return (
      <Card>
        <CardContent>
          <Stack spacing={2}>
            <Alert severity="error">{error instanceof Error ? error.message : "Error desconocido"}</Alert>
            <Button variant="contained" onClick={() => void refetch()}>
              Reintentar
            </Button>
          </Stack>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent>
        <Stack spacing={1}>
          <Typography variant="h6">Estado API</Typography>
          <Typography>
            Estado: <strong>{data?.status}</strong>
          </Typography>
          <Typography variant="body2">Timestamp: {data?.timestamp}</Typography>
        </Stack>
      </CardContent>
    </Card>
  )
}
