import { Request, Response } from "express"
import { DashboardService } from "../services/dashboard.service"

export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  public get = async (_request: Request, response: Response): Promise<void> => {
    const dashboard = await this.dashboardService.getDashboard()
    response.status(200).json({ data: dashboard })
  }
}
