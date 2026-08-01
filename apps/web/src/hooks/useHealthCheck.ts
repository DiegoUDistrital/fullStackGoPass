import { useQuery } from "@tanstack/react-query"
import { getHealthStatus } from "../services/health.service"

export function useHealthCheck() {
  return useQuery({
    queryKey: ["health"],
    queryFn: getHealthStatus
  })
}
