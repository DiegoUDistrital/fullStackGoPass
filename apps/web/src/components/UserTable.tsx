import {
  Button,
  Chip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from "@mui/material"
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
              <TableCell>{user.name}</TableCell>
              <TableCell>{user.professionalProfile}</TableCell>
              <TableCell>{user.role}</TableCell>
              <TableCell>
                <Chip
                  label={user.state === "active" ? "Activo" : "Inactivo"}
                  color={user.state === "active" ? "success" : "default"}
                  size="small"
                />
              </TableCell>
              <TableCell align="right">
                <Button size="small" onClick={() => onEdit(user)}>
                  Editar
                </Button>
                <Button size="small" onClick={() => onToggleState(user)}>
                  {user.state === "active" ? "Desactivar" : "Activar"}
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}
