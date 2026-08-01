import { Op } from "sequelize"
import { ProjectModel } from "../models"

export class ProjectRepository {
  public create(data: {
    id: string
    name: string
    description: string
    responsibleAdminId: string
    eta: Date
    state: "planned" | "active" | "on_hold" | "completed" | "archived"
    progressCalculated?: number
  }) {
    return ProjectModel.create(data)
  }

  public findById(id: string) {
    return ProjectModel.findByPk(id)
  }

  public listActive() {
    return ProjectModel.findAll({
      where: {
        deletedAt: {
          [Op.is]: null
        }
      }
    })
  }

  public async updateById(
    id: string,
    data: Partial<{
      name: string
      description: string
      eta: Date
      state: "planned" | "active" | "on_hold" | "completed" | "archived"
      progressCalculated: number
      archivedAt: Date | null
    }>
  ) {
    await ProjectModel.update(data, { where: { id } })
    return this.findById(id)
  }

  public async softDeleteById(id: string) {
    const project = await this.findById(id)
    if (!project) {
      return null
    }

    await project.destroy()
    return project
  }
}
