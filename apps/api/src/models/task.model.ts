import {
  CreationOptional,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
  NonAttribute,
  Sequelize
} from "sequelize"

export class TaskModel extends Model<InferAttributes<TaskModel>, InferCreationAttributes<TaskModel>> {
  declare id: string
  declare projectId: string
  declare assignedUserId: string | null
  declare title: string
  declare description: string
  declare priority: "urgent" | "high" | "medium" | "low"
  declare state: "open" | "to_do" | "in_process" | "testing" | "qa" | "finished" | "on_hold"
  declare dueDate: Date
  declare createdAt: CreationOptional<Date>
  declare updatedAt: CreationOptional<Date>
  declare archivedAt: Date | null
  declare deletedAt: Date | null
  declare assignedUser?: NonAttribute<{ id: string; name: string } | null>
  declare project?: NonAttribute<{ id: string; name: string }>
}

export function initTaskModel(sequelize: Sequelize): typeof TaskModel {
  TaskModel.init(
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true
      },
      projectId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: "project_id"
      },
      assignedUserId: {
        type: DataTypes.UUID,
        allowNull: true,
        field: "assigned_user_id"
      },
      title: {
        type: DataTypes.STRING(180),
        allowNull: false
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: false
      },
      priority: {
        type: DataTypes.ENUM("urgent", "high", "medium", "low"),
        allowNull: false
      },
      state: {
        type: DataTypes.ENUM("open", "to_do", "in_process", "testing", "qa", "finished", "on_hold"),
        allowNull: false
      },
      dueDate: {
        type: DataTypes.DATE,
        allowNull: false,
        field: "due_date"
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
      tableName: "tasks",
      timestamps: true,
      paranoid: true
    }
  )

  return TaskModel
}
