import { Alert, Box, Button, Container, Stack, TextField, Typography } from "@mui/material"
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
    <Container maxWidth="xs" sx={{ py: 8 }}>
      <Stack spacing={3}>
        <Typography variant="h5">Iniciar sesión</Typography>
        <Box component="form" onSubmit={onSubmit} noValidate>
          <Stack spacing={2}>
            <TextField
              label="Identificador de acceso"
              autoFocus
              error={Boolean(errors.accessIdentifier)}
              helperText={errors.accessIdentifier ? "Este campo es requerido" : undefined}
              {...register("accessIdentifier", { required: true })}
            />
            <TextField
              label="Contraseña"
              type="password"
              error={Boolean(errors.password)}
              helperText={errors.password ? "Este campo es requerido" : undefined}
              {...register("password", { required: true })}
            />
            {loginMutation.isError && (
              <Alert severity="error">
                {loginMutation.error instanceof Error ? loginMutation.error.message : "Error al iniciar sesión"}
              </Alert>
            )}
            <Button type="submit" variant="contained" disabled={loginMutation.isPending}>
              {loginMutation.isPending ? "Ingresando..." : "Ingresar"}
            </Button>
          </Stack>
        </Box>
      </Stack>
    </Container>
  )
}
