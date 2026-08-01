import { Table, TableBody, TableCell, TableContainer, TableRow, Paper } from "@mui/material"
import type { TaskStateDistribution } from "../services/dashboard.service"

const STATE_LABELS: Record<keyof TaskStateDistribution, string> = {
  open: "Abierta",
  to_do: "Por hacer",
  in_process: "En proceso",
  testing: "Testing",
  qa: "QA",
  on_hold: "En espera",
  finished: "Finalizada"
}

const STATE_ORDER: Array<keyof TaskStateDistribution> = [
  "open",
  "to_do",
  "in_process",
  "testing",
  "qa",
  "on_hold",
  "finished"
]

interface TaskStateDistributionTableProps {
  distribution: TaskStateDistribution
}

export function TaskStateDistributionTable({ distribution }: TaskStateDistributionTableProps) {
  return (
    <TableContainer component={Paper} variant="outlined">
      <Table size="small">
        <TableBody>
          {STATE_ORDER.map((state) => (
            <TableRow key={state}>
              <TableCell>{STATE_LABELS[state]}</TableCell>
              <TableCell align="right">{distribution[state]}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}
