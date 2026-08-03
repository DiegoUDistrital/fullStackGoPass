import type { ChipProps } from "@mui/material"
import type { SvgIconProps } from "@mui/material/SvgIcon"
import type { ComponentType } from "react"
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown"
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp"
import KeyboardDoubleArrowUpIcon from "@mui/icons-material/KeyboardDoubleArrowUp"
import RemoveIcon from "@mui/icons-material/Remove"
import type { ProjectState } from "../services/projects.service"
import type { TaskPriority, TaskState } from "../services/tasks.service"

type ChipColor = NonNullable<ChipProps["color"]>
type ChipVariant = NonNullable<ChipProps["variant"]>
type IconComponent = ComponentType<SvgIconProps>

export const PROJECT_STATE_LABELS: Record<ProjectState, string> = {
  planned: "Planeado",
  active: "Activo",
  on_hold: "En espera",
  completed: "Completado",
  archived: "Archivado"
}

export const PROJECT_STATE_COLORS: Record<ProjectState, ChipColor> = {
  planned: "info",
  active: "primary",
  on_hold: "warning",
  completed: "success",
  archived: "default"
}

export const PROJECT_STATE_VARIANTS: Record<ProjectState, ChipVariant> = {
  planned: "filled",
  active: "filled",
  on_hold: "filled",
  completed: "filled",
  archived: "outlined"
}

export const TASK_STATE_ORDER: TaskState[] = ["open", "to_do", "in_process", "testing", "qa", "on_hold", "finished"]

export const TASK_STATE_LABELS: Record<TaskState, string> = {
  open: "Abierta",
  to_do: "Por hacer",
  in_process: "En proceso",
  testing: "Testing",
  qa: "QA",
  on_hold: "En espera",
  finished: "Finalizada"
}

export const TASK_STATE_COLORS: Record<TaskState, ChipColor> = {
  open: "default",
  to_do: "info",
  in_process: "primary",
  testing: "secondary",
  qa: "warning",
  on_hold: "warning",
  finished: "success"
}

export const TASK_STATE_VARIANTS: Record<TaskState, ChipVariant> = {
  open: "filled",
  to_do: "filled",
  in_process: "filled",
  testing: "filled",
  qa: "filled",
  on_hold: "outlined",
  finished: "filled"
}

export const TASK_PRIORITY_LABELS: Record<TaskPriority, string> = {
  urgent: "Urgente",
  high: "Alta",
  medium: "Media",
  low: "Baja"
}

export const TASK_PRIORITY_COLORS: Record<TaskPriority, ChipColor> = {
  urgent: "error",
  high: "warning",
  medium: "info",
  low: "default"
}

export const TASK_PRIORITY_ICONS: Record<TaskPriority, IconComponent> = {
  urgent: KeyboardDoubleArrowUpIcon,
  high: KeyboardArrowUpIcon,
  medium: RemoveIcon,
  low: KeyboardArrowDownIcon
}
