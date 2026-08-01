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
import type { CreateProjectInput, Project, ProjectLifecycleState, UpdateProjectInput } from "../services/projects.service"

interface ProjectFormValues {
  name: string
  description: string
  eta: string
  state: ProjectLifecycleState
}

interface ProjectFormDialogProps {
  open: boolean
  project: Project | null
  onClose: () => void
  onCreate: (input: CreateProjectInput) => Promise<unknown>
  onUpdate: (id: string, input: UpdateProjectInput) => Promise<unknown>
}

function toDateInputValue(value?: string): string {
  if (!value) {
    return ""
  }
  return value.slice(0, 10)
}

export function ProjectFormDialog({ open, project, onClose, onCreate, onUpdate }: ProjectFormDialogProps) {
  const isEditMode = Boolean(project)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<ProjectFormValues>()

  useEffect(() => {
    if (open) {
      setSubmitError(null)
      reset({
        name: project?.name ?? "",
        description: project?.description ?? "",
        eta: toDateInputValue(project?.eta),
        state: (project?.state as ProjectLifecycleState) ?? "planned"
      })
    }
  }, [open, project, reset])

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null)
    const eta = new Date(`${values.eta}T00:00:00.000Z`).toISOString()

    try {
      if (isEditMode && project) {
        await onUpdate(project.id, {
          name: values.name,
          description: values.description,
          eta,
          state: values.state
        })
      } else {
        await onCreate({
          name: values.name,
          description: values.description,
          eta,
          state: values.state
        })
      }
      onClose()
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Error al guardar el proyecto")
    }
  })

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>{isEditMode ? "Editar proyecto" : "Crear proyecto"}</DialogTitle>
      <Box component="form" onSubmit={onSubmit} noValidate>
        <DialogContent>
          <Stack spacing={2}>
            <TextField
              label="Nombre"
              error={Boolean(errors.name)}
              helperText={errors.name ? "Este campo es requerido" : undefined}
              {...register("name", { required: true })}
            />
            <TextField
              label="Descripción"
              multiline
              minRows={2}
              error={Boolean(errors.description)}
              helperText={errors.description ? "Este campo es requerido" : undefined}
              {...register("description", { required: true })}
            />
            <TextField
              label="ETA"
              type="date"
              slotProps={{ inputLabel: { shrink: true } }}
              error={Boolean(errors.eta)}
              helperText={errors.eta ? "Este campo es requerido" : undefined}
              {...register("eta", { required: true })}
            />
            <TextField select label="Estado" {...register("state", { required: true })}>
              <MenuItem value="planned">Planeado</MenuItem>
              <MenuItem value="active">Activo</MenuItem>
              <MenuItem value="on_hold">En espera</MenuItem>
              <MenuItem value="completed">Completado</MenuItem>
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
