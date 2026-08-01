import { UserModel } from "../models"

export interface SafeUser {
  id: string
  accessIdentifier: string
  name: string
  professionalProfile: string
  role: "admin" | "user"
  state: "active" | "inactive"
}

export interface AuthTokenPayload {
  sub: string
  role: "admin" | "user"
}

export function toSafeUser(user: UserModel): SafeUser {
  return {
    id: user.id,
    accessIdentifier: user.accessIdentifier,
    name: user.name,
    professionalProfile: user.professionalProfile,
    role: user.role,
    state: user.state
  }
}

declare global {
  namespace Express {
    interface Request {
      authenticatedUser?: SafeUser
    }
  }
}
