import { CssBaseline, ThemeProvider } from "@mui/material"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { SessionProvider } from "./contexts/SessionContext"
import { AppRouter } from "./router/AppRouter"
import { theme } from "./theme/theme"

const queryClient = new QueryClient()

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <QueryClientProvider client={queryClient}>
        <SessionProvider>
          <AppRouter />
        </SessionProvider>
      </QueryClientProvider>
    </ThemeProvider>
  )
}

export default App
