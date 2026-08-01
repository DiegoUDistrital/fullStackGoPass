import { Request, Response } from "express"

export function notFoundMiddleware(_request: Request, response: Response): void {
  response.status(404).json({
    error: {
      message: "Resource not found"
    }
  })
}
