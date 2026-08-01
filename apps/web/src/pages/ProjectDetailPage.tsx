import { useState } from "react"
import { Alert, Box, Button, Chip, CircularProgress, Container, Divider, Stack, Typography } from "@mui/material"
import { useParams } from "react-router-dom"
import { AppHeader } from "../components/AppHeader"
import { CommentForm } from "../components/CommentForm"
import { CommentList } from "../components/CommentList"
import { TaskBoard } from "../components/TaskBoard"
import { TaskFormDialog } from "../components/TaskFormDialog"
import { useCreateProjectCommentMutation, useProjectCommentsQuery } from "../hooks/useComments"
import { useProjectQuery } from "../hooks/useProjects"
import { useSession } from "../hooks/useSession"
import { useCreateTaskMutation, useTasksByProjectQuery } from "../hooks/useTasks"

const STATE_LABELS: Record<string, string> = {
  planned: "Planeado",
  active: "Activo",
  on_hold: "En espera",
  completed: "Completado",
  archived: "Archivado"
}

export function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>()
  const projectId = id ?? ""

  const { session } = useSession()
  const isAdmin = session.user?.role === "admin"

  const { data: project, isLoading, isError, error } = useProjectQuery(projectId)
  const commentsQuery = useProjectCommentsQuery(projectId)
  const createCommentMutation = useCreateProjectCommentMutation(projectId)

  const tasksQuery = useTasksByProjectQuery(projectId)
  const createTaskMutation = useCreateTaskMutation(projectId)
  const [createTaskOpen, setCreateTaskOpen] = useState(false)

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
            <Alert severity="error">{error instanceof Error ? error.message : "Error al cargar el proyecto"}</Alert>
          )}

          {project && (
            <Stack spacing={1}>
              <Typography variant="h4">{project.name}</Typography>
              <Chip label={STATE_LABELS[project.state] ?? project.state} sx={{ alignSelf: "flex-start" }} />
              <Typography color="text.secondary">{project.description}</Typography>
              <Typography variant="body2">ETA: {new Date(project.eta).toLocaleDateString()}</Typography>
            </Stack>
          )}

          <Divider />

          <Stack spacing={2}>
            <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
              <Typography variant="h5">Tareas</Typography>
              {isAdmin && (
                <Button variant="contained" size="small" onClick={() => setCreateTaskOpen(true)}>
                  Crear tarea
                </Button>
              )}
            </Stack>

            {tasksQuery.isLoading && (
              <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
                <CircularProgress size={24} />
              </Box>
            )}

            {tasksQuery.isError && (
              <Alert severity="error">
                {tasksQuery.error instanceof Error ? tasksQuery.error.message : "Error al cargar tareas"}
              </Alert>
            )}

            {tasksQuery.data && <TaskBoard projectId={projectId} tasks={tasksQuery.data} />}
          </Stack>

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

      <TaskFormDialog
        open={createTaskOpen}
        task={null}
        onClose={() => setCreateTaskOpen(false)}
        onCreate={(input) => createTaskMutation.mutateAsync(input).then(() => setCreateTaskOpen(false))}
      />
    </>
  )
}
