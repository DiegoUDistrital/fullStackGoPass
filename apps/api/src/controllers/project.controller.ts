import { Request, Response } from "express"
import { logger } from "../config/logger"
import { ProjectLifecycleState, ProjectService } from "../services/project.service"

export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  public list = async (request: Request, response: Response): Promise<void> => {
    const projects = await this.projectService.listProjects(request.authenticatedUser!)
    response.status(200).json({ data: projects })
  }

  public getById = async (request: Request<{ id: string }>, response: Response): Promise<void> => {
    const project = await this.projectService.getProjectById(request.params.id, request.authenticatedUser!)
    response.status(200).json({ data: project })
  }

  public create = async (request: Request, response: Response): Promise<void> => {
    const { name, description, eta, state } = request.body as {
      name: string
      description: string
      eta: string
      state?: ProjectLifecycleState
    }

    const project = await this.projectService.createProject(
      { name, description, eta: new Date(eta), state },
      request.authenticatedUser!.id
    )
    logger.info({ projectId: project.id, createdBy: request.authenticatedUser?.id }, "Project created")

    response.status(201).json({ data: project })
  }

  public update = async (request: Request<{ id: string }>, response: Response): Promise<void> => {
    const { name, description, eta, state } = request.body as {
      name?: string
      description?: string
      eta?: string
      state?: ProjectLifecycleState
    }

    const project = await this.projectService.updateProject(request.params.id, {
      name,
      description,
      eta: eta !== undefined ? new Date(eta) : undefined,
      state
    })

    response.status(200).json({ data: project })
  }

  public archive = async (request: Request<{ id: string }>, response: Response): Promise<void> => {
    const { comment } = request.body as { comment: string }

    const project = await this.projectService.archiveProject(
      request.params.id,
      comment,
      request.authenticatedUser!.id
    )
    logger.info({ projectId: project.id, archivedBy: request.authenticatedUser?.id }, "Project archived")

    response.status(200).json({ data: project })
  }

  public remove = async (request: Request<{ id: string }>, response: Response): Promise<void> => {
    const { comment } = request.body as { comment: string }

    const project = await this.projectService.deleteProject(
      request.params.id,
      comment,
      request.authenticatedUser!.id
    )
    logger.info({ projectId: project.id, deletedBy: request.authenticatedUser?.id }, "Project deleted")

    response.status(200).json({ data: project })
  }

  public listComments = async (request: Request<{ id: string }>, response: Response): Promise<void> => {
    const comments = await this.projectService.listComments(request.params.id, request.authenticatedUser!)
    response.status(200).json({ data: comments })
  }

  public createComment = async (request: Request<{ id: string }>, response: Response): Promise<void> => {
    const { content } = request.body as { content: string }

    const comment = await this.projectService.createComment(
      request.params.id,
      request.authenticatedUser!,
      content
    )

    response.status(201).json({ data: comment })
  }
}
