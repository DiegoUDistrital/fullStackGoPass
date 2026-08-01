import { useEffect, useState } from "react"
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography
} from "@mui/material"
import { useForm } from "react-hook-form"

interface LifecycleFormValues {
  comment: string
}

interface ProjectLifecycleDialogProps {
  open: boolean
  title: string
  description: string
  confirmLabel: string
  onClose: () => void
  onConfirm: (comment: string) => Promise<unknown>
}

export function ProjectLifecycleDialog({
  open,
  title,
  description,
  confirmLabel,
  onClose,
  onConfirm
}: ProjectLifecycleDialogProps) {
  const [submitError, setSubmitError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<LifecycleFormValues>()

  useEffect(() => {
    if (open) {
      setSubmitError(null)
      reset({ comment: "" })
    }
  }, [open, reset])

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null)

    try {
      await onConfirm(values.comment)
      onClose()
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Error al procesar la acción")
    }
  })

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <Box component="form" onSubmit={onSubmit} noValidate>
        <DialogContent>
          <Stack spacing={2}>
            <Typography color="text.secondary">{description}</Typography>
            <TextField
              label="Comentario"
              multiline
              minRows={2}
              error={Boolean(errors.comment)}
              helperText={errors.comment ? "El comentario es obligatorio" : undefined}
              {...register("comment", { required: true })}
            />
            {submitError && <Alert severity="error">{submitError}</Alert>}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancelar</Button>
          <Button type="submit" variant="contained" color="warning" disabled={isSubmitting}>
            {confirmLabel}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  )
}
