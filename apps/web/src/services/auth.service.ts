import { httpGet, httpPost } from "../api/httpClient"

export interface AuthUser {
  id: string
  accessIdentifier: string
  name: string
  professionalProfile: string
  role: "admin" | "user"
  state: "active" | "inactive"
}

export interface LoginResult {
  token: string
  user: AuthUser
}

interface LoginResponse {
  data: LoginResult
}

interface MeResponse {
  data: {
    user: AuthUser
  }
}

export async function login(accessIdentifier: string, password: string): Promise<LoginResult> {
  const response = await httpPost<LoginResponse>("/api/auth/login", { accessIdentifier, password })
  return response.data
}

export async function fetchCurrentUser(token: string): Promise<AuthUser> {
  const response = await httpGet<MeResponse>("/api/auth/me", { token })
  return response.data.user
}
