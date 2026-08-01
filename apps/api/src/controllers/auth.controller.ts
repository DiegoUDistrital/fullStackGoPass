import { Request, Response } from "express"
import { logger } from "../config/logger"
import { AuthService } from "../services/auth.service"

export class AuthController {
  constructor(private readonly authService: AuthService) {}

  public login = async (request: Request, response: Response): Promise<void> => {
    const { accessIdentifier, password } = request.body as { accessIdentifier: string; password: string }

    const result = await this.authService.login(accessIdentifier, password)
    logger.info({ userId: result.user.id }, "User logged in")

    response.status(200).json({ data: result })
  }

  public me = (request: Request, response: Response): void => {
    response.status(200).json({ data: { user: request.authenticatedUser } })
  }
}
