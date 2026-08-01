import { Request, Response } from "express"
import { logger } from "../config/logger"
import { TaskLifecycleState, TaskPriority, TaskService } from "../services/task.service"

export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  public list = async (request: Request<{ projectId: string }>, response: Response): Promise<void> => {
    const tasks = await this.taskService.listByProject(request.params.projectId, request.authenticatedUser!)
    response.status(200).json({ data: tasks })
  }

  public getById = async (request: Request<{ id: string }>, response: Response): Promise<void> => {
    const task = await this.taskService.getById(request.params.id, request.authenticatedUser!)
    response.status(200).json({ data: task })
  }

  public create = async (request: Request<{ projectId: string }>, response: Response): Promise<void> => {
    const { title, description, priority, dueDate } = request.body as {
      title: string
      description: string
      priority: TaskPriority
      dueDate: string
    }

    const task = await this.taskService.createTask(request.params.projectId, {
      title,
      description,
      priority,
      dueDate: new Date(dueDate)
    })
    logger.info(
      { taskId: task.id, projectId: task.projectId, createdBy: request.authenticatedUser?.id },
      "Task created"
    )

    response.status(201).json({ data: task })
  }

  public update = async (request: Request<{ id: string }>, response: Response): Promise<void> => {
    const { title, description, priority, dueDate } = request.body as {
      title?: string
      description?: string
      priority?: TaskPriority
      dueDate?: string
    }

    const task = await this.taskService.updateTask(request.params.id, {
      title,
      description,
      priority,
      dueDate: dueDate !== undefined ? new Date(dueDate) : undefined
    })

    response.status(200).json({ data: task })
  }

  public assign = async (request: Request<{ id: string }>, response: Response): Promise<void> => {
    const { assignedUserId } = request.body as { assignedUserId: string }

    const task = await this.taskService.assignTask(request.params.id, assignedUserId)
    logger.info(
      { taskId: task.id, assignedUserId, assignedBy: request.authenticatedUser?.id },
      "Task assigned"
    )

    response.status(200).json({ data: task })
  }

  public unassign = async (request: Request<{ id: string }>, response: Response): Promise<void> => {
    const task = await this.taskService.unassignTask(request.params.id)
    logger.info({ taskId: task.id, unassignedBy: request.authenticatedUser?.id }, "Task unassigned")

    response.status(200).json({ data: task })
  }

  public changeState = async (request: Request<{ id: string }>, response: Response): Promise<void> => {
    const { state, comment } = request.body as { state: TaskLifecycleState; comment?: string }

    const task = await this.taskService.changeState(request.params.id, state, request.authenticatedUser!, comment)
    logger.info({ taskId: task.id, newState: state, changedBy: request.authenticatedUser?.id }, "Task state changed")

    response.status(200).json({ data: task })
  }

  public remove = async (request: Request<{ id: string }>, response: Response): Promise<void> => {
    const { comment } = request.body as { comment: string }

    const task = await this.taskService.deleteTask(request.params.id, comment, request.authenticatedUser!.id)
    logger.info({ taskId: task.id, deletedBy: request.authenticatedUser?.id }, "Task deleted")

    response.status(200).json({ data: task })
  }

  public listComments = async (request: Request<{ id: string }>, response: Response): Promise<void> => {
    const comments = await this.taskService.listComments(request.params.id, request.authenticatedUser!)
    response.status(200).json({ data: comments })
  }

  public createComment = async (request: Request<{ id: string }>, response: Response): Promise<void> => {
    const { content } = request.body as { content: string }

    const comment = await this.taskService.createComment(request.params.id, request.authenticatedUser!, content)
    response.status(201).json({ data: comment })
  }
}
