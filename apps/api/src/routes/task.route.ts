import { Router } from "express"
import { TaskController } from "../controllers/task.controller"
import { createAuthMiddleware, requireRole } from "../middlewares/auth.middleware"
import { validateCommentContentPayload } from "../middlewares/project.middleware"
import {
  validateAssignTaskPayload,
  validateChangeTaskStatePayload,
  validateCreateTaskPayload,
  validateOptionalCommentPayload,
  validateTaskLifecycleCommentPayload,
  validateUpdateTaskPayload
} from "../middlewares/task.middleware"
import { CommentRepository } from "../repositories/comment.repository"
import { ProjectRepository } from "../repositories/project.repository"
import { TaskRepository } from "../repositories/task.repository"
import { UserRepository } from "../repositories/user.repository"
import { AuthService } from "../services/auth.service"
import { TaskService } from "../services/task.service"

const taskRouter = Router()

const userRepository = new UserRepository()
const projectRepository = new ProjectRepository()
const taskRepository = new TaskRepository()
const commentRepository = new CommentRepository()

const authService = new AuthService(userRepository)
const taskService = new TaskService(taskRepository, projectRepository, commentRepository, userRepository)
const taskController = new TaskController(taskService)

const authMiddleware = createAuthMiddleware(authService)
const requireAdmin = requireRole("admin")

taskRouter.get("/projects/:projectId/tasks", authMiddleware, taskController.list)
taskRouter.post(
  "/projects/:projectId/tasks",
  authMiddleware,
  requireAdmin,
  validateCreateTaskPayload,
  taskController.create
)

taskRouter.get("/tasks/:id", authMiddleware, taskController.getById)
taskRouter.patch("/tasks/:id", authMiddleware, requireAdmin, validateUpdateTaskPayload, taskController.update)
taskRouter.patch(
  "/tasks/:id/assign",
  authMiddleware,
  requireAdmin,
  validateAssignTaskPayload,
  taskController.assign
)
taskRouter.patch(
  "/tasks/:id/unassign",
  authMiddleware,
  requireAdmin,
  validateOptionalCommentPayload,
  taskController.unassign
)
taskRouter.patch(
  "/tasks/:id/state",
  authMiddleware,
  validateChangeTaskStatePayload,
  taskController.changeState
)
taskRouter.delete(
  "/tasks/:id",
  authMiddleware,
  requireAdmin,
  validateTaskLifecycleCommentPayload,
  taskController.remove
)

taskRouter.get("/tasks/:id/comments", authMiddleware, taskController.listComments)
taskRouter.post(
  "/tasks/:id/comments",
  authMiddleware,
  validateCommentContentPayload,
  taskController.createComment
)

export { taskRouter }
