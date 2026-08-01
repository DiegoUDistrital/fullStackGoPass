import { Router } from "express"
import { AuthController } from "../controllers/auth.controller"
import { createAuthMiddleware, validateLoginPayload } from "../middlewares/auth.middleware"
import { UserRepository } from "../repositories/user.repository"
import { AuthService } from "../services/auth.service"

const authRouter = Router()

const userRepository = new UserRepository()
const authService = new AuthService(userRepository)
const authController = new AuthController(authService)
const authMiddleware = createAuthMiddleware(authService)

authRouter.post("/auth/login", validateLoginPayload, authController.login)
authRouter.get("/auth/me", authMiddleware, authController.me)

export { authRouter }
