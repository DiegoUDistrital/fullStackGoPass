import { NextFunction, Request, Response } from "express"
import { HttpError } from "../types/http-error"

const ALLOWED_PROJECT_STATES = ["planned", "active", "on_hold", "completed"] as const
type AllowedProjectState = (typeof ALLOWED_PROJECT_STATES)[number]

function isValidProjectState(state: unknown): state is AllowedProjectState {
  return typeof state === "string" && (ALLOWED_PROJECT_STATES as readonly string[]).includes(state)
}

function isValidDateString(value: unknown): value is string {
  return typeof value === "string" && value !== "" && !Number.isNaN(Date.parse(value))
}

export function validateCreateProjectPayload(request: Request, _response: Response, next: NextFunction): void {
  const { name, description, eta, state } = request.body ?? {}

  if (
    typeof name !== "string" ||
    !name ||
    typeof description !== "string" ||
    !description ||
    !isValidDateString(eta)
  ) {
    next(new HttpError("name, description y eta son requeridos (eta debe ser una fecha válida)", 400))
    return
  }

  if (state !== undefined && !isValidProjectState(state)) {
    next(new HttpError("state debe ser uno de: planned, active, on_hold, completed", 400))
    return
  }

  next()
}

export function validateUpdateProjectPayload(request: Request, _response: Response, next: NextFunction): void {
  const { name, description, eta, state } = request.body ?? {}

  if (name === undefined && description === undefined && eta === undefined && state === undefined) {
    next(new HttpError("Debe enviar al menos un campo para actualizar", 400))
    return
  }

  if (name !== undefined && (typeof name !== "string" || !name)) {
    next(new HttpError("name debe ser un texto no vacío", 400))
    return
  }

  if (description !== undefined && (typeof description !== "string" || !description)) {
    next(new HttpError("description debe ser un texto no vacío", 400))
    return
  }

  if (eta !== undefined && !isValidDateString(eta)) {
    next(new HttpError("eta debe ser una fecha válida", 400))
    return
  }

  if (state !== undefined && !isValidProjectState(state)) {
    next(new HttpError("state debe ser uno de: planned, active, on_hold, completed", 400))
    return
  }

  next()
}

export function validateProjectLifecycleCommentPayload(
  request: Request,
  _response: Response,
  next: NextFunction
): void {
  const { comment } = request.body ?? {}

  if (typeof comment !== "string" || !comment.trim()) {
    next(new HttpError("comment es requerido", 400))
    return
  }

  next()
}

export function validateCommentContentPayload(request: Request, _response: Response, next: NextFunction): void {
  const { content } = request.body ?? {}

  if (typeof content !== "string" || !content.trim()) {
    next(new HttpError("content es requerido", 400))
    return
  }

  next()
}
