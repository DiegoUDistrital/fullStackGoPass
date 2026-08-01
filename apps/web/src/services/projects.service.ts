import { httpDelete, httpGet, httpPatch, httpPost } from "../api/httpClient"

export type ProjectState = "planned" | "active" | "on_hold" | "completed" | "archived"
export type ProjectLifecycleState = "planned" | "active" | "on_hold" | "completed"

export interface Project {
  id: string
  name: string
  description: string
  responsibleAdminId: string
  eta: string
  state: ProjectState
  progressCalculated: number
  createdAt: string
  updatedAt: string
  archivedAt: string | null
}

export interface CreateProjectInput {
  name: string
  description: string
  eta: string
  state?: ProjectLifecycleState
}

export interface UpdateProjectInput {
  name?: string
  description?: string
  eta?: string
  state?: ProjectLifecycleState
}

interface ProjectListResponse {
  data: Project[]
}

interface ProjectResponse {
  data: Project
}

export async function listProjects(token: string): Promise<Project[]> {
  const response = await httpGet<ProjectListResponse>("/api/projects", { token })
  return response.data
}

export async function getProject(token: string, id: string): Promise<Project> {
  const response = await httpGet<ProjectResponse>(`/api/projects/${id}`, { token })
  return response.data
}

export async function createProject(token: string, input: CreateProjectInput): Promise<Project> {
  const response = await httpPost<ProjectResponse>("/api/projects", input, { token })
  return response.data
}

export async function updateProject(token: string, id: string, input: UpdateProjectInput): Promise<Project> {
  const response = await httpPatch<ProjectResponse>(`/api/projects/${id}`, input, { token })
  return response.data
}

export async function archiveProject(token: string, id: string, comment: string): Promise<Project> {
  const response = await httpPatch<ProjectResponse>(`/api/projects/${id}/archive`, { comment }, { token })
  return response.data
}

export async function deleteProject(token: string, id: string, comment: string): Promise<Project> {
  const response = await httpDelete<ProjectResponse>(`/api/projects/${id}`, { comment }, { token })
  return response.data
}
