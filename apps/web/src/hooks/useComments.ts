import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createProjectComment, listProjectComments } from "../services/comments.service"
import { useSession } from "./useSession"

function projectCommentsQueryKey(projectId: string) {
  return ["projects", projectId, "comments"]
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
