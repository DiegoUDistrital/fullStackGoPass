import crypto from "node:crypto"
import { CommentRepository } from "../repositories/comment.repository"
import { ProjectRepository } from "../repositories/project.repository"
import { TaskRepository } from "../repositories/task.repository"
import { ProjectModel } from "../models"
import { SafeUser } from "../types/auth"
import { HttpError } from "../types/http-error"

export type ProjectLifecycleState = "planned" | "active" | "on_hold" | "completed"

export interface CreateProjectInput {
  name: string
  description: string
  eta: Date
  state?: ProjectLifecycleState
}

export interface UpdateProjectInput {
  name?: string
  description?: string
  eta?: Date
  state?: ProjectLifecycleState
}

export interface ProjectResponse {
  id: string
  name: string
  description: string
  responsibleAdminId: string
  eta: Date
  state: "planned" | "active" | "on_hold" | "completed" | "archived"
  progressCalculated: number
  createdAt: Date
  updatedAt: Date
  archivedAt: Date | null
}

export interface ProjectCommentResponse {
  id: string
  content: string
  authorUserId: string
  authorName: string | null
  createdAt: Date
}

function toProjectResponse(project: ProjectModel): ProjectResponse {
  return {
    id: project.id,
    name: project.name,
    description: project.description,
    responsibleAdminId: project.responsibleAdminId,
    eta: project.eta,
    state: project.state,
    progressCalculated: Number(project.progressCalculated),
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
    archivedAt: project.archivedAt
  }
}

export class ProjectService {
  constructor(
    private readonly projectRepository: ProjectRepository,
    private readonly taskRepository: TaskRepository,
    private readonly commentRepository: CommentRepository
  ) {}

  private async assertVisibleToActor(project: ProjectModel, actor: SafeUser): Promise<void> {
    if (actor.role === "admin") {
      return
    }

    const visibleProjectIds = await this.taskRepository.listProjectIdsByAssignedUser(actor.id)

    if (!visibleProjectIds.includes(project.id)) {
      throw new HttpError("Proyecto no encontrado", 404)
    }
  }

  public async listProjects(actor: SafeUser): Promise<ProjectResponse[]> {
    const projects = await this.projectRepository.listActive()

    if (actor.role === "admin") {
      return projects.map(toProjectResponse)
    }

    const visibleProjectIds = new Set(await this.taskRepository.listProjectIdsByAssignedUser(actor.id))
    return projects.filter((project) => visibleProjectIds.has(project.id)).map(toProjectResponse)
  }

  public async getProjectById(id: string, actor: SafeUser): Promise<ProjectResponse> {
    const project = await this.projectRepository.findById(id)

    if (!project) {
      throw new HttpError("Proyecto no encontrado", 404)
    }

    await this.assertVisibleToActor(project, actor)
    return toProjectResponse(project)
  }

  public async createProject(input: CreateProjectInput, responsibleAdminId: string): Promise<ProjectResponse> {
    const project = await this.projectRepository.create({
      id: crypto.randomUUID(),
      name: input.name,
      description: input.description,
      responsibleAdminId,
      eta: input.eta,
      state: input.state ?? "planned"
    })

    return toProjectResponse(project)
  }

  public async updateProject(id: string, input: UpdateProjectInput): Promise<ProjectResponse> {
    const existing = await this.projectRepository.findById(id)

    if (!existing) {
      throw new HttpError("Proyecto no encontrado", 404)
    }

    if (existing.state === "archived") {
      throw new HttpError("El proyecto está archivado y no puede editarse", 409)
    }

    const updated = await this.projectRepository.updateById(id, input)
    return toProjectResponse(updated!)
  }

  public async archiveProject(id: string, comment: string, actorId: string): Promise<ProjectResponse> {
    const existing = await this.projectRepository.findById(id)

    if (!existing) {
      throw new HttpError("Proyecto no encontrado", 404)
    }

    if (existing.state === "archived") {
      throw new HttpError("El proyecto ya está archivado", 409)
    }

    await this.commentRepository.createForProject({
      id: crypto.randomUUID(),
      projectId: id,
      authorUserId: actorId,
      content: comment
    })

    const updated = await this.projectRepository.updateById(id, { state: "archived", archivedAt: new Date() })
    return toProjectResponse(updated!)
  }

  public async deleteProject(id: string, comment: string, actorId: string): Promise<ProjectResponse> {
    const existing = await this.projectRepository.findById(id)

    if (!existing) {
      throw new HttpError("Proyecto no encontrado", 404)
    }

    if (existing.state !== "archived") {
      throw new HttpError("Solo se pueden eliminar proyectos archivados", 409)
    }

    await this.commentRepository.createForProject({
      id: crypto.randomUUID(),
      projectId: id,
      authorUserId: actorId,
      content: comment
    })

    const deleted = await this.projectRepository.softDeleteById(id)
    return toProjectResponse(deleted!)
  }

  public async listComments(projectId: string, actor: SafeUser): Promise<ProjectCommentResponse[]> {
    const project = await this.projectRepository.findById(projectId)

    if (!project) {
      throw new HttpError("Proyecto no encontrado", 404)
    }

    await this.assertVisibleToActor(project, actor)

    const comments = await this.commentRepository.listByProject(projectId)

    return comments.map((comment) => ({
      id: comment.id,
      content: comment.content,
      authorUserId: comment.authorUserId,
      authorName: comment.author?.name ?? null,
      createdAt: comment.createdAt
    }))
  }

  public async createComment(projectId: string, actor: SafeUser, content: string): Promise<ProjectCommentResponse> {
    const project = await this.projectRepository.findById(projectId)

    if (!project) {
      throw new HttpError("Proyecto no encontrado", 404)
    }

    await this.assertVisibleToActor(project, actor)

    const comment = await this.commentRepository.createForProject({
      id: crypto.randomUUID(),
      projectId,
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
