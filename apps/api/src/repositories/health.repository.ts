export interface HealthRecord {
  status: "ok"
  timestamp: string
}

export class HealthRepository {
  public getStatus(): HealthRecord {
    return {
      status: "ok",
      timestamp: new Date().toISOString()
    }
  }
}
