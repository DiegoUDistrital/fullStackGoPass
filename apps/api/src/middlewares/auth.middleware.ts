import { NextFunction, Request, Response } from "express"
import jwt from "jsonwebtoken"
import { env } from "../config/env"
import { AuthService } from "../services/auth.service"
import { AuthTokenPayload } from "../types/auth"
import { HttpError } from "../types/http-error"

export function validateLoginPayload(request: Request, _response: Response, next: NextFunction): void {
  const { accessIdentifier, password } = request.body ?? {}

  if (typeof accessIdentifier !== "string" || typeof password !== "string" || !accessIdentifier || !password) {
    next(new HttpError("accessIdentifier y password son requeridos", 400))
    return
  }

  next()
}

export function createAuthMiddleware(authService: AuthService) {
  return async function authMiddleware(request: Request, _response: Response, next: NextFunction): Promise<void> {
    const authorizationHeader = request.headers.authorization

    if (!authorizationHeader || !authorizationHeader.startsWith("Bearer ")) {
      next(new HttpError("Token no proporcionado", 401))
      return
    }

    const token = authorizationHeader.slice("Bearer ".length)

    try {
      const payload = jwt.verify(token, env.jwtSecret) as AuthTokenPayload
      request.authenticatedUser = await authService.getActiveUserById(payload.sub)
      next()
    } catch (error) {
      if (error instanceof HttpError) {
        next(error)
        return
      }

      next(new HttpError("Token inválido o expirado", 401))
    }
  }
}
