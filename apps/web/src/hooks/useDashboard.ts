import { useQuery } from "@tanstack/react-query"
import { getDashboard } from "../services/dashboard.service"
import { useSession } from "./useSession"

export function useDashboardQuery() {
  const { session } = useSession()

  return useQuery({
    queryKey: ["dashboard"],
    queryFn: () => getDashboard(session.token!),
    enabled: Boolean(session.token)
  })
}
