import { Box, Card, CardContent, Chip, Stack, Typography } from "@mui/material"
import { Link as RouterLink } from "react-router-dom"
import type { Task, TaskState } from "../services/tasks.service"

const COLUMN_ORDER: TaskState[] = ["open", "to_do", "in_process", "testing", "qa", "on_hold", "finished"]

const STATE_LABELS: Record<TaskState, string> = {
  open: "Abierta",
  to_do: "Por hacer",
  in_process: "En proceso",
  testing: "Testing",
  qa: "QA",
  on_hold: "En espera",
  finished: "Finalizada"
}

const PRIORITY_LABELS: Record<Task["priority"], string> = {
  urgent: "Urgente",
  high: "Alta",
  medium: "Media",
  low: "Baja"
}

interface TaskBoardProps {
  projectId: string
  tasks: Task[]
}

export function TaskBoard({ projectId, tasks }: TaskBoardProps) {
  const columns = COLUMN_ORDER.map((state) => ({
    state,
    tasks: tasks.filter((task) => task.state === state)
  })).filter((column) => column.tasks.length > 0 || column.state !== "open")

  if (tasks.length === 0) {
    return <Typography color="text.secondary">Sin tareas todavía.</Typography>
  }

  return (
    <Box sx={{ display: "flex", gap: 2, overflowX: "auto", pb: 1 }}>
      {columns.map((column) => (
        <Box key={column.state} sx={{ minWidth: 220 }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            {STATE_LABELS[column.state]} ({column.tasks.length})
          </Typography>
          <Stack spacing={1}>
            {column.tasks.map((task) => (
              <Card
                key={task.id}
                variant="outlined"
                component={RouterLink}
                to={`/projects/${projectId}/tasks/${task.id}`}
                sx={{ textDecoration: "none", color: "inherit", display: "block" }}
              >
                <CardContent>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {task.title}
                  </Typography>
                  <Stack direction="row" spacing={1} sx={{ mt: 1, alignItems: "center" }}>
                    <Chip label={PRIORITY_LABELS[task.priority]} size="small" />
                    {task.assignedUserName && (
                      <Typography variant="caption" color="text.secondary">
                        {task.assignedUserName}
                      </Typography>
                    )}
                  </Stack>
                </CardContent>
              </Card>
            ))}
          </Stack>
        </Box>
      ))}
    </Box>
  )
}
