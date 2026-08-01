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
import { useUsersQuery } from "../hooks/useUsers"

interface AssignFormValues {
  assignedUserId: string
  comment: string
}

interface TaskAssignDialogProps {
  open: boolean
  isReopening: boolean
  onClose: () => void
  onAssign: (assignedUserId: string, comment?: string) => Promise<unknown>
}

export function TaskAssignDialog({ open, isReopening, onClose, onAssign }: TaskAssignDialogProps) {
  const { data: users } = useUsersQuery()
  const activeUsers = (users ?? []).filter((user) => user.state === "active")
  const [submitError, setSubmitError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<AssignFormValues>()

  useEffect(() => {
    if (open) {
      setSubmitError(null)
      reset({ assignedUserId: "", comment: "" })
    }
  }, [open, reset])

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null)

    try {
      await onAssign(values.assignedUserId, isReopening ? values.comment : undefined)
      onClose()
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Error al asignar la tarea")
    }
  })

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Asignar tarea</DialogTitle>
      <Box component="form" onSubmit={onSubmit} noValidate>
        <DialogContent>
          <Stack spacing={2}>
            <TextField
              select
              label="Usuario"
              defaultValue=""
              error={Boolean(errors.assignedUserId)}
              helperText={errors.assignedUserId ? "Debe seleccionar un usuario" : undefined}
              {...register("assignedUserId", { required: true })}
            >
              {activeUsers.map((user) => (
                <MenuItem key={user.id} value={user.id}>
                  {user.name} ({user.accessIdentifier})
                </MenuItem>
              ))}
            </TextField>
            {isReopening && (
              <TextField
                label="Comentario (obligatorio al reabrir una tarea finalizada)"
                multiline
                minRows={2}
                defaultValue=""
                error={Boolean(errors.comment)}
                helperText={errors.comment ? "El comentario es obligatorio" : undefined}
                {...register("comment", { required: isReopening })}
              />
            )}
            {submitError && <Alert severity="error">{submitError}</Alert>}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancelar</Button>
          <Button type="submit" variant="contained" disabled={isSubmitting}>
            Asignar
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  )
}
