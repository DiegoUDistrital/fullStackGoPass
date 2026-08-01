import { Router } from "express"
import { UserController } from "../controllers/user.controller"
import { createAuthMiddleware, requireRole } from "../middlewares/auth.middleware"
import {
  validateChangePasswordPayload,
  validateCreateUserPayload,
  validateUpdateUserPayload
} from "../middlewares/user.middleware"
import { UserRepository } from "../repositories/user.repository"
import { AuthService } from "../services/auth.service"
import { UserService } from "../services/user.service"

const userRouter = Router()

const userRepository = new UserRepository()
const authService = new AuthService(userRepository)
const userService = new UserService(userRepository)
const userController = new UserController(userService)
const authMiddleware = createAuthMiddleware(authService)
const requireAdmin = requireRole("admin")

userRouter.patch("/users/me/password", authMiddleware, validateChangePasswordPayload, userController.changeOwnPassword)

userRouter.get("/users", authMiddleware, requireAdmin, userController.list)
userRouter.post("/users", authMiddleware, requireAdmin, validateCreateUserPayload, userController.create)
userRouter.get("/users/:id", authMiddleware, requireAdmin, userController.getById)
userRouter.patch("/users/:id", authMiddleware, requireAdmin, validateUpdateUserPayload, userController.update)
userRouter.patch("/users/:id/activate", authMiddleware, requireAdmin, userController.activate)
userRouter.patch("/users/:id/deactivate", authMiddleware, requireAdmin, userController.deactivate)

export { userRouter }
