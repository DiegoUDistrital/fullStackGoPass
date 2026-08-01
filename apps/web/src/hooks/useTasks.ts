import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  assignTask,
  changeTaskState,
  createTask,
  deleteTask,
  getTask,
  listTasksByProject,
  unassignTask,
  updateTask
} from "../services/tasks.service"
import type { CreateTaskInput, TaskLifecycleState, UpdateTaskInput } from "../services/tasks.service"
import { useSession } from "./useSession"

function projectTasksQueryKey(projectId: string) {
  return ["projects", projectId, "tasks"]
}

function taskQueryKey(id: string) {
  return ["tasks", id]
}

export function useTasksByProjectQuery(projectId: string) {
  const { session } = useSession()

  return useQuery({
    queryKey: projectTasksQueryKey(projectId),
    queryFn: () => listTasksByProject(session.token!, projectId),
    enabled: Boolean(session.token) && Boolean(projectId)
  })
}

export function useTaskQuery(id: string) {
  const { session } = useSession()

  return useQuery({
    queryKey: taskQueryKey(id),
    queryFn: () => getTask(session.token!, id),
    enabled: Boolean(session.token) && Boolean(id)
  })
}

function useInvalidateTask(projectId?: string, taskId?: string) {
  const queryClient = useQueryClient()

  return () => {
    if (projectId) {
      void queryClient.invalidateQueries({ queryKey: projectTasksQueryKey(projectId) })
    }
    if (taskId) {
      void queryClient.invalidateQueries({ queryKey: taskQueryKey(taskId) })
    }
  }
}

export function useCreateTaskMutation(projectId: string) {
  const { session } = useSession()
  const invalidate = useInvalidateTask(projectId)

  return useMutation({
    mutationFn: (input: CreateTaskInput) => createTask(session.token!, projectId, input),
    onSuccess: invalidate
  })
}

export function useUpdateTaskMutation(projectId: string, taskId: string) {
  const { session } = useSession()
  const invalidate = useInvalidateTask(projectId, taskId)

  return useMutation({
    mutationFn: (input: UpdateTaskInput) => updateTask(session.token!, taskId, input),
    onSuccess: invalidate
  })
}

export function useAssignTaskMutation(projectId: string, taskId: string) {
  const { session } = useSession()
  const invalidate = useInvalidateTask(projectId, taskId)

  return useMutation({
    mutationFn: (assignedUserId: string) => assignTask(session.token!, taskId, assignedUserId),
    onSuccess: invalidate
  })
}

export function useUnassignTaskMutation(projectId: string, taskId: string) {
  const { session } = useSession()
  const invalidate = useInvalidateTask(projectId, taskId)

  return useMutation({
    mutationFn: () => unassignTask(session.token!, taskId),
    onSuccess: invalidate
  })
}

export function useChangeTaskStateMutation(projectId: string, taskId: string) {
  const { session } = useSession()
  const invalidate = useInvalidateTask(projectId, taskId)

  return useMutation({
    mutationFn: ({ state, comment }: { state: TaskLifecycleState; comment?: string }) =>
      changeTaskState(session.token!, taskId, state, comment),
    onSuccess: invalidate
  })
}

export function useDeleteTaskMutation(projectId: string, taskId: string) {
  const { session } = useSession()
  const invalidate = useInvalidateTask(projectId, taskId)

  return useMutation({
    mutationFn: (comment: string) => deleteTask(session.token!, taskId, comment),
    onSuccess: invalidate
  })
}
