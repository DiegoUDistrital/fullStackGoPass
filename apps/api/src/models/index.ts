import { sequelize } from "../database/sequelize"
import { CommentModel, initCommentModel } from "./comment.model"
import { ProjectModel, initProjectModel } from "./project.model"
import { TaskModel, initTaskModel } from "./task.model"
import { UserModel, initUserModel } from "./user.model"

initUserModel(sequelize)
initProjectModel(sequelize)
initTaskModel(sequelize)
initCommentModel(sequelize)

UserModel.hasMany(ProjectModel, { foreignKey: "responsibleAdminId", as: "managedProjects" })
ProjectModel.belongsTo(UserModel, { foreignKey: "responsibleAdminId", as: "responsibleAdmin" })

ProjectModel.hasMany(TaskModel, { foreignKey: "projectId", as: "tasks" })
TaskModel.belongsTo(ProjectModel, { foreignKey: "projectId", as: "project" })

UserModel.hasMany(TaskModel, { foreignKey: "assignedUserId", as: "assignedTasks" })
TaskModel.belongsTo(UserModel, { foreignKey: "assignedUserId", as: "assignedUser" })

ProjectModel.hasMany(CommentModel, { foreignKey: "projectId", as: "comments" })
TaskModel.hasMany(CommentModel, { foreignKey: "taskId", as: "comments" })
UserModel.hasMany(CommentModel, { foreignKey: "authorUserId", as: "comments" })

CommentModel.belongsTo(ProjectModel, { foreignKey: "projectId", as: "project" })
CommentModel.belongsTo(TaskModel, { foreignKey: "taskId", as: "task" })
CommentModel.belongsTo(UserModel, { foreignKey: "authorUserId", as: "author" })

export { UserModel, ProjectModel, TaskModel, CommentModel }
