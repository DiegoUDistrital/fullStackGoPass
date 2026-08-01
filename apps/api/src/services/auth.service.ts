import jwt from "jsonwebtoken"
import { env } from "../config/env"
import { UserRepository } from "../repositories/user.repository"
import { HttpError } from "../types/http-error"
import { AuthTokenPayload, SafeUser, toSafeUser } from "../types/auth"
import { verifyPassword } from "../utils/password"

export interface LoginResult {
  token: string
  user: SafeUser
}

export class AuthService {
  constructor(private readonly userRepository: UserRepository) {}

  public async login(accessIdentifier: string, password: string): Promise<LoginResult> {
    const user = await this.userRepository.findByAccessIdentifier(accessIdentifier)

    if (!user || !verifyPassword(password, user.passwordHash)) {
      throw new HttpError("Credenciales inválidas", 401)
    }

    if (user.state !== "active") {
      throw new HttpError("Usuario inactivo", 403)
    }

    const payload: AuthTokenPayload = { sub: user.id, role: user.role }
    const token = jwt.sign(payload, env.jwtSecret, { expiresIn: env.jwtExpiresIn } as jwt.SignOptions)

    return { token, user: toSafeUser(user) }
  }

  public async getActiveUserById(userId: string): Promise<SafeUser> {
    const user = await this.userRepository.findById(userId)

    if (!user) {
      throw new HttpError("Usuario no encontrado", 401)
    }

    if (user.state !== "active") {
      throw new HttpError("Usuario inactivo", 403)
    }

    return toSafeUser(user)
  }
}
