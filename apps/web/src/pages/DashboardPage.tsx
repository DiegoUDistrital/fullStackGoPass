import { Alert, Box, CircularProgress, Divider, Stack, Typography } from "@mui/material"
import FolderOutlinedIcon from "@mui/icons-material/FolderOutlined"
import GroupOutlinedIcon from "@mui/icons-material/GroupOutlined"
import { DueTasksList } from "../components/DueTasksList"
import { ProjectProgressList } from "../components/ProjectProgressList"
import { StatTile } from "../components/StatTile"
import { TaskStateDistributionTable } from "../components/TaskStateDistributionTable"
import { UserWorkloadTable } from "../components/UserWorkloadTable"
import { useDashboardQuery } from "../hooks/useDashboard"

export function DashboardPage() {
  const { data, isLoading, isError, error } = useDashboardQuery()

  return (
    <Stack spacing={3}>
      <Typography variant="h4">Dashboard</Typography>

      {isLoading && (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {isError && (
        <Alert severity="error">{error instanceof Error ? error.message : "Error al cargar el dashboard"}</Alert>
      )}

      {data && (
        <>
          <Stack direction="row" spacing={2} sx={{ flexWrap: "wrap" }}>
            <StatTile
              label="Proyectos activos"
              value={data.activeProjectsCount}
              icon={FolderOutlinedIcon}
              color="primary"
            />
            <StatTile
              label="Usuarios con tareas pendientes"
              value={data.userWorkload.length}
              icon={GroupOutlinedIcon}
              color="warning"
            />
          </Stack>

          <Divider />

          <Stack spacing={2}>
            <Typography variant="h5">Progreso por proyecto</Typography>
            <ProjectProgressList projects={data.projectsProgress} />
          </Stack>

          <Divider />

          <Stack spacing={2}>
            <Typography variant="h5">Distribución de tareas</Typography>
            <TaskStateDistributionTable distribution={data.taskStateDistribution} />
          </Stack>

          <Divider />

          <Stack spacing={2}>
            <Typography variant="h5">Carga de trabajo por usuario</Typography>
            <UserWorkloadTable workload={data.userWorkload} />
          </Stack>

          <Divider />

          <Stack spacing={2}>
            <Typography variant="h5">Tareas próximas a vencer</Typography>
            <DueTasksList
              tasks={data.upcomingDueTasks}
              emptyLabel="Sin tareas próximas a vencer."
              severity="warning"
            />
          </Stack>

          <Divider />

          <Stack spacing={2}>
            <Typography variant="h5">Tareas vencidas</Typography>
            <DueTasksList tasks={data.overdueTasks} emptyLabel="Sin tareas vencidas." severity="error" />
          </Stack>
        </>
      )}
    </Stack>
  )
}
