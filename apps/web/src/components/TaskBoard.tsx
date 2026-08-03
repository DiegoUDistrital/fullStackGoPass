import { Avatar, Box, Card, CardContent, Chip, Stack, Typography } from "@mui/material"
import { Link as RouterLink } from "react-router-dom"
import type { Task } from "../services/tasks.service"
import {
  TASK_PRIORITY_COLORS,
  TASK_PRIORITY_ICONS,
  TASK_PRIORITY_LABELS,
  TASK_STATE_LABELS,
  TASK_STATE_ORDER
} from "../theme/status"

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("")
}

interface TaskBoardProps {
  projectId: string
  tasks: Task[]
}

export function TaskBoard({ projectId, tasks }: TaskBoardProps) {
  const columns = TASK_STATE_ORDER.map((state) => ({
    state,
    tasks: tasks.filter((task) => task.state === state)
  })).filter((column) => column.tasks.length > 0 || column.state !== "open")

  if (tasks.length === 0) {
    return <Typography color="text.secondary">Sin tareas todavía.</Typography>
  }

  return (
    <Box sx={{ display: "flex", gap: 2, overflowX: "auto", pb: 1 }}>
      {columns.map((column) => (
        <Box key={column.state} sx={{ minWidth: 260 }}>
          <Stack
            direction="row"
            spacing={1}
            sx={{ alignItems: "center", mb: 1.5, px: 0.5 }}
          >
            <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: 0.5 }}>
              {TASK_STATE_LABELS[column.state]}
            </Typography>
            <Chip label={column.tasks.length} size="small" sx={{ height: 20, fontSize: 12 }} />
          </Stack>
          <Stack spacing={1.5}>
            {column.tasks.map((task) => {
              const PriorityIcon = TASK_PRIORITY_ICONS[task.priority]

              return (
                <Card
                  key={task.id}
                  variant="outlined"
                  component={RouterLink}
                  to={`/projects/${projectId}/tasks/${task.id}`}
                  sx={{
                    textDecoration: "none",
                    color: "inherit",
                    display: "block",
                    transition: "box-shadow 0.15s, border-color 0.15s",
                    "&:hover": {
                      boxShadow: 1,
                      borderColor: "primary.main"
                    }
                  }}
                >
                  <CardContent>
                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 1.5 }}>
                      {task.title}
                    </Typography>
                    <Stack direction="row" spacing={1} sx={{ alignItems: "center", justifyContent: "space-between" }}>
                      <Chip
                        icon={<PriorityIcon fontSize="small" />}
                        label={TASK_PRIORITY_LABELS[task.priority]}
                        color={TASK_PRIORITY_COLORS[task.priority]}
                        variant="outlined"
                        size="small"
                      />
                      {task.assignedUserName && (
                        <Avatar sx={{ width: 24, height: 24, fontSize: 11 }} title={task.assignedUserName}>
                          {getInitials(task.assignedUserName)}
                        </Avatar>
                      )}
                    </Stack>
                  </CardContent>
                </Card>
              )
            })}
          </Stack>
        </Box>
      ))}
    </Box>
  )
}
