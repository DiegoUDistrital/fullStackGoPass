import { Card, CardContent, Typography } from "@mui/material"

interface StatTileProps {
  label: string
  value: number
}

export function StatTile({ label, value }: StatTileProps) {
  return (
    <Card variant="outlined" sx={{ minWidth: 200, flex: 1 }}>
      <CardContent>
        <Typography variant="body2" color="text.secondary">
          {label}
        </Typography>
        <Typography variant="h3">{value}</Typography>
      </CardContent>
    </Card>
  )
}
