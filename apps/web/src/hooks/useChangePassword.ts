import { useMutation } from "@tanstack/react-query"
import { changeOwnPassword } from "../services/users.service"
import type { ChangePasswordInput } from "../services/users.service"
import { useSession } from "./useSession"

export function useChangePasswordMutation() {
  const { session } = useSession()

  return useMutation({
    mutationFn: (input: ChangePasswordInput) => changeOwnPassword(session.token!, input)
  })
}
