import { useEffect, useState } from "react"
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField
} from "@mui/material"
import { useForm } from "react-hook-form"
import { useSession } from "../hooks/useSession"
import type { AuthUser } from "../services/auth.service"
import type { CreateUserInput, UpdateUserInput } from "../services/users.service"

interface UserFormValues {
  accessIdentifier: string
  name: string
  professionalProfile: string
  password: string
  role: "admin" | "user"
}

interface UserFormDialogProps {
  open: boolean
  user: AuthUser | null
  onClose: () => void
  onCreate: (input: CreateUserInput) => Promise<unknown>
  onUpdate: (id: string, input: UpdateUserInput) => Promise<unknown>
}

export function UserFormDialog({ open, user, onClose, onCreate, onUpdate }: UserFormDialogProps) {
  const { session } = useSession()
  const isEditMode = Boolean(user)
  const isEditingSelf = isEditMode && user?.id === session.user?.id
  const [submitError, setSubmitError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<UserFormValues>()

  useEffect(() => {
    if (open) {
      setSubmitError(null)
      reset({
        accessIdentifier: user?.accessIdentifier ?? "",
        name: user?.name ?? "",
        professionalProfile: user?.professionalProfile ?? "",
        password: "",
        role: user?.role ?? "user"
      })
    }
  }, [open, user, reset])

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null)

    try {
      if (isEditMode && user) {
        await onUpdate(user.id, {
          name: values.name,
          professionalProfile: values.professionalProfile,
          ...(isEditingSelf ? {} : { role: values.role })
        })
      } else {
        await onCreate(values)
      }
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Error al guardar el usuario")
    }
  })

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>{isEditMode ? "Editar usuario" : "Crear usuario"}</DialogTitle>
      <Box component="form" onSubmit={onSubmit} noValidate>
        <DialogContent>
          <Stack spacing={2}>
            <TextField
              label="Identificador de acceso"
              disabled={isEditMode}
              error={Boolean(errors.accessIdentifier)}
              helperText={errors.accessIdentifier ? "Este campo es requerido" : undefined}
              {...register("accessIdentifier", { required: !isEditMode })}
            />
            <TextField
              label="Nombre"
              error={Boolean(errors.name)}
              helperText={errors.name ? "Este campo es requerido" : undefined}
              {...register("name", { required: true })}
            />
            <TextField
              label="Perfil profesional"
              error={Boolean(errors.professionalProfile)}
              helperText={errors.professionalProfile ? "Este campo es requerido" : undefined}
              {...register("professionalProfile", { required: true })}
            />
            {!isEditMode && (
              <TextField
                label="Contraseña"
                type="password"
                error={Boolean(errors.password)}
                helperText={errors.password ? "Este campo es requerido" : undefined}
                {...register("password", { required: !isEditMode })}
              />
            )}
            <TextField
              select
              label="Rol"
              disabled={isEditingSelf}
              helperText={isEditingSelf ? "No puede cambiar su propio rol" : undefined}
              {...register("role", { required: true })}
            >
              <MenuItem value="user">Usuario</MenuItem>
              <MenuItem value="admin">Administrador</MenuItem>
            </TextField>
            {submitError && <Alert severity="error">{submitError}</Alert>}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancelar</Button>
          <Button type="submit" variant="contained" disabled={isSubmitting}>
            Guardar
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  )
}
