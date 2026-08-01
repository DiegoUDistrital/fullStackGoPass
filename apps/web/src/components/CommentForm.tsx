import { useState } from "react"
import { Alert, Box, Button, Stack, TextField } from "@mui/material"
import { useForm } from "react-hook-form"

interface CommentFormValues {
  content: string
}

interface CommentFormProps {
  onSubmit: (content: string) => Promise<unknown>
  submitLabel?: string
}

export function CommentForm({ onSubmit, submitLabel = "Comentar" }: CommentFormProps) {
  const [submitError, setSubmitError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<CommentFormValues>()

  const submit = handleSubmit(async (values) => {
    setSubmitError(null)

    try {
      await onSubmit(values.content)
      reset()
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Error al enviar el comentario")
    }
  })

  return (
    <Box component="form" onSubmit={submit} noValidate>
      <Stack spacing={1}>
        <TextField
          label="Nuevo comentario"
          multiline
          minRows={2}
          error={Boolean(errors.content)}
          helperText={errors.content ? "Este campo es requerido" : undefined}
          {...register("content", { required: true })}
        />
        {submitError && <Alert severity="error">{submitError}</Alert>}
        <Button type="submit" variant="contained" disabled={isSubmitting} sx={{ alignSelf: "flex-start" }}>
          {submitLabel}
        </Button>
      </Stack>
    </Box>
  )
}
