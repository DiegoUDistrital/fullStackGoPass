import { httpGet, httpPost } from "../api/httpClient"

export interface Comment {
  id: string
  content: string
  authorUserId: string
  authorName: string | null
  createdAt: string
}

interface CommentListResponse {
  data: Comment[]
}

interface CommentResponse {
  data: Comment
}

export async function listProjectComments(token: string, projectId: string): Promise<Comment[]> {
  const response = await httpGet<CommentListResponse>(`/api/projects/${projectId}/comments`, { token })
  return response.data
}

export async function createProjectComment(token: string, projectId: string, content: string): Promise<Comment> {
  const response = await httpPost<CommentResponse>(`/api/projects/${projectId}/comments`, { content }, { token })
  return response.data
}
