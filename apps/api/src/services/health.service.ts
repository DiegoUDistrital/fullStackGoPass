import { HealthRecord, HealthRepository } from "../repositories/health.repository"

export class HealthService {
  constructor(private readonly healthRepository: HealthRepository) {}

  public getStatus(): HealthRecord {
    return this.healthRepository.getStatus()
  }
}
