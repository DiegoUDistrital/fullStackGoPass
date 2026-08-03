import {
  Chip,
  IconButton,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip
} from "@mui/material"
import BlockOutlinedIcon from "@mui/icons-material/BlockOutlined"
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutlined"
import EditOutlinedIcon from "@mui/icons-material/EditOutlined"
import type { AuthUser } from "../services/auth.service"

interface UserTableProps {
  users: AuthUser[]
  onEdit: (user: AuthUser) => void
  onToggleState: (user: AuthUser) => void
}

export function UserTable({ users, onEdit, onToggleState }: UserTableProps) {
  return (
    <TableContainer component={Paper} variant="outlined">
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Identificador</TableCell>
            <TableCell>Nombre</TableCell>
            <TableCell>Perfil</TableCell>
            <TableCell>Rol</TableCell>
            <TableCell>Estado</TableCell>
            <TableCell align="right">Acciones</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell>{user.accessIdentifier}</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>{user.name}</TableCell>
              <TableCell>{user.professionalProfile}</TableCell>
              <TableCell>
                <Chip
                  label={user.role === "admin" ? "Administrador" : "Usuario"}
                  color={user.role === "admin" ? "primary" : "default"}
                  variant="outlined"
                  size="small"
                />
              </TableCell>
              <TableCell>
                <Chip
                  label={user.state === "active" ? "Activo" : "Inactivo"}
                  color={user.state === "active" ? "success" : "default"}
                  size="small"
                />
              </TableCell>
              <TableCell align="right">
                <Stack direction="row" spacing={0.5} sx={{ justifyContent: "flex-end" }}>
                  <Tooltip title="Editar">
                    <IconButton size="small" onClick={() => onEdit(user)}>
                      <EditOutlinedIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title={user.state === "active" ? "Desactivar" : "Activar"}>
                    <IconButton size="small" onClick={() => onToggleState(user)}>
                      {user.state === "active" ? (
                        <BlockOutlinedIcon fontSize="small" />
                      ) : (
                        <CheckCircleOutlineIcon fontSize="small" />
                      )}
                    </IconButton>
                  </Tooltip>
                </Stack>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}
