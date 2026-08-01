import { httpGet } from "../api/httpClient"

export interface ProjectProgress {
  projectId: string
  projectName: string
  totalTasks: number
  finishedTasks: number
  progressPercentage: number
}

export interface TaskStateDistribution {
  open: number
  to_do: number
  in_process: number
  testing: number
  qa: number
  on_hold: number
  finished: number
}

export interface UserWorkload {
  userId: string
  userName: string
  pendingTaskCount: number
}

export interface DueTaskSummary {
  id: string
  title: string
  projectId: string
  projectName: string
  assignedUserName: string | null
  dueDate: string
}

export interface DashboardData {
  activeProjectsCount: number
  projectsProgress: ProjectProgress[]
  taskStateDistribution: TaskStateDistribution
  userWorkload: UserWorkload[]
  upcomingDueTasks: DueTaskSummary[]
  overdueTasks: DueTaskSummary[]
}

interface DashboardResponse {
  data: DashboardData
}

export async function getDashboard(token: string): Promise<DashboardData> {
  const response = await httpGet<DashboardResponse>("/api/dashboard", { token })
  return response.data
}
