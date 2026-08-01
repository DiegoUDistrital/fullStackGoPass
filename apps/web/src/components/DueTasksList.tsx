import { Chip, Stack, Typography } from "@mui/material"
import { Link as RouterLink } from "react-router-dom"
import type { DueTaskSummary } from "../services/dashboard.service"

interface DueTasksListProps {
  tasks: DueTaskSummary[]
  emptyLabel: string
  severity: "warning" | "error"
}

export function DueTasksList({ tasks, emptyLabel, severity }: DueTasksListProps) {
  if (tasks.length === 0) {
    return <Typography color="text.secondary">{emptyLabel}</Typography>
  }

  return (
    <Stack spacing={1.5}>
      {tasks.map((task) => (
        <Stack
          key={task.id}
          direction="row"
          component={RouterLink}
          to={`/projects/${task.projectId}/tasks/${task.id}`}
          sx={{ justifyContent: "space-between", alignItems: "center", textDecoration: "none", color: "inherit" }}
        >
          <Stack>
            <Typography variant="body2">{task.title}</Typography>
            <Typography variant="caption" color="text.secondary">
              {task.projectName} · {task.assignedUserName ?? "Sin asignar"}
            </Typography>
          </Stack>
          <Chip
            size="small"
            color={severity}
            label={new Date(task.dueDate).toLocaleDateString(undefined, { timeZone: "UTC" })}
            variant="outlined"
          />
        </Stack>
      ))}
    </Stack>
  )
}
