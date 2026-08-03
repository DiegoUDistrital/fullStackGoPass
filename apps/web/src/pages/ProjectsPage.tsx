import { useState } from "react"
import { Alert, Box, Button, CircularProgress, Stack, Typography } from "@mui/material"
import { ProjectFormDialog } from "../components/ProjectFormDialog"
import { ProjectLifecycleDialog } from "../components/ProjectLifecycleDialog"
import { ProjectTable } from "../components/ProjectTable"
import {
  useArchiveProjectMutation,
  useCreateProjectMutation,
  useDeleteProjectMutation,
  useProjectsQuery,
  useUpdateProjectMutation
} from "../hooks/useProjects"
import { useSession } from "../hooks/useSession"
import type { Project } from "../services/projects.service"

interface FormDialogState {
  open: boolean
  project: Project | null
}

interface LifecycleDialogState {
  open: boolean
  project: Project | null
  mode: "archive" | "delete"
}

export function ProjectsPage() {
  const { session } = useSession()
  const isAdmin = session.user?.role === "admin"

  const { data: projects, isLoading, isError, error } = useProjectsQuery()
  const createMutation = useCreateProjectMutation()
  const updateMutation = useUpdateProjectMutation()
  const archiveMutation = useArchiveProjectMutation()
  const deleteMutation = useDeleteProjectMutation()

  const [formDialog, setFormDialog] = useState<FormDialogState>({ open: false, project: null })
  const [lifecycleDialog, setLifecycleDialog] = useState<LifecycleDialogState>({
    open: false,
    project: null,
    mode: "archive"
  })

  const openCreateDialog = () => setFormDialog({ open: true, project: null })
  const openEditDialog = (project: Project) => setFormDialog({ open: true, project })
  const closeFormDialog = () => setFormDialog({ open: false, project: null })

  const openArchiveDialog = (project: Project) => setLifecycleDialog({ open: true, project, mode: "archive" })
  const openDeleteDialog = (project: Project) => setLifecycleDialog({ open: true, project, mode: "delete" })
  const closeLifecycleDialog = () => setLifecycleDialog({ open: false, project: null, mode: "archive" })

  return (
    <>
      <Stack spacing={3}>
        <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="h4">Proyectos</Typography>
          {isAdmin && (
            <Button variant="contained" onClick={openCreateDialog}>
              Crear proyecto
            </Button>
          )}
        </Stack>

        {isLoading && (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress />
          </Box>
        )}

        {isError && (
          <Alert severity="error">{error instanceof Error ? error.message : "Error al cargar proyectos"}</Alert>
        )}

        {projects && (
          <ProjectTable
            projects={projects}
            isAdmin={isAdmin}
            onEdit={openEditDialog}
            onArchive={openArchiveDialog}
            onDelete={openDeleteDialog}
          />
        )}
      </Stack>

      <ProjectFormDialog
        open={formDialog.open}
        project={formDialog.project}
        onClose={closeFormDialog}
        onCreate={(input) => createMutation.mutateAsync(input)}
        onUpdate={(id, input) => updateMutation.mutateAsync({ id, input })}
      />

      <ProjectLifecycleDialog
        open={lifecycleDialog.open}
        title={lifecycleDialog.mode === "archive" ? "Archivar proyecto" : "Eliminar proyecto"}
        description={
          lifecycleDialog.mode === "archive"
            ? "Esta acción archivará el proyecto. Ingrese un comentario obligatorio."
            : "Esta acción elimina lógicamente el proyecto archivado. Ingrese un comentario obligatorio."
        }
        confirmLabel={lifecycleDialog.mode === "archive" ? "Archivar" : "Eliminar"}
        onClose={closeLifecycleDialog}
        onConfirm={(comment) => {
          if (!lifecycleDialog.project) {
            return Promise.resolve()
          }
          return lifecycleDialog.mode === "archive"
            ? archiveMutation.mutateAsync({ id: lifecycleDialog.project.id, comment })
            : deleteMutation.mutateAsync({ id: lifecycleDialog.project.id, comment })
        }}
      />
    </>
  )
}
