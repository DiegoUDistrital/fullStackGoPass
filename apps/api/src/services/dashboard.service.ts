import { ProjectModel, TaskModel } from "../models"
import { ProjectRepository } from "../repositories/project.repository"
import { TaskRepository } from "../repositories/task.repository"

const UPCOMING_DUE_WINDOW_DAYS = 7

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
  dueDate: Date
}

export interface DashboardResponse {
  activeProjectsCount: number
  projectsProgress: ProjectProgress[]
  taskStateDistribution: TaskStateDistribution
  userWorkload: UserWorkload[]
  upcomingDueTasks: DueTaskSummary[]
  overdueTasks: DueTaskSummary[]
}

function toDueTaskSummary(task: TaskModel): DueTaskSummary {
  return {
    id: task.id,
    title: task.title,
    projectId: task.projectId,
    projectName: task.project?.name ?? "",
    assignedUserName: task.assignedUser?.name ?? null,
    dueDate: task.dueDate
  }
}

export class DashboardService {
  constructor(
    private readonly projectRepository: ProjectRepository,
    private readonly taskRepository: TaskRepository
  ) {}

  public async getDashboard(): Promise<DashboardResponse> {
    const [projects, tasks] = await Promise.all([this.projectRepository.listActive(), this.taskRepository.listAll()])

    const activeProjectsCount = projects.filter((project) => project.state === "active").length
    const projectsProgress = this.computeProjectsProgress(projects, tasks)
    const taskStateDistribution = this.computeTaskStateDistribution(tasks)
    const userWorkload = this.computeUserWorkload(tasks)

    const now = new Date()
    const windowEnd = new Date(now.getTime() + UPCOMING_DUE_WINDOW_DAYS * 24 * 60 * 60 * 1000)
    const pendingTasks = tasks.filter((task) => task.state !== "finished")

    const upcomingDueTasks = pendingTasks
      .filter((task) => task.dueDate.getTime() >= now.getTime() && task.dueDate.getTime() <= windowEnd.getTime())
      .map(toDueTaskSummary)
      .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())

    const overdueTasks = pendingTasks
      .filter((task) => task.dueDate.getTime() < now.getTime())
      .map(toDueTaskSummary)
      .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())

    return {
      activeProjectsCount,
      projectsProgress,
      taskStateDistribution,
      userWorkload,
      upcomingDueTasks,
      overdueTasks
    }
  }

  private computeProjectsProgress(projects: ProjectModel[], tasks: TaskModel[]): ProjectProgress[] {
    return projects.map((project) => {
      const projectTasks = tasks.filter((task) => task.projectId === project.id)
      const totalTasks = projectTasks.length
      const finishedTasks = projectTasks.filter((task) => task.state === "finished").length
      const progressPercentage = totalTasks === 0 ? 0 : Math.round((finishedTasks / totalTasks) * 100)

      return {
        projectId: project.id,
        projectName: project.name,
        totalTasks,
        finishedTasks,
        progressPercentage
      }
    })
  }

  private computeTaskStateDistribution(tasks: TaskModel[]): TaskStateDistribution {
    const distribution: TaskStateDistribution = {
      open: 0,
      to_do: 0,
      in_process: 0,
      testing: 0,
      qa: 0,
      on_hold: 0,
      finished: 0
    }

    for (const task of tasks) {
      distribution[task.state] += 1
    }

    return distribution
  }

  private computeUserWorkload(tasks: TaskModel[]): UserWorkload[] {
    const workloadByUser = new Map<string, UserWorkload>()

    for (const task of tasks) {
      if (task.state === "finished" || !task.assignedUserId || !task.assignedUser) {
        continue
      }

      const existing = workloadByUser.get(task.assignedUserId)

      if (existing) {
        existing.pendingTaskCount += 1
      } else {
        workloadByUser.set(task.assignedUserId, {
          userId: task.assignedUserId,
          userName: task.assignedUser.name,
          pendingTaskCount: 1
        })
      }
    }

    return [...workloadByUser.values()].sort((a, b) => b.pendingTaskCount - a.pendingTaskCount)
  }
}
