import { Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from "@mui/material"
import type { UserWorkload } from "../services/dashboard.service"

interface UserWorkloadTableProps {
  workload: UserWorkload[]
}

export function UserWorkloadTable({ workload }: UserWorkloadTableProps) {
  if (workload.length === 0) {
    return <Typography color="text.secondary">Sin tareas pendientes asignadas.</Typography>
  }

  return (
    <TableContainer component={Paper} variant="outlined">
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Usuario</TableCell>
            <TableCell align="right">Tareas pendientes</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {workload.map((entry) => (
            <TableRow key={entry.userId}>
              <TableCell>{entry.userName}</TableCell>
              <TableCell align="right">{entry.pendingTaskCount}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}
