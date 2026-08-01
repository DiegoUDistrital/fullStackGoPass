import { CommentModel, UserModel } from "../models"

export class CommentRepository {
  public createForProject(data: {
    id: string
    projectId: string
    authorUserId: string
    content: string
  }) {
    return CommentModel.create({
      id: data.id,
      projectId: data.projectId,
      taskId: null,
      authorUserId: data.authorUserId,
      content: data.content
    })
  }

  public createForTask(data: {
    id: string
    taskId: string
    authorUserId: string
    content: string
  }) {
    return CommentModel.create({
      id: data.id,
      projectId: null,
      taskId: data.taskId,
      authorUserId: data.authorUserId,
      content: data.content
    })
  }

  public listByProject(projectId: string) {
    return CommentModel.findAll({
      where: {
        projectId
      },
      include: [{ model: UserModel, as: "author", attributes: ["id", "name"] }],
      order: [["createdAt", "ASC"]]
    })
  }

  public listByTask(taskId: string) {
    return CommentModel.findAll({
      where: {
        taskId
      }
    })
  }
}
