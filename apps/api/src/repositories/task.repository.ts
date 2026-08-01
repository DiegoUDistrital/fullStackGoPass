import { Op } from "sequelize"
import { TaskModel } from "../models"

export class TaskRepository {
  public create(data: {
    id: string
    projectId: string
    assignedUserId: string | null
    title: string
    description: string
    priority: "urgent" | "high" | "medium" | "low"
    state: "open" | "to_do" | "in_process" | "testing" | "qa" | "finished" | "on_hold"
    dueDate: Date
  }) {
    return TaskModel.create(data)
  }

  public findById(id: string) {
    return TaskModel.findByPk(id)
  }

  public listByProject(projectId: string) {
    return TaskModel.findAll({
      where: {
        projectId,
        deletedAt: {
          [Op.is]: null
        }
      }
    })
  }

  public async listProjectIdsByAssignedUser(assignedUserId: string): Promise<string[]> {
    const tasks = await TaskModel.findAll({
      where: { assignedUserId },
      attributes: ["projectId"],
      group: ["projectId"]
    })

    return tasks.map((task) => task.projectId)
  }

  public async updateById(
    id: string,
    data: Partial<{
      assignedUserId: string | null
      title: string
      description: string
      priority: "urgent" | "high" | "medium" | "low"
      state: "open" | "to_do" | "in_process" | "testing" | "qa" | "finished" | "on_hold"
      dueDate: Date
      archivedAt: Date | null
    }>
  ) {
    await TaskModel.update(data, { where: { id } })
    return this.findById(id)
  }

  public async softDeleteById(id: string) {
    const task = await this.findById(id)
    if (!task) {
      return null
    }

    await task.destroy()
    return task
  }
}
