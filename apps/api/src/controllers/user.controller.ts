import { Request, Response } from "express"
import { logger } from "../config/logger"
import { UserService } from "../services/user.service"

export class UserController {
  constructor(private readonly userService: UserService) {}

  public list = async (_request: Request, response: Response): Promise<void> => {
    const users = await this.userService.listUsers()
    response.status(200).json({ data: users })
  }

  public getById = async (request: Request<{ id: string }>, response: Response): Promise<void> => {
    const user = await this.userService.getUserById(request.params.id)
    response.status(200).json({ data: user })
  }

  public create = async (request: Request, response: Response): Promise<void> => {
    const { accessIdentifier, name, professionalProfile, password, role } = request.body as {
      accessIdentifier: string
      name: string
      professionalProfile: string
      password: string
      role?: "admin" | "user"
    }

    const user = await this.userService.createUser({ accessIdentifier, name, professionalProfile, password, role })
    logger.info({ userId: user.id, role: user.role, createdBy: request.authenticatedUser?.id }, "User created")

    response.status(201).json({ data: user })
  }

  public update = async (request: Request<{ id: string }>, response: Response): Promise<void> => {
    const { name, professionalProfile, role } = request.body as {
      name?: string
      professionalProfile?: string
      role?: "admin" | "user"
    }
    const actorId = request.authenticatedUser!.id

    const user = await this.userService.updateUser(request.params.id, { name, professionalProfile, role }, actorId)
    response.status(200).json({ data: user })
  }

  public activate = async (request: Request<{ id: string }>, response: Response): Promise<void> => {
    const user = await this.userService.setUserState(request.params.id, "active")
    logger.info({ userId: user.id, changedBy: request.authenticatedUser?.id }, "User activated")

    response.status(200).json({ data: user })
  }

  public deactivate = async (request: Request<{ id: string }>, response: Response): Promise<void> => {
    const user = await this.userService.setUserState(request.params.id, "inactive")
    logger.info({ userId: user.id, changedBy: request.authenticatedUser?.id }, "User deactivated")

    response.status(200).json({ data: user })
  }

  public changeOwnPassword = async (request: Request, response: Response): Promise<void> => {
    const { currentPassword, newPassword } = request.body as { currentPassword: string; newPassword: string }
    const userId = request.authenticatedUser!.id

    const user = await this.userService.changeOwnPassword(userId, currentPassword, newPassword)
    logger.info({ userId: user.id }, "User changed own password")

    response.status(200).json({ data: user })
  }
}
