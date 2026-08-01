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
import type { TaskLifecycleState, TaskState } from "../services/tasks.service"

const STATE_LABELS: Record<TaskLifecycleState, string> = {
  in_process: "En proceso",
  testing: "Testing",
  qa: "QA",
  on_hold: "En espera",
  finished: "Finalizada"
}

interface StateFormValues {
  state: TaskLifecycleState
  comment: string
}

interface TaskStateDialogProps {
  open: boolean
  currentState: TaskState
  onClose: () => void
  onConfirm: (state: TaskLifecycleState, comment?: string) => Promise<unknown>
}

function availableTargetStates(currentState: TaskState): TaskLifecycleState[] {
  const all: TaskLifecycleState[] = ["in_process", "testing", "qa", "on_hold", "finished"]

  if (currentState === "testing" || currentState === "qa") {
    return all.filter((state) => state !== currentState)
  }

  return all.filter((state) => state !== currentState && state !== "finished")
}

export function TaskStateDialog({ open, currentState, onClose, onConfirm }: TaskStateDialogProps) {
  const isReopening = currentState === "finished"
  const targets = availableTargetStates(currentState)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<StateFormValues>()

  useEffect(() => {
    if (open) {
      setSubmitError(null)
      reset({ state: targets[0], comment: "" })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, reset])

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null)

    try {
      await onConfirm(values.state, isReopening ? values.comment : undefined)
      onClose()
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Error al cambiar el estado")
    }
  })

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Cambiar estado</DialogTitle>
      <Box component="form" onSubmit={onSubmit} noValidate>
        <DialogContent>
          <Stack spacing={2}>
            <TextField select label="Nuevo estado" {...register("state", { required: true })}>
              {targets.map((state) => (
                <MenuItem key={state} value={state}>
                  {STATE_LABELS[state]}
                </MenuItem>
              ))}
            </TextField>
            {isReopening && (
              <TextField
                label="Comentario (obligatorio al reabrir)"
                multiline
                minRows={2}
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
            Confirmar
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  )
}
