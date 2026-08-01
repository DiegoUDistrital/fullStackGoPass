import {
  CreationOptional,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
  Sequelize
} from "sequelize"

export class UserModel extends Model<InferAttributes<UserModel>, InferCreationAttributes<UserModel>> {
  declare id: string
  declare accessIdentifier: string
  declare name: string
  declare professionalProfile: string
  declare passwordHash: string
  declare role: "admin" | "user"
  declare state: "active" | "inactive"
  declare createdAt: CreationOptional<Date>
  declare updatedAt: CreationOptional<Date>
  declare archivedAt: Date | null
  declare deletedAt: Date | null
}

export function initUserModel(sequelize: Sequelize): typeof UserModel {
  UserModel.init(
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true
      },
      accessIdentifier: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
        field: "access_identifier"
      },
      name: {
        type: DataTypes.STRING(150),
        allowNull: false
      },
      professionalProfile: {
        type: DataTypes.TEXT,
        allowNull: false,
        field: "professional_profile"
      },
      passwordHash: {
        type: DataTypes.TEXT,
        allowNull: false,
        field: "password_hash"
      },
      role: {
        type: DataTypes.ENUM("admin", "user"),
        allowNull: false
      },
      state: {
        type: DataTypes.ENUM("active", "inactive"),
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
      tableName: "users",
      timestamps: true,
      paranoid: true
    }
  )

  return UserModel
}
