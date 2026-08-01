import crypto from "node:crypto"
import { UserRepository } from "../repositories/user.repository"
import { SafeUser, toSafeUser } from "../types/auth"
import { HttpError } from "../types/http-error"
import { hashPassword, verifyPassword } from "../utils/password"

export interface CreateUserInput {
  accessIdentifier: string
  name: string
  professionalProfile: string
  password: string
  role?: "admin" | "user"
}

export interface UpdateUserInput {
  name?: string
  professionalProfile?: string
  role?: "admin" | "user"
}

export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  public async listUsers(): Promise<SafeUser[]> {
    const users = await this.userRepository.list()
    return users.map(toSafeUser)
  }

  public async getUserById(id: string): Promise<SafeUser> {
    const user = await this.userRepository.findById(id)

    if (!user) {
      throw new HttpError("Usuario no encontrado", 404)
    }

    return toSafeUser(user)
  }

  public async createUser(input: CreateUserInput): Promise<SafeUser> {
    const existing = await this.userRepository.findByAccessIdentifier(input.accessIdentifier)

    if (existing) {
      throw new HttpError("El identificador de acceso ya está en uso", 409)
    }

    const user = await this.userRepository.create({
      id: crypto.randomUUID(),
      accessIdentifier: input.accessIdentifier,
      name: input.name,
      professionalProfile: input.professionalProfile,
      passwordHash: hashPassword(input.password),
      role: input.role ?? "user",
      state: "active"
    })

    return toSafeUser(user)
  }

  public async updateUser(id: string, input: UpdateUserInput, actorId: string): Promise<SafeUser> {
    const existing = await this.userRepository.findById(id)

    if (!existing) {
      throw new HttpError("Usuario no encontrado", 404)
    }

    if (input.role !== undefined && input.role !== existing.role) {
      if (id === actorId) {
        throw new HttpError("No puede cambiar su propio rol", 403)
      }

      if (existing.role === "admin" && input.role === "user" && existing.state === "active") {
        const activeAdmins = await this.userRepository.countActiveAdmins()

        if (activeAdmins <= 1) {
          throw new HttpError("No se puede degradar al último administrador activo", 409)
        }
      }
    }

    const updated = await this.userRepository.updateById(id, input)
    return toSafeUser(updated!)
  }

  public async setUserState(id: string, state: "active" | "inactive"): Promise<SafeUser> {
    const existing = await this.userRepository.findById(id)

    if (!existing) {
      throw new HttpError("Usuario no encontrado", 404)
    }

    if (state === "inactive" && existing.role === "admin" && existing.state === "active") {
      const activeAdmins = await this.userRepository.countActiveAdmins()

      if (activeAdmins <= 1) {
        throw new HttpError("No se puede desactivar al último administrador activo", 409)
      }
    }

    const updated = await this.userRepository.updateById(id, { state })
    return toSafeUser(updated!)
  }

  public async changeOwnPassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<SafeUser> {
    const user = await this.userRepository.findById(userId)

    if (!user) {
      throw new HttpError("Usuario no encontrado", 404)
    }

    if (!verifyPassword(currentPassword, user.passwordHash)) {
      throw new HttpError("La contraseña actual no es correcta", 401)
    }

    const updated = await this.userRepository.updateById(userId, { passwordHash: hashPassword(newPassword) })
    return toSafeUser(updated!)
  }
}
