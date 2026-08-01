import { Alert, Box, Button, Container, Stack, TextField, Typography } from "@mui/material"
import { useForm } from "react-hook-form"
import { AppHeader } from "../components/AppHeader"
import { useChangePasswordMutation } from "../hooks/useChangePassword"

interface ChangePasswordFormValues {
  currentPassword: string
  newPassword: string
}

export function ChangePasswordPage() {
  const changePasswordMutation = useChangePasswordMutation()
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<ChangePasswordFormValues>()

  const onSubmit = handleSubmit((values) => {
    changePasswordMutation.mutate(values, {
      onSuccess: () => reset()
    })
  })

  return (
    <>
      <AppHeader />
      <Container maxWidth="xs" sx={{ py: 4 }}>
        <Stack spacing={3}>
          <Typography variant="h5">Cambiar contraseña</Typography>
          <Box component="form" onSubmit={onSubmit} noValidate>
            <Stack spacing={2}>
              <TextField
                label="Contraseña actual"
                type="password"
                error={Boolean(errors.currentPassword)}
                helperText={errors.currentPassword ? "Este campo es requerido" : undefined}
                {...register("currentPassword", { required: true })}
              />
              <TextField
                label="Nueva contraseña"
                type="password"
                error={Boolean(errors.newPassword)}
                helperText={errors.newPassword ? "Este campo es requerido" : undefined}
                {...register("newPassword", { required: true })}
              />
              {changePasswordMutation.isError && (
                <Alert severity="error">
                  {changePasswordMutation.error instanceof Error
                    ? changePasswordMutation.error.message
                    : "Error al cambiar la contraseña"}
                </Alert>
              )}
              {changePasswordMutation.isSuccess && (
                <Alert severity="success">Contraseña actualizada correctamente</Alert>
              )}
              <Button type="submit" variant="contained" disabled={changePasswordMutation.isPending}>
                {changePasswordMutation.isPending ? "Guardando..." : "Guardar"}
              </Button>
            </Stack>
          </Box>
        </Stack>
      </Container>
    </>
  )
}
