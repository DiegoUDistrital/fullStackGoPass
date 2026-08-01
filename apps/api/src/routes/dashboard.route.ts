import { Router } from "express"
import { DashboardController } from "../controllers/dashboard.controller"
import { createAuthMiddleware, requireRole } from "../middlewares/auth.middleware"
import { ProjectRepository } from "../repositories/project.repository"
import { TaskRepository } from "../repositories/task.repository"
import { UserRepository } from "../repositories/user.repository"
import { AuthService } from "../services/auth.service"
import { DashboardService } from "../services/dashboard.service"

const dashboardRouter = Router()

const userRepository = new UserRepository()
const projectRepository = new ProjectRepository()
const taskRepository = new TaskRepository()

const authService = new AuthService(userRepository)
const dashboardService = new DashboardService(projectRepository, taskRepository)
const dashboardController = new DashboardController(dashboardService)

const authMiddleware = createAuthMiddleware(authService)
const requireAdmin = requireRole("admin")

dashboardRouter.get("/dashboard", authMiddleware, requireAdmin, dashboardController.get)

export { dashboardRouter }
