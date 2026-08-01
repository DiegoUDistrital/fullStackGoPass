import { UserModel } from "../models"

export class UserRepository {
  public create(data: {
    id: string
    accessIdentifier: string
    name: string
    professionalProfile: string
    passwordHash: string
    role: "admin" | "user"
    state: "active" | "inactive"
  }) {
    return UserModel.create(data)
  }

  public findById(id: string) {
    return UserModel.findByPk(id)
  }

  public findByAccessIdentifier(accessIdentifier: string) {
    return UserModel.findOne({ where: { accessIdentifier } })
  }

  public list() {
    return UserModel.findAll()
  }

  public async updateById(
    id: string,
    data: Partial<{
      name: string
      professionalProfile: string
      passwordHash: string
      state: "active" | "inactive"
    }>
  ) {
    await UserModel.update(data, { where: { id } })
    return this.findById(id)
  }
}
