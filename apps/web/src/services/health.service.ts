import { httpGet } from "../api/httpClient"

interface HealthResponse {
  data: {
    status: string
    timestamp: string
  }
}

export interface HealthStatus {
  status: string
  timestamp: string
}

export async function getHealthStatus(): Promise<HealthStatus> {
  const response = await httpGet<HealthResponse>("/api/health")
  return response.data
}
