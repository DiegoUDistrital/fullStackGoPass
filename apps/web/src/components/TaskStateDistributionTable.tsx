import { Box, Paper, Table, TableBody, TableCell, TableContainer, TableRow } from "@mui/material"
import type { TaskStateDistribution } from "../services/dashboard.service"
import { TASK_STATE_COLORS, TASK_STATE_LABELS, TASK_STATE_ORDER } from "../theme/status"

interface TaskStateDistributionTableProps {
  distribution: TaskStateDistribution
}

function dotColor(color: (typeof TASK_STATE_COLORS)[keyof typeof TASK_STATE_COLORS]): string {
  return color === "default" ? "grey.500" : `${color}.main`
}

export function TaskStateDistributionTable({ distribution }: TaskStateDistributionTableProps) {
  return (
    <TableContainer component={Paper} variant="outlined">
      <Table size="small">
        <TableBody>
          {TASK_STATE_ORDER.map((state) => (
            <TableRow key={state}>
              <TableCell sx={{ display: "flex", alignItems: "center", gap: 1, border: "none" }}>
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    bgcolor: dotColor(TASK_STATE_COLORS[state])
                  }}
                />
                {TASK_STATE_LABELS[state]}
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 600 }}>
                {distribution[state]}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}
