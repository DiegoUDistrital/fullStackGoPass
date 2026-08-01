import {
  CreationOptional,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
  NonAttribute,
  Sequelize
} from "sequelize"

export class CommentModel extends Model<InferAttributes<CommentModel>, InferCreationAttributes<CommentModel>> {
  declare id: string
  declare projectId: string | null
  declare taskId: string | null
  declare authorUserId: string
  declare content: string
  declare createdAt: CreationOptional<Date>
  declare updatedAt: CreationOptional<Date>
  declare archivedAt: Date | null
  declare deletedAt: Date | null
  declare author?: NonAttribute<{ id: string; name: string }>
}

export function initCommentModel(sequelize: Sequelize): typeof CommentModel {
  CommentModel.init(
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true
      },
      projectId: {
        type: DataTypes.UUID,
        allowNull: true,
        field: "project_id"
      },
      taskId: {
        type: DataTypes.UUID,
        allowNull: true,
        field: "task_id"
      },
      authorUserId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: "author_user_id"
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: false
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        field: "created_at"
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        field: "updated_at"
      },
      archivedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: "archived_at"
      },
      deletedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: "deleted_at"
      }
    },
    {
      sequelize,
      tableName: "comments",
      timestamps: true,
      paranoid: true
    }
  )

  return CommentModel
}
