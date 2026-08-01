import { NextFunction, Request, Response } from "express"
import { HttpError } from "../types/http-error"

const ALLOWED_PRIORITIES = ["urgent", "high", "medium", "low"] as const
type AllowedPriority = (typeof ALLOWED_PRIORITIES)[number]

const ALLOWED_TARGET_STATES = ["in_process", "testing", "qa", "on_hold", "finished"] as const
type AllowedTargetState = (typeof ALLOWED_TARGET_STATES)[number]

function isValidPriority(value: unknown): value is AllowedPriority {
  return typeof value === "string" && (ALLOWED_PRIORITIES as readonly string[]).includes(value)
}

function isValidTargetState(value: unknown): value is AllowedTargetState {
  return typeof value === "string" && (ALLOWED_TARGET_STATES as readonly string[]).includes(value)
}

function isValidDateString(value: unknown): value is string {
  return typeof value === "string" && value !== "" && !Number.isNaN(Date.parse(value))
}

export function validateCreateTaskPayload(request: Request, _response: Response, next: NextFunction): void {
  const { title, description, priority, dueDate } = request.body ?? {}

  if (
    typeof title !== "string" ||
    !title ||
    typeof description !== "string" ||
    !description ||
    !isValidPriority(priority) ||
    !isValidDateString(dueDate)
  ) {
    next(
      new HttpError(
        "title, description, priority (urgent|high|medium|low) y dueDate (fecha válida) son requeridos",
        400
      )
    )
    return
  }

  next()
}

export function validateUpdateTaskPayload(request: Request, _response: Response, next: NextFunction): void {
  const { title, description, priority, dueDate } = request.body ?? {}

  if (title === undefined && description === undefined && priority === undefined && dueDate === undefined) {
    next(new HttpError("Debe enviar al menos un campo para actualizar", 400))
    return
  }

  if (title !== undefined && (typeof title !== "string" || !title)) {
    next(new HttpError("title debe ser un texto no vacío", 400))
    return
  }

  if (description !== undefined && (typeof description !== "string" || !description)) {
    next(new HttpError("description debe ser un texto no vacío", 400))
    return
  }

  if (priority !== undefined && !isValidPriority(priority)) {
    next(new HttpError("priority debe ser uno de: urgent, high, medium, low", 400))
    return
  }

  if (dueDate !== undefined && !isValidDateString(dueDate)) {
    next(new HttpError("dueDate debe ser una fecha válida", 400))
    return
  }

  next()
}

export function validateAssignTaskPayload(request: Request, _response: Response, next: NextFunction): void {
  const { assignedUserId } = request.body ?? {}

  if (typeof assignedUserId !== "string" || !assignedUserId) {
    next(new HttpError("assignedUserId es requerido", 400))
    return
  }

  next()
}

export function validateChangeTaskStatePayload(request: Request, _response: Response, next: NextFunction): void {
  const { state, comment } = request.body ?? {}

  if (!isValidTargetState(state)) {
    next(new HttpError("state debe ser uno de: in_process, testing, qa, on_hold, finished", 400))
    return
  }

  if (comment !== undefined && typeof comment !== "string") {
    next(new HttpError("comment debe ser un texto", 400))
    return
  }

  next()
}

export function validateTaskLifecycleCommentPayload(
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
