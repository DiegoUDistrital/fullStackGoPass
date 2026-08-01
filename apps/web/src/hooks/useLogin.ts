import { useMutation } from "@tanstack/react-query"
import { login as loginRequest } from "../services/auth.service"
import { useSession } from "./useSession"

export interface LoginCredentials {
  accessIdentifier: string
  password: string
}

export function useLogin() {
  const { login } = useSession()

  return useMutation({
    mutationFn: ({ accessIdentifier, password }: LoginCredentials) => loginRequest(accessIdentifier, password),
    onSuccess: (result) => {
      login(result.token, result.user)
    }
  })
}
