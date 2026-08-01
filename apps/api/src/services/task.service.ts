import crypto from "node:crypto"
import { TaskModel } from "../models"
import { CommentRepository } from "../repositories/comment.repository"
import { ProjectRepository } from "../repositories/project.repository"
import { TaskRepository } from "../repositories/task.repository"
import { UserRepository } from "../repositories/user.repository"
import { SafeUser } from "../types/auth"
import { HttpError } from "../types/http-error"

export type TaskPriority = "urgent" | "high" | "medium" | "low"
export type TaskLifecycleState = "in_process" | "testing" | "qa" | "on_hold" | "finished"
export type TaskState = "open" | "to_do" | TaskLifecycleState

export interface CreateTaskInput {
  title: string
  description: string
  priority: TaskPriority
  dueDate: Date
}

export interface UpdateTaskInput {
  title?: string
  description?: string
  priority?: TaskPriority
  dueDate?: Date
}

export interface TaskResponse {
  id: string
  projectId: string
  assignedUserId: string | null
  assignedUserName: string | null
  title: string
  description: string
  priority: TaskPriority
  state: TaskState
  dueDate: Date
  createdAt: Date
  updatedAt: Date
  archivedAt: Date | null
}

export interface TaskCommentResponse {
  id: string
  content: string
  authorUserId: string
  authorName: string | null
  createdAt: Date
}

function toTaskResponse(task: TaskModel): TaskResponse {
  return {
    id: task.id,
    projectId: task.projectId,
    assignedUserId: task.assignedUserId,
    assignedUserName: task.assignedUser?.name ?? null,
    title: task.title,
    description: task.description,
    priority: task.priority,
    state: task.state,
    dueDate: task.dueDate,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
    archivedAt: task.archivedAt
  }
}

export class TaskService {
  constructor(
    private readonly taskRepository: TaskRepository,
    private readonly projectRepository: ProjectRepository,
    private readonly commentRepository: CommentRepository,
    private readonly userRepository: UserRepository
  ) {}

  private async assertProjectVisible(projectId: string, actor: SafeUser): Promise<void> {
    if (actor.role === "admin") {
      return
    }

    const visibleProjectIds = await this.taskRepository.listProjectIdsByAssignedUser(actor.id)

    if (!visibleProjectIds.includes(projectId)) {
      throw new HttpError("Proyecto no encontrado", 404)
    }
  }

  private async assertTaskVisible(task: TaskModel, actor: SafeUser): Promise<void> {
    if (actor.role === "admin") {
      return
    }

    if (task.state === "open") {
      throw new HttpError("Tarea no encontrada", 404)
    }

    await this.assertProjectVisible(task.projectId, actor)
  }

  public async listByProject(projectId: string, actor: SafeUser): Promise<TaskResponse[]> {
    const project = await this.projectRepository.findById(projectId)

    if (!project) {
      throw new HttpError("Proyecto no encontrado", 404)
    }

    await this.assertProjectVisible(projectId, actor)

    const tasks = await this.taskRepository.listByProject(projectId)
    const visibleTasks = actor.role === "admin" ? tasks : tasks.filter((task) => task.state !== "open")

    return visibleTasks.map(toTaskResponse)
  }

  public async getById(id: string, actor: SafeUser): Promise<TaskResponse> {
    const task = await this.taskRepository.findById(id)

    if (!task) {
      throw new HttpError("Tarea no encontrada", 404)
    }

    await this.assertTaskVisible(task, actor)
    return toTaskResponse(task)
  }

  public async createTask(projectId: string, input: CreateTaskInput): Promise<TaskResponse> {
    const project = await this.projectRepository.findById(projectId)

    if (!project) {
      throw new HttpError("Proyecto no encontrado", 404)
    }

    const task = await this.taskRepository.create({
      id: crypto.randomUUID(),
      projectId,
      assignedUserId: null,
      title: input.title,
      description: input.description,
      priority: input.priority,
      state: "open",
      dueDate: input.dueDate
    })

    return toTaskResponse(await this.taskRepository.findById(task.id) as TaskModel)
  }

  public async updateTask(id: string, input: UpdateTaskInput): Promise<TaskResponse> {
    const existing = await this.taskRepository.findById(id)

    if (!existing) {
      throw new HttpError("Tarea no encontrada", 404)
    }

    const updated = await this.taskRepository.updateById(id, input)
    return toTaskResponse(updated!)
  }

  public async assignTask(id: string, assignedUserId: string): Promise<TaskResponse> {
    const existing = await this.taskRepository.findById(id)

    if (!existing) {
      throw new HttpError("Tarea no encontrada", 404)
    }

    const user = await this.userRepository.findById(assignedUserId)

    if (!user) {
      throw new HttpError("Usuario a asignar no encontrado", 404)
    }

    if (user.state !== "active") {
      throw new HttpError("No se puede asignar una tarea a un usuario inactivo", 409)
    }

    const updated = await this.taskRepository.updateById(id, { assignedUserId, state: "to_do" })
    return toTaskResponse(updated!)
  }

  public async unassignTask(id: string): Promise<TaskResponse> {
    const existing = await this.taskRepository.findById(id)

    if (!existing) {
      throw new HttpError("Tarea no encontrada", 404)
    }

    if (existing.assignedUserId === null) {
      throw new HttpError("La tarea no está asignada", 409)
    }

    const updated = await this.taskRepository.updateById(id, { assignedUserId: null, state: "open" })
    return toTaskResponse(updated!)
  }

  public async changeState(
    id: string,
    newState: TaskLifecycleState,
    actor: SafeUser,
    comment?: string
  ): Promise<TaskResponse> {
    const existing = await this.taskRepository.findById(id)

    if (!existing) {
      throw new HttpError("Tarea no encontrada", 404)
    }

    if (actor.role !== "admin" && existing.assignedUserId !== actor.id) {
      throw new HttpError("No autorizado", 403)
    }

    if (newState === existing.state) {
      throw new HttpError("La tarea ya se encuentra en ese estado", 409)
    }

    if (newState === "finished" && existing.state !== "testing" && existing.state !== "qa") {
      throw new HttpError("Solo puede finalizar desde testing o qa", 409)
    }

    const isReopening = existing.state === "finished" && newState !== "finished"

    if (isReopening) {
      if (!comment || !comment.trim()) {
        throw new HttpError("Reabrir una tarea requiere un comentario", 400)
      }

      await this.commentRepository.createForTask({
        id: crypto.randomUUID(),
        taskId: id,
        authorUserId: actor.id,
        content: comment
      })
    }

    const updated = await this.taskRepository.updateById(id, { state: newState })
    return toTaskResponse(updated!)
  }

  public async deleteTask(id: string, comment: string, actorId: string): Promise<TaskResponse> {
    const existing = await this.taskRepository.findById(id)

    if (!existing) {
      throw new HttpError("Tarea no encontrada", 404)
    }

    await this.commentRepository.createForTask({
      id: crypto.randomUUID(),
      taskId: id,
      authorUserId: actorId,
      content: comment
    })

    const deleted = await this.taskRepository.softDeleteById(id)
    return toTaskResponse(deleted!)
  }

  public async listComments(taskId: string, actor: SafeUser): Promise<TaskCommentResponse[]> {
    const task = await this.taskRepository.findById(taskId)

    if (!task) {
      throw new HttpError("Tarea no encontrada", 404)
    }

    await this.assertTaskVisible(task, actor)

    const comments = await this.commentRepository.listByTask(taskId)

    return comments.map((comment) => ({
      id: comment.id,
      content: comment.content,
      authorUserId: comment.authorUserId,
      authorName: comment.author?.name ?? null,
      createdAt: comment.createdAt
    }))
  }

  public async createComment(taskId: string, actor: SafeUser, content: string): Promise<TaskCommentResponse> {
    const task = await this.taskRepository.findById(taskId)

    if (!task) {
      throw new HttpError("Tarea no encontrada", 404)
    }

    await this.assertTaskVisible(task, actor)

    const comment = await this.commentRepository.createForTask({
      id: crypto.randomUUID(),
      taskId,
      authorUserId: actor.id,
      content
    })

    return {
      id: comment.id,
      content: comment.content,
      authorUserId: comment.authorUserId,
      authorName: actor.name,
      createdAt: comment.createdAt
    }
  }
}
