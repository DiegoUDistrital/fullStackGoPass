import {
  CreationOptional,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
  Sequelize
} from "sequelize"

export class ProjectModel extends Model<
  InferAttributes<ProjectModel>,
  InferCreationAttributes<ProjectModel>
> {
  declare id: string
  declare name: string
  declare description: string
  declare responsibleAdminId: string
  declare eta: Date
  declare state: "planned" | "active" | "on_hold" | "completed" | "archived"
  declare progressCalculated: CreationOptional<number>
  declare createdAt: CreationOptional<Date>
  declare updatedAt: CreationOptional<Date>
  declare archivedAt: Date | null
  declare deletedAt: Date | null
}

export function initProjectModel(sequelize: Sequelize): typeof ProjectModel {
  ProjectModel.init(
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true
      },
      name: {
        type: DataTypes.STRING(160),
        allowNull: false
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: false
      },
      responsibleAdminId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: "responsible_admin_id"
      },
      eta: {
        type: DataTypes.DATE,
        allowNull: false
      },
      state: {
        type: DataTypes.ENUM("planned", "active", "on_hold", "completed", "archived"),
        allowNull: false
      },
      progressCalculated: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 0,
        field: "progress_calculated"
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
      tableName: "projects",
      timestamps: true,
      paranoid: true
    }
  )

  return ProjectModel
}
