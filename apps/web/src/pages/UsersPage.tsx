import { useState } from "react"
import { Alert, Box, Button, CircularProgress, Container, Stack, Typography } from "@mui/material"
import { AppHeader } from "../components/AppHeader"
import { UserFormDialog } from "../components/UserFormDialog"
import { UserTable } from "../components/UserTable"
import {
  useCreateUserMutation,
  useSetUserStateMutation,
  useUpdateUserMutation,
  useUsersQuery
} from "../hooks/useUsers"
import type { AuthUser } from "../services/auth.service"

interface DialogState {
  open: boolean
  user: AuthUser | null
}

export function UsersPage() {
  const { data: users, isLoading, isError, error } = useUsersQuery()
  const createMutation = useCreateUserMutation()
  const updateMutation = useUpdateUserMutation()
  const setStateMutation = useSetUserStateMutation()

  const [dialogState, setDialogState] = useState<DialogState>({ open: false, user: null })

  const openCreateDialog = () => setDialogState({ open: true, user: null })
  const openEditDialog = (user: AuthUser) => setDialogState({ open: true, user })
  const closeDialog = () => setDialogState({ open: false, user: null })

  const handleToggleState = (user: AuthUser) => {
    setStateMutation.mutate({ id: user.id, state: user.state === "active" ? "inactive" : "active" })
  }

  return (
    <>
      <AppHeader />
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Stack spacing={3}>
          <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
            <Typography variant="h4">Gestión de usuarios</Typography>
            <Button variant="contained" onClick={openCreateDialog}>
              Crear usuario
            </Button>
          </Stack>

          {isLoading && (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <CircularProgress />
            </Box>
          )}

          {isError && (
            <Alert severity="error">{error instanceof Error ? error.message : "Error al cargar usuarios"}</Alert>
          )}

          {setStateMutation.isError && (
            <Alert severity="error">
              {setStateMutation.error instanceof Error
                ? setStateMutation.error.message
                : "Error al cambiar el estado del usuario"}
            </Alert>
          )}

          {users && <UserTable users={users} onEdit={openEditDialog} onToggleState={handleToggleState} />}
        </Stack>
      </Container>

      <UserFormDialog
        open={dialogState.open}
        user={dialogState.user}
        onClose={closeDialog}
        onCreate={(input) => createMutation.mutateAsync(input).then(closeDialog)}
        onUpdate={(id, input) => updateMutation.mutateAsync({ id, input }).then(closeDialog)}
      />
    </>
  )
}
