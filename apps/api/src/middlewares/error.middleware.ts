import { NextFunction, Request, Response } from "express"
import { logger } from "../config/logger"
import { HttpError } from "../types/http-error"

export function errorMiddleware(
  error: unknown,
  _request: Request,
  response: Response,
  _next: NextFunction
): void {
  if (error instanceof HttpError) {
    response.status(error.statusCode).json({
      error: {
        message: error.message
      }
    })
    return
  }

  logger.error({ err: error }, "Unhandled error")
  response.status(500).json({
    error: {
      message: "Internal server error"
    }
  })
}
