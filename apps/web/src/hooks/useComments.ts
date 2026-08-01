import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  createProjectComment,
  createTaskComment,
  listProjectComments,
  listTaskComments
} from "../services/comments.service"
import { useSession } from "./useSession"

function projectCommentsQueryKey(projectId: string) {
  return ["projects", projectId, "comments"]
}

function taskCommentsQueryKey(taskId: string) {
  return ["tasks", taskId, "comments"]
}

export function useProjectCommentsQuery(projectId: string) {
  const { session } = useSession()

  return useQuery({
    queryKey: projectCommentsQueryKey(projectId),
    queryFn: () => listProjectComments(session.token!, projectId),
    enabled: Boolean(session.token) && Boolean(projectId)
  })
}

export function useCreateProjectCommentMutation(projectId: string) {
  const { session } = useSession()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (content: string) => createProjectComment(session.token!, projectId, content),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: projectCommentsQueryKey(projectId) })
    }
  })
}

export function useTaskCommentsQuery(taskId: string) {
  const { session } = useSession()

  return useQuery({
    queryKey: taskCommentsQueryKey(taskId),
    queryFn: () => listTaskComments(session.token!, taskId),
    enabled: Boolean(session.token) && Boolean(taskId)
  })
}

export function useCreateTaskCommentMutation(taskId: string) {
  const { session } = useSession()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (content: string) => createTaskComment(session.token!, taskId, content),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: taskCommentsQueryKey(taskId) })
    }
  })
}
