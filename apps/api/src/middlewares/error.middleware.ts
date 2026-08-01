import { NextFunction, Request, Response } from "express"
import { logger } from "../config/logger"
import { HttpError } from "../types/http-error"

function isJsonBodyParseError(error: unknown): boolean {
  return (
    error instanceof SyntaxError &&
    "type" in error &&
    (error as SyntaxError & { type?: string }).type === "entity.parse.failed"
  )
}

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

  if (isJsonBodyParseError(error)) {
    response.status(400).json({
      error: {
        message: "El cuerpo de la solicitud no es un JSON válido"
      }
    })
    return
  }

  logger.error({ err: error }, "Unhandled error")
  response.status(500).json({
    error: {
      message: "Error interno del servidor"
    }
  })
}
