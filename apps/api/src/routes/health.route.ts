import { Router } from "express"
import { HealthController } from "../controllers/health.controller"
import { HealthRepository } from "../repositories/health.repository"
import { HealthService } from "../services/health.service"

const healthRouter = Router()

const healthRepository = new HealthRepository()
const healthService = new HealthService(healthRepository)
const healthController = new HealthController(healthService)

healthRouter.get("/health", healthController.getStatus)

export { healthRouter }
