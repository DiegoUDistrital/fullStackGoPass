import { Avatar, Card, CardContent, Stack, Typography } from "@mui/material"
import { alpha } from "@mui/material/styles"
import type { SvgIconProps } from "@mui/material/SvgIcon"
import type { ComponentType } from "react"

interface StatTileProps {
  label: string
  value: number
  icon?: ComponentType<SvgIconProps>
  color?: "primary" | "warning" | "success" | "error" | "info"
}

export function StatTile({ label, value, icon: Icon, color = "primary" }: StatTileProps) {
  return (
    <Card variant="outlined" sx={{ minWidth: 220, flex: 1 }}>
      <CardContent>
        <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
          {Icon && (
            <Avatar
              sx={(theme) => ({
                bgcolor: alpha(theme.palette[color].main, 0.12),
                color: `${color}.main`,
                width: 44,
                height: 44
              })}
            >
              <Icon />
            </Avatar>
          )}
          <Stack spacing={0.25}>
            <Typography variant="body2" color="text.secondary">
              {label}
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              {value}
            </Typography>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  )
}
