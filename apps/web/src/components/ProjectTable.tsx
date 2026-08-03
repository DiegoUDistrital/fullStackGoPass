import { Chip, IconButton, Paper, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Tooltip } from "@mui/material"
import ArchiveOutlinedIcon from "@mui/icons-material/ArchiveOutlined"
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlined"
import EditOutlinedIcon from "@mui/icons-material/EditOutlined"
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined"
import { Link as RouterLink } from "react-router-dom"
import type { Project } from "../services/projects.service"
import { PROJECT_STATE_COLORS, PROJECT_STATE_LABELS, PROJECT_STATE_VARIANTS } from "../theme/status"

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
              <TableCell sx={{ fontWeight: 600 }}>{project.name}</TableCell>
              <TableCell>
                <Chip
                  label={PROJECT_STATE_LABELS[project.state]}
                  color={PROJECT_STATE_COLORS[project.state]}
                  variant={PROJECT_STATE_VARIANTS[project.state]}
                  size="small"
                />
              </TableCell>
              <TableCell>{new Date(project.eta).toLocaleDateString(undefined, { timeZone: "UTC" })}</TableCell>
              <TableCell align="right">
                <Stack direction="row" spacing={0.5} sx={{ justifyContent: "flex-end" }}>
                  <Tooltip title="Ver">
                    <IconButton size="small" component={RouterLink} to={`/projects/${project.id}`}>
                      <VisibilityOutlinedIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  {isAdmin && project.state !== "archived" && (
                    <>
                      <Tooltip title="Editar">
                        <IconButton size="small" onClick={() => onEdit(project)}>
                          <EditOutlinedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Archivar">
                        <IconButton size="small" onClick={() => onArchive(project)}>
                          <ArchiveOutlinedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </>
                  )}
                  {isAdmin && project.state === "archived" && (
                    <Tooltip title="Eliminar">
                      <IconButton size="small" color="error" onClick={() => onDelete(project)}>
                        <DeleteOutlineIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                </Stack>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}
