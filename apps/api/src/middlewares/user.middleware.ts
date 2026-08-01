import { NextFunction, Request, Response } from "express"
import { HttpError } from "../types/http-error"

function isValidRole(role: unknown): role is "admin" | "user" {
  return role === "admin" || role === "user"
}

export function validateCreateUserPayload(request: Request, _response: Response, next: NextFunction): void {
  const { accessIdentifier, name, professionalProfile, password, role } = request.body ?? {}

  if (
    typeof accessIdentifier !== "string" ||
    typeof name !== "string" ||
    typeof professionalProfile !== "string" ||
    typeof password !== "string" ||
    !accessIdentifier ||
    !name ||
    !professionalProfile ||
    !password
  ) {
    next(new HttpError("accessIdentifier, name, professionalProfile y password son requeridos", 400))
    return
  }

  if (role !== undefined && !isValidRole(role)) {
    next(new HttpError("role debe ser 'admin' o 'user'", 400))
    return
  }

  next()
}

export function validateUpdateUserPayload(request: Request, _response: Response, next: NextFunction): void {
  const { name, professionalProfile, role } = request.body ?? {}

  if (name === undefined && professionalProfile === undefined && role === undefined) {
    next(new HttpError("Debe enviar al menos un campo para actualizar", 400))
    return
  }

  if (name !== undefined && (typeof name !== "string" || !name)) {
    next(new HttpError("name debe ser un texto no vacío", 400))
    return
  }

  if (professionalProfile !== undefined && (typeof professionalProfile !== "string" || !professionalProfile)) {
    next(new HttpError("professionalProfile debe ser un texto no vacío", 400))
    return
  }

  if (role !== undefined && !isValidRole(role)) {
    next(new HttpError("role debe ser 'admin' o 'user'", 400))
    return
  }

  next()
}

export function validateChangePasswordPayload(request: Request, _response: Response, next: NextFunction): void {
  const { currentPassword, newPassword } = request.body ?? {}

  if (typeof currentPassword !== "string" || typeof newPassword !== "string" || !currentPassword || !newPassword) {
    next(new HttpError("currentPassword y newPassword son requeridos", 400))
    return
  }

  next()
}
