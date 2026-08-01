import { Button, Chip, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from "@mui/material"
import { Link as RouterLink } from "react-router-dom"
import type { Project } from "../services/projects.service"

const STATE_LABELS: Record<Project["state"], string> = {
  planned: "Planeado",
  active: "Activo",
  on_hold: "En espera",
  completed: "Completado",
  archived: "Archivado"
}

interface ProjectTableProps {
  projects: Project[]
  isAdmin: boolean
  onEdit: (project: Project) => void
  onArchive: (project: Project) => void
  onDelete: (project: Project) => void
}

export function ProjectTable({ projects, isAdmin, onEdit, onArchive, onDelete }: ProjectTableProps) {
  return (
    <TableContainer component={Paper} variant="outlined">
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Nombre</TableCell>
            <TableCell>Estado</TableCell>
            <TableCell>ETA</TableCell>
            <TableCell align="right">Acciones</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {projects.map((project) => (
            <TableRow key={project.id}>
              <TableCell>{project.name}</TableCell>
              <TableCell>
                <Chip label={STATE_LABELS[project.state]} size="small" />
              </TableCell>
              <TableCell>{new Date(project.eta).toLocaleDateString()}</TableCell>
              <TableCell align="right">
                <Button size="small" component={RouterLink} to={`/projects/${project.id}`}>
                  Ver
                </Button>
                {isAdmin && project.state !== "archived" && (
                  <>
                    <Button size="small" onClick={() => onEdit(project)}>
                      Editar
                    </Button>
                    <Button size="small" onClick={() => onArchive(project)}>
                      Archivar
                    </Button>
                  </>
                )}
                {isAdmin && project.state === "archived" && (
                  <Button size="small" color="error" onClick={() => onDelete(project)}>
                    Eliminar
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}
