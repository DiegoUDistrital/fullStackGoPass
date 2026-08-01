import { createContext, useMemo, useState } from "react"
import type { ReactNode } from "react"

interface SessionState {
  token: string | null
}

interface SessionContextValue {
  session: SessionState
  setToken: (token: string | null) => void
}

const initialState: SessionState = {
  token: null
}

export const SessionContext = createContext<SessionContextValue>({
  session: initialState,
  setToken: () => undefined
})

export function SessionProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null)

  const value = useMemo(
    () => ({
      session: { token },
      setToken
    }),
    [token]
  )

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}
