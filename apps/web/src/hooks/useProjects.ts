import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  archiveProject,
  createProject,
  deleteProject,
  getProject,
  listProjects,
  updateProject
} from "../services/projects.service"
import type { CreateProjectInput, UpdateProjectInput } from "../services/projects.service"
import { useSession } from "./useSession"

const PROJECTS_QUERY_KEY = ["projects"]

export function useProjectsQuery() {
  const { session } = useSession()

  return useQuery({
    queryKey: PROJECTS_QUERY_KEY,
    queryFn: () => listProjects(session.token!),
    enabled: Boolean(session.token)
  })
}

export function useProjectQuery(id: string) {
  const { session } = useSession()

  return useQuery({
    queryKey: [...PROJECTS_QUERY_KEY, id],
    queryFn: () => getProject(session.token!, id),
    enabled: Boolean(session.token) && Boolean(id)
  })
}

export function useCreateProjectMutation() {
  const { session } = useSession()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateProjectInput) => createProject(session.token!, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: PROJECTS_QUERY_KEY })
    }
  })
}

export function useUpdateProjectMutation() {
  const { session } = useSession()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateProjectInput }) =>
      updateProject(session.token!, id, input),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: PROJECTS_QUERY_KEY })
      void queryClient.invalidateQueries({ queryKey: [...PROJECTS_QUERY_KEY, variables.id] })
    }
  })
}

export function useArchiveProjectMutation() {
  const { session } = useSession()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, comment }: { id: string; comment: string }) => archiveProject(session.token!, id, comment),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: PROJECTS_QUERY_KEY })
      void queryClient.invalidateQueries({ queryKey: [...PROJECTS_QUERY_KEY, variables.id] })
    }
  })
}

export function useDeleteProjectMutation() {
  const { session } = useSession()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, comment }: { id: string; comment: string }) => deleteProject(session.token!, id, comment),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: PROJECTS_QUERY_KEY })
    }
  })
}
