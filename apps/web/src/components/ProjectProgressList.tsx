import { Box, LinearProgress, Stack, Typography } from "@mui/material"
import type { ProjectProgress } from "../services/dashboard.service"

interface ProjectProgressListProps {
  projects: ProjectProgress[]
}

export function ProjectProgressList({ projects }: ProjectProgressListProps) {
  if (projects.length === 0) {
    return <Typography color="text.secondary">Sin proyectos todavía.</Typography>
  }

  return (
    <Stack spacing={2}>
      {projects.map((project) => (
        <Box key={project.projectId}>
          <Stack direction="row" sx={{ justifyContent: "space-between" }}>
            <Typography variant="body2">{project.projectName}</Typography>
            <Typography variant="body2" color="text.secondary">
              {project.finishedTasks}/{project.totalTasks} tareas · {project.progressPercentage}%
            </Typography>
          </Stack>
          <LinearProgress variant="determinate" value={project.progressPercentage} sx={{ height: 8, borderRadius: 1 }} />
        </Box>
      ))}
    </Stack>
  )
}
