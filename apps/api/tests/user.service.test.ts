import test from "node:test"
import assert from "node:assert/strict"
import { UserService } from "../src/services/user.service"
import type { UserRepository } from "../src/repositories/user.repository"
import { HttpError } from "../src/types/http-error"
import { hashPassword } from "../src/utils/password"

interface FakeUserRecord {
  id: string
  accessIdentifier: string
  name: string
  professionalProfile: string
  passwordHash: string
  role: "admin" | "user"
  state: "active" | "inactive"
}

class FakeUserRepository {
  private readonly users = new Map<string, FakeUserRecord>()

  public seed(user: FakeUserRecord): void {
    this.users.set(user.id, user)
  }

  public async create(data: FakeUserRecord): Promise<FakeUserRecord> {
    this.users.set(data.id, data)
    return data
  }

  public async findById(id: string): Promise<FakeUserRecord | null> {
    return this.users.get(id) ?? null
  }

  public async findByAccessIdentifier(accessIdentifier: string): Promise<FakeUserRecord | null> {
    return [...this.users.values()].find((user) => user.accessIdentifier === accessIdentifier) ?? null
  }

  public async list(): Promise<FakeUserRecord[]> {
    return [...this.users.values()]
  }

  public async countActiveAdmins(): Promise<number> {
    return [...this.users.values()].filter((user) => user.role === "admin" && user.state === "active").length
  }

  public async updateById(id: string, data: Partial<FakeUserRecord>): Promise<FakeUserRecord | null> {
    const existing = this.users.get(id)
    if (!existing) {
      return null
    }
    const updated = { ...existing, ...data }
    this.users.set(id, updated)
    return updated
  }
}

function buildService() {
  const fakeRepository = new FakeUserRepository()
  const service = new UserService(fakeRepository as unknown as UserRepository)
  return { fakeRepository, service }
}

function makeAdmin(id: string, state: "active" | "inactive" = "active"): FakeUserRecord {
  return {
    id,
    accessIdentifier: `admin-${id}`,
    name: "Admin",
    professionalProfile: "PM",
    passwordHash: hashPassword("Whatever1!"),
    role: "admin",
    state
  }
}

function makeUser(id: string, state: "active" | "inactive" = "active"): FakeUserRecord {
  return {
    id,
    accessIdentifier: `user-${id}`,
    name: "User",
    professionalProfile: "Dev",
    passwordHash: hashPassword("Whatever1!"),
    role: "user",
    state
  }
}

test("createUser defaults role to 'user' when not specified", async () => {
  const { service } = buildService()

  const created = await service.createUser({
    accessIdentifier: "new-user",
    name: "New User",
    professionalProfile: "Dev",
    password: "Password1!"
  })

  assert.equal(created.role, "user")
})

test("createUser honors an explicit 'admin' role", async () => {
  const { service } = buildService()

  const created = await service.createUser({
    accessIdentifier: "new-admin",
    name: "New Admin",
    professionalProfile: "PM",
    password: "Password1!",
    role: "admin"
  })

  assert.equal(created.role, "admin")
})

test("updateUser blocks an admin from changing their own role", async () => {
  const { fakeRepository, service } = buildService()
  fakeRepository.seed(makeAdmin("admin-1"))

  await assert.rejects(
    () => service.updateUser("admin-1", { role: "user" }, "admin-1"),
    (error: unknown) => error instanceof HttpError && error.statusCode === 403
  )
})

test("updateUser blocks demoting the last active admin", async () => {
  const { fakeRepository, service } = buildService()
  fakeRepository.seed(makeAdmin("admin-1"))
  fakeRepository.seed(makeUser("user-1"))

  await assert.rejects(
    () => service.updateUser("admin-1", { role: "user" }, "user-1"),
    (error: unknown) => error instanceof HttpError && error.statusCode === 409
  )
})

test("updateUser allows demoting an admin when another active admin exists", async () => {
  const { fakeRepository, service } = buildService()
  fakeRepository.seed(makeAdmin("admin-1"))
  fakeRepository.seed(makeAdmin("admin-2"))

  const updated = await service.updateUser("admin-1", { role: "user" }, "admin-2")
  assert.equal(updated.role, "user")
})

test("updateUser allows demoting an already inactive admin regardless of active admin count", async () => {
  const { fakeRepository, service } = buildService()
  fakeRepository.seed(makeAdmin("admin-1"))
  fakeRepository.seed(makeAdmin("admin-2", "inactive"))

  const updated = await service.updateUser("admin-2", { role: "user" }, "admin-1")
  assert.equal(updated.role, "user")
})

test("setUserState blocks deactivating the last active admin", async () => {
  const { fakeRepository, service } = buildService()
  fakeRepository.seed(makeAdmin("admin-1"))

  await assert.rejects(
    () => service.setUserState("admin-1", "inactive"),
    (error: unknown) => error instanceof HttpError && error.statusCode === 409
  )
})

test("setUserState allows deactivating an admin when another active admin exists", async () => {
  const { fakeRepository, service } = buildService()
  fakeRepository.seed(makeAdmin("admin-1"))
  fakeRepository.seed(makeAdmin("admin-2"))

  const updated = await service.setUserState("admin-1", "inactive")
  assert.equal(updated.state, "inactive")
})

test("setUserState allows deactivating a standard user regardless of admin count", async () => {
  const { fakeRepository, service } = buildService()
  fakeRepository.seed(makeAdmin("admin-1"))
  fakeRepository.seed(makeUser("user-1"))

  const updated = await service.setUserState("user-1", "inactive")
  assert.equal(updated.state, "inactive")
})
