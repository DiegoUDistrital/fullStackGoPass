import { httpDelete, httpGet, httpPatch, httpPost } from "../api/httpClient"

export type TaskPriority = "urgent" | "high" | "medium" | "low"
export type TaskState = "open" | "to_do" | "in_process" | "testing" | "qa" | "finished" | "on_hold"
export type TaskLifecycleState = "in_process" | "testing" | "qa" | "on_hold" | "finished"

export interface Task {
  id: string
  projectId: string
  assignedUserId: string | null
  assignedUserName: string | null
  title: string
  description: string
  priority: TaskPriority
  state: TaskState
  dueDate: string
  createdAt: string
  updatedAt: string
  archivedAt: string | null
}

export interface CreateTaskInput {
  title: string
  description: string
  priority: TaskPriority
  dueDate: string
}

export interface UpdateTaskInput {
  title?: string
  description?: string
  priority?: TaskPriority
  dueDate?: string
}

interface TaskListResponse {
  data: Task[]
}

interface TaskResponse {
  data: Task
}

export async function listTasksByProject(token: string, projectId: string): Promise<Task[]> {
  const response = await httpGet<TaskListResponse>(`/api/projects/${projectId}/tasks`, { token })
  return response.data
}

export async function getTask(token: string, id: string): Promise<Task> {
  const response = await httpGet<TaskResponse>(`/api/tasks/${id}`, { token })
  return response.data
}

export async function createTask(token: string, projectId: string, input: CreateTaskInput): Promise<Task> {
  const response = await httpPost<TaskResponse>(`/api/projects/${projectId}/tasks`, input, { token })
  return response.data
}

export async function updateTask(token: string, id: string, input: UpdateTaskInput): Promise<Task> {
  const response = await httpPatch<TaskResponse>(`/api/tasks/${id}`, input, { token })
  return response.data
}

export async function assignTask(token: string, id: string, assignedUserId: string): Promise<Task> {
  const response = await httpPatch<TaskResponse>(`/api/tasks/${id}/assign`, { assignedUserId }, { token })
  return response.data
}

export async function unassignTask(token: string, id: string): Promise<Task> {
  const response = await httpPatch<TaskResponse>(`/api/tasks/${id}/unassign`, {}, { token })
  return response.data
}

export async function changeTaskState(
  token: string,
  id: string,
  state: TaskLifecycleState,
  comment?: string
): Promise<Task> {
  const response = await httpPatch<TaskResponse>(`/api/tasks/${id}/state`, { state, comment }, { token })
  return response.data
}

export async function deleteTask(token: string, id: string, comment: string): Promise<Task> {
  const response = await httpDelete<TaskResponse>(`/api/tasks/${id}`, { comment }, { token })
  return response.data
}
