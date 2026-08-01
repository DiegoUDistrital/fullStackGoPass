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
import type { CreateTaskInput, Task, TaskPriority, UpdateTaskInput } from "../services/tasks.service"

interface TaskFormValues {
  title: string
  description: string
  priority: TaskPriority
  dueDate: string
}

interface TaskFormDialogProps {
  open: boolean
  task: Task | null
  onClose: () => void
  onCreate?: (input: CreateTaskInput) => Promise<unknown>
  onUpdate?: (input: UpdateTaskInput) => Promise<unknown>
}

function toDateInputValue(value?: string): string {
  if (!value) {
    return ""
  }
  return value.slice(0, 10)
}

export function TaskFormDialog({ open, task, onClose, onCreate, onUpdate }: TaskFormDialogProps) {
  const isEditMode = Boolean(task)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<TaskFormValues>()

  useEffect(() => {
    if (open) {
      setSubmitError(null)
      reset({
        title: task?.title ?? "",
        description: task?.description ?? "",
        priority: task?.priority ?? "medium",
        dueDate: toDateInputValue(task?.dueDate)
      })
    }
  }, [open, task, reset])

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null)
    const dueDate = new Date(`${values.dueDate}T00:00:00.000Z`).toISOString()

    try {
      if (isEditMode) {
        await onUpdate?.({
          title: values.title,
          description: values.description,
          priority: values.priority,
          dueDate
        })
      } else {
        await onCreate?.({
          title: values.title,
          description: values.description,
          priority: values.priority,
          dueDate
        })
      }
      onClose()
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Error al guardar la tarea")
    }
  })

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>{isEditMode ? "Editar tarea" : "Crear tarea"}</DialogTitle>
      <Box component="form" onSubmit={onSubmit} noValidate>
        <DialogContent>
          <Stack spacing={2}>
            <TextField
              label="Título"
              error={Boolean(errors.title)}
              helperText={errors.title ? "Este campo es requerido" : undefined}
              {...register("title", { required: true })}
            />
            <TextField
              label="Descripción"
              multiline
              minRows={2}
              error={Boolean(errors.description)}
              helperText={errors.description ? "Este campo es requerido" : undefined}
              {...register("description", { required: true })}
            />
            <TextField select label="Prioridad" {...register("priority", { required: true })}>
              <MenuItem value="urgent">Urgente</MenuItem>
              <MenuItem value="high">Alta</MenuItem>
              <MenuItem value="medium">Media</MenuItem>
              <MenuItem value="low">Baja</MenuItem>
            </TextField>
            <TextField
              label="Fecha límite"
              type="date"
              slotProps={{ inputLabel: { shrink: true } }}
              error={Boolean(errors.dueDate)}
              helperText={errors.dueDate ? "Este campo es requerido" : undefined}
              {...register("dueDate", { required: true })}
            />
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
