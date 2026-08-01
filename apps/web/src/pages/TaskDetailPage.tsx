import { useState } from "react"
import { Alert, Box, Button, Chip, CircularProgress, Container, Divider, Stack, Typography } from "@mui/material"
import { useParams } from "react-router-dom"
import { AppHeader } from "../components/AppHeader"
import { CommentForm } from "../components/CommentForm"
import { CommentList } from "../components/CommentList"
import { ProjectLifecycleDialog } from "../components/ProjectLifecycleDialog"
import { TaskAssignDialog } from "../components/TaskAssignDialog"
import { TaskFormDialog } from "../components/TaskFormDialog"
import { TaskStateDialog } from "../components/TaskStateDialog"
import { useCreateTaskCommentMutation, useTaskCommentsQuery } from "../hooks/useComments"
import { useSession } from "../hooks/useSession"
import {
  useAssignTaskMutation,
  useChangeTaskStateMutation,
  useDeleteTaskMutation,
  useTaskQuery,
  useUnassignTaskMutation,
  useUpdateTaskMutation
} from "../hooks/useTasks"

const STATE_LABELS: Record<string, string> = {
  open: "Abierta",
  to_do: "Por hacer",
  in_process: "En proceso",
  testing: "Testing",
  qa: "QA",
  on_hold: "En espera",
  finished: "Finalizada"
}

const PRIORITY_LABELS: Record<string, string> = {
  urgent: "Urgente",
  high: "Alta",
  medium: "Media",
  low: "Baja"
}

export function TaskDetailPage() {
  const { projectId, taskId } = useParams<{ projectId: string; taskId: string }>()
  const resolvedProjectId = projectId ?? ""
  const resolvedTaskId = taskId ?? ""

  const { session } = useSession()
  const isAdmin = session.user?.role === "admin"

  const { data: task, isLoading, isError, error } = useTaskQuery(resolvedTaskId)
  const commentsQuery = useTaskCommentsQuery(resolvedTaskId)
  const createCommentMutation = useCreateTaskCommentMutation(resolvedTaskId)

  const updateMutation = useUpdateTaskMutation(resolvedProjectId, resolvedTaskId)
  const assignMutation = useAssignTaskMutation(resolvedProjectId, resolvedTaskId)
  const unassignMutation = useUnassignTaskMutation(resolvedProjectId, resolvedTaskId)
  const changeStateMutation = useChangeTaskStateMutation(resolvedProjectId, resolvedTaskId)
  const deleteMutation = useDeleteTaskMutation(resolvedProjectId, resolvedTaskId)

  const [editOpen, setEditOpen] = useState(false)
  const [assignOpen, setAssignOpen] = useState(false)
  const [stateOpen, setStateOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [unassignOpen, setUnassignOpen] = useState(false)

  const canChangeState = Boolean(
    task && task.state !== "open" && (isAdmin || task.assignedUserId === session.user?.id)
  )

  return (
    <>
      <AppHeader />
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Stack spacing={3}>
          {isLoading && (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <CircularProgress />
            </Box>
          )}

          {isError && (
            <Alert severity="error">{error instanceof Error ? error.message : "Error al cargar la tarea"}</Alert>
          )}

          {task && (
            <Stack spacing={1}>
              <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", flexWrap: "wrap" }}>
                <Typography variant="h4">{task.title}</Typography>
                {isAdmin && (
                  <Stack direction="row" spacing={1}>
                    <Button size="small" onClick={() => setEditOpen(true)}>
                      Editar
                    </Button>
                    {task.assignedUserId ? (
                      <>
                        <Button size="small" onClick={() => setAssignOpen(true)}>
                          Reasignar
                        </Button>
                        <Button
                          size="small"
                          onClick={() =>
                            task.state === "finished" ? setUnassignOpen(true) : unassignMutation.mutate(undefined)
                          }
                        >
                          Desasignar
                        </Button>
                      </>
                    ) : (
                      <Button size="small" onClick={() => setAssignOpen(true)}>
                        Asignar
                      </Button>
                    )}
                    <Button size="small" color="error" onClick={() => setDeleteOpen(true)}>
                      Eliminar
                    </Button>
                  </Stack>
                )}
              </Stack>

              <Stack direction="row" spacing={1}>
                <Chip label={STATE_LABELS[task.state] ?? task.state} size="small" />
                <Chip label={PRIORITY_LABELS[task.priority] ?? task.priority} size="small" variant="outlined" />
              </Stack>

              <Typography color="text.secondary">{task.description}</Typography>
              <Typography variant="body2">
                Fecha límite: {new Date(task.dueDate).toLocaleDateString(undefined, { timeZone: "UTC" })}
              </Typography>
              <Typography variant="body2">Asignado a: {task.assignedUserName ?? "Sin asignar"}</Typography>

              {canChangeState && (
                <Button variant="outlined" sx={{ alignSelf: "flex-start" }} onClick={() => setStateOpen(true)}>
                  Cambiar estado
                </Button>
              )}

              {unassignMutation.isError && (
                <Alert severity="error">
                  {unassignMutation.error instanceof Error
                    ? unassignMutation.error.message
                    : "Error al desasignar la tarea"}
                </Alert>
              )}
            </Stack>
          )}

          <Divider />

          <Stack spacing={2}>
            <Typography variant="h5">Comentarios</Typography>

            {commentsQuery.isLoading && (
              <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
                <CircularProgress size={24} />
              </Box>
            )}

            {commentsQuery.isError && (
              <Alert severity="error">
                {commentsQuery.error instanceof Error ? commentsQuery.error.message : "Error al cargar comentarios"}
              </Alert>
            )}

            {commentsQuery.data && <CommentList comments={commentsQuery.data} />}

            <CommentForm onSubmit={(content) => createCommentMutation.mutateAsync(content)} />
          </Stack>
        </Stack>
      </Container>

      {task && (
        <>
          <TaskFormDialog
            open={editOpen}
            task={task}
            onClose={() => setEditOpen(false)}
            onUpdate={(input) => updateMutation.mutateAsync(input)}
          />

          <TaskAssignDialog
            open={assignOpen}
            isReopening={task.state === "finished"}
            onClose={() => setAssignOpen(false)}
            onAssign={(assignedUserId, comment) => assignMutation.mutateAsync({ assignedUserId, comment })}
          />

          <TaskStateDialog
            open={stateOpen}
            currentState={task.state}
            onClose={() => setStateOpen(false)}
            onConfirm={(state, comment) => changeStateMutation.mutateAsync({ state, comment })}
          />

          <ProjectLifecycleDialog
            open={deleteOpen}
            title="Eliminar tarea"
            description="Esta acción elimina lógicamente la tarea. Ingrese un comentario obligatorio."
            confirmLabel="Eliminar"
            onClose={() => setDeleteOpen(false)}
            onConfirm={(comment) => deleteMutation.mutateAsync(comment)}
          />

          <ProjectLifecycleDialog
            open={unassignOpen}
            title="Desasignar tarea"
            description="Esta acción reabre una tarea finalizada. Ingrese un comentario obligatorio."
            confirmLabel="Desasignar"
            onClose={() => setUnassignOpen(false)}
            onConfirm={(comment) => unassignMutation.mutateAsync(comment)}
          />
        </>
      )}
    </>
  )
}
