import { Alert, Avatar, Box, Button, Card, CardContent, Container, Stack, TextField, Typography } from "@mui/material"
import { useForm } from "react-hook-form"
import { Navigate } from "react-router-dom"
import { useLogin } from "../hooks/useLogin"
import { useSession } from "../hooks/useSession"
import type { LoginCredentials } from "../hooks/useLogin"

export function LoginPage() {
  const { session } = useSession()
  const loginMutation = useLogin()
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<LoginCredentials>()

  if (!session.isLoading && session.token && session.user) {
    return <Navigate to="/" replace />
  }

  const onSubmit = handleSubmit((values) => {
    loginMutation.mutate(values)
  })

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "background.default"
      }}
    >
      <Container maxWidth="xs">
        <Card variant="outlined" sx={{ p: 1 }}>
          <CardContent>
            <Stack spacing={3} sx={{ alignItems: "center" }}>
              <Avatar variant="rounded" sx={{ bgcolor: "primary.main", width: 48, height: 48 }}>
                GP
              </Avatar>
              <Stack spacing={0.5} sx={{ textAlign: "center" }}>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                  Gestión de Proyectos
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Inicia sesión para continuar
                </Typography>
              </Stack>
              <Box component="form" onSubmit={onSubmit} noValidate sx={{ width: "100%" }}>
                <Stack spacing={2}>
                  <TextField
                    label="Identificador de acceso"
                    autoFocus
                    fullWidth
                    error={Boolean(errors.accessIdentifier)}
                    helperText={errors.accessIdentifier ? "Este campo es requerido" : undefined}
                    {...register("accessIdentifier", { required: true })}
                  />
                  <TextField
                    label="Contraseña"
                    type="password"
                    fullWidth
                    error={Boolean(errors.password)}
                    helperText={errors.password ? "Este campo es requerido" : undefined}
                    {...register("password", { required: true })}
                  />
                  {loginMutation.isError && (
                    <Alert severity="error">
                      {loginMutation.error instanceof Error ? loginMutation.error.message : "Error al iniciar sesión"}
                    </Alert>
                  )}
                  <Button type="submit" variant="contained" fullWidth disabled={loginMutation.isPending}>
                    {loginMutation.isPending ? "Ingresando..." : "Ingresar"}
                  </Button>
                </Stack>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      </Container>
    </Box>
  )
}
