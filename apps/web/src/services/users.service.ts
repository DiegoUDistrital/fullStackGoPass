import { httpGet, httpPatch, httpPost } from "../api/httpClient"
import type { AuthUser } from "./auth.service"

export interface CreateUserInput {
  accessIdentifier: string
  name: string
  professionalProfile: string
  password: string
  role: "admin" | "user"
}

export interface UpdateUserInput {
  name?: string
  professionalProfile?: string
  role?: "admin" | "user"
}

export interface ChangePasswordInput {
  currentPassword: string
  newPassword: string
}

interface UserListResponse {
  data: AuthUser[]
}

interface UserResponse {
  data: AuthUser
}

export async function listUsers(token: string): Promise<AuthUser[]> {
  const response = await httpGet<UserListResponse>("/api/users", { token })
  return response.data
}

export async function createUser(token: string, input: CreateUserInput): Promise<AuthUser> {
  const response = await httpPost<UserResponse>("/api/users", input, { token })
  return response.data
}

export async function updateUser(token: string, id: string, input: UpdateUserInput): Promise<AuthUser> {
  const response = await httpPatch<UserResponse>(`/api/users/${id}`, input, { token })
  return response.data
}

export async function setUserState(
  token: string,
  id: string,
  state: "active" | "inactive"
): Promise<AuthUser> {
  const action = state === "active" ? "activate" : "deactivate"
  const response = await httpPatch<UserResponse>(`/api/users/${id}/${action}`, {}, { token })
  return response.data
}

export async function changeOwnPassword(token: string, input: ChangePasswordInput): Promise<AuthUser> {
  const response = await httpPatch<UserResponse>("/api/users/me/password", input, { token })
  return response.data
}
