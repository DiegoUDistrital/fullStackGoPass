import { createContext, useCallback, useEffect, useMemo, useState } from "react"
import type { ReactNode } from "react"
import type { AuthUser } from "../services/auth.service"
import { fetchCurrentUser } from "../services/auth.service"

const TOKEN_STORAGE_KEY = "fullstack-gopass:token"

interface SessionState {
  token: string | null
  user: AuthUser | null
  isLoading: boolean
}

interface SessionContextValue {
  session: SessionState
  login: (token: string, user: AuthUser) => void
  logout: () => void
}

const initialState: SessionState = {
  token: null,
  user: null,
  isLoading: true
}

export const SessionContext = createContext<SessionContextValue>({
  session: initialState,
  login: () => undefined,
  logout: () => undefined
})

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<SessionState>(initialState)

  useEffect(() => {
    const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY)

    if (!storedToken) {
      setSession({ token: null, user: null, isLoading: false })
      return
    }

    let cancelled = false

    fetchCurrentUser(storedToken)
      .then((user) => {
        if (!cancelled) {
          setSession({ token: storedToken, user, isLoading: false })
        }
      })
      .catch(() => {
        localStorage.removeItem(TOKEN_STORAGE_KEY)
        if (!cancelled) {
          setSession({ token: null, user: null, isLoading: false })
        }
      })

    return () => {
      cancelled = true
    }
  }, [])

  const login = useCallback((token: string, user: AuthUser) => {
    localStorage.setItem(TOKEN_STORAGE_KEY, token)
    setSession({ token, user, isLoading: false })
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_STORAGE_KEY)
    setSession({ token: null, user: null, isLoading: false })
  }, [])

  const value = useMemo(() => ({ session, login, logout }), [session, login, logout])

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}
