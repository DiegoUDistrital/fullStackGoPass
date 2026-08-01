import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  createUser,
  listUsers,
  setUserState,
  updateUser
} from "../services/users.service"
import type { CreateUserInput, UpdateUserInput } from "../services/users.service"
import { useSession } from "./useSession"

const USERS_QUERY_KEY = ["users"]

export function useUsersQuery() {
  const { session } = useSession()

  return useQuery({
    queryKey: USERS_QUERY_KEY,
    queryFn: () => listUsers(session.token!),
    enabled: Boolean(session.token)
  })
}

export function useCreateUserMutation() {
  const { session } = useSession()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateUserInput) => createUser(session.token!, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY })
    }
  })
}

export function useUpdateUserMutation() {
  const { session } = useSession()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateUserInput }) =>
      updateUser(session.token!, id, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY })
    }
  })
}

export function useSetUserStateMutation() {
  const { session } = useSession()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, state }: { id: string; state: "active" | "inactive" }) =>
      setUserState(session.token!, id, state),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY })
    }
  })
}
