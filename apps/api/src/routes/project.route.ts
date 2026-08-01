import { Router } from "express"
import { ProjectController } from "../controllers/project.controller"
import { createAuthMiddleware, requireRole } from "../middlewares/auth.middleware"
import {
  validateCommentContentPayload,
  validateCreateProjectPayload,
  validateProjectLifecycleCommentPayload,
  validateUpdateProjectPayload
} from "../middlewares/project.middleware"
import { CommentRepository } from "../repositories/comment.repository"
import { ProjectRepository } from "../repositories/project.repository"
import { TaskRepository } from "../repositories/task.repository"
import { UserRepository } from "../repositories/user.repository"
import { AuthService } from "../services/auth.service"
import { ProjectService } from "../services/project.service"

const projectRouter = Router()

const userRepository = new UserRepository()
const projectRepository = new ProjectRepository()
const taskRepository = new TaskRepository()
const commentRepository = new CommentRepository()

const authService = new AuthService(userRepository)
const projectService = new ProjectService(projectRepository, taskRepository, commentRepository)
const projectController = new ProjectController(projectService)

const authMiddleware = createAuthMiddleware(authService)
const requireAdmin = requireRole("admin")

projectRouter.get("/projects", authMiddleware, projectController.list)
projectRouter.post("/projects", authMiddleware, requireAdmin, validateCreateProjectPayload, projectController.create)
projectRouter.get("/projects/:id", authMiddleware, projectController.getById)
projectRouter.patch(
  "/projects/:id",
  authMiddleware,
  requireAdmin,
  validateUpdateProjectPayload,
  projectController.update
)
projectRouter.patch(
  "/projects/:id/archive",
  authMiddleware,
  requireAdmin,
  validateProjectLifecycleCommentPayload,
  projectController.archive
)
projectRouter.delete(
  "/projects/:id",
  authMiddleware,
  requireAdmin,
  validateProjectLifecycleCommentPayload,
  projectController.remove
)

projectRouter.get("/projects/:id/comments", authMiddleware, projectController.listComments)
projectRouter.post(
  "/projects/:id/comments",
  authMiddleware,
  validateCommentContentPayload,
  projectController.createComment
)

export { projectRouter }
