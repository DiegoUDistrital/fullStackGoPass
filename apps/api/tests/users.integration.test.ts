import test from "node:test"
import assert from "node:assert/strict"
import crypto from "node:crypto"
import type { AddressInfo } from "node:net"
import { createApp } from "../src/app"
import { sequelize } from "../src/database/sequelize"
import { UserModel } from "../src/models"
import { UserRepository } from "../src/repositories/user.repository"
import { hashPassword } from "../src/utils/password"

const userRepository = new UserRepository()
const createdUserIds: string[] = []

let baseUrl: string
let close: () => Promise<void>
let adminToken: string

async function login(accessIdentifier: string, password: string) {
  const response = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ accessIdentifier, password })
  })
  const body = await response.json()
  return { status: response.status, body }
}

async function createStandardUser(state: "active" | "inactive" = "active") {
  const id = crypto.randomUUID()
  const accessIdentifier = `it-user-mgmt-${id}`
  const password = "St4ndardPass!"
  await userRepository.create({
    id,
    accessIdentifier,
    name: "Standard Integration User",
    professionalProfile: "Developer",
    passwordHash: hashPassword(password),
    role: "user",
    state
  })
  createdUserIds.push(id)
  return { id, accessIdentifier, password }
}

async function createAdminUser(state: "active" | "inactive" = "active") {
  const id = crypto.randomUUID()
  const accessIdentifier = `it-admin-mgmt-${id}`
  const password = "Adm1nMgmtPass!"
  await userRepository.create({
    id,
    accessIdentifier,
    name: "Admin Integration User",
    professionalProfile: "Project Manager",
    passwordHash: hashPassword(password),
    role: "admin",
    state
  })
  createdUserIds.push(id)
  return { id, accessIdentifier, password }
}

test.before(async () => {
  await sequelize.authenticate()

  const app = createApp()
  const server = app.listen(0)
  await new Promise<void>((resolve) => server.once("listening", resolve))
  const { port } = server.address() as AddressInfo
  baseUrl = `http://127.0.0.1:${port}`
  close = () => new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())))

  const adminLogin = await login("admin", "admin1234")
  adminToken = adminLogin.body.data.token
})

test.after(async () => {
  await UserModel.destroy({ where: { id: createdUserIds }, force: true })
  await close()
  await sequelize.close()
})

test("POST /api/users requires authentication", async () => {
  const response = await fetch(`${baseUrl}/api/users`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      accessIdentifier: "no-auth",
      name: "No Auth",
      professionalProfile: "QA",
      password: "Password1!"
    })
  })

  assert.equal(response.status, 401)
})

test("POST /api/users is forbidden for a standard user", async () => {
  const standard = await createStandardUser()
  const standardLogin = await login(standard.accessIdentifier, standard.password)

  const response = await fetch(`${baseUrl}/api/users`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${standardLogin.body.data.token}` },
    body: JSON.stringify({
      accessIdentifier: "should-not-be-created",
      name: "Should Fail",
      professionalProfile: "QA",
      password: "Password1!"
    })
  })

  assert.equal(response.status, 403)
})

test("POST /api/users creates a user as admin with role user and state active", async () => {
  const accessIdentifier = `it-created-${crypto.randomUUID()}`

  const response = await fetch(`${baseUrl}/api/users`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({
      accessIdentifier,
      name: "New Integration User",
      professionalProfile: "QA Engineer",
      password: "NewUser1!"
    })
  })

  assert.equal(response.status, 201)
  const body = await response.json()
  createdUserIds.push(body.data.id)

  assert.equal(body.data.accessIdentifier, accessIdentifier)
  assert.equal(body.data.role, "user")
  assert.equal(body.data.state, "active")
  assert.equal(body.data.passwordHash, undefined)
})

test("POST /api/users rejects a duplicate accessIdentifier", async () => {
  const response = await fetch(`${baseUrl}/api/users`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({
      accessIdentifier: "admin",
      name: "Duplicate",
      professionalProfile: "QA",
      password: "Password1!"
    })
  })

  assert.equal(response.status, 409)
})

test("POST /api/users rejects missing fields", async () => {
  const response = await fetch(`${baseUrl}/api/users`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({ accessIdentifier: "incomplete" })
  })

  assert.equal(response.status, 400)
})

test("GET /api/users is forbidden for a standard user and allowed for admin", async () => {
  const standard = await createStandardUser()
  const standardLogin = await login(standard.accessIdentifier, standard.password)

  const forbidden = await fetch(`${baseUrl}/api/users`, {
    headers: { authorization: `Bearer ${standardLogin.body.data.token}` }
  })
  assert.equal(forbidden.status, 403)

  const allowed = await fetch(`${baseUrl}/api/users`, {
    headers: { authorization: `Bearer ${adminToken}` }
  })
  assert.equal(allowed.status, 200)
  const body = await allowed.json()
  assert.ok(body.data.some((user: { accessIdentifier: string }) => user.accessIdentifier === "admin"))
})

test("GET /api/users/:id returns 404 for an unknown user", async () => {
  const response = await fetch(`${baseUrl}/api/users/${crypto.randomUUID()}`, {
    headers: { authorization: `Bearer ${adminToken}` }
  })

  assert.equal(response.status, 404)
})

test("PATCH /api/users/:id updates name and professionalProfile as admin", async () => {
  const standard = await createStandardUser()

  const response = await fetch(`${baseUrl}/api/users/${standard.id}`, {
    method: "PATCH",
    headers: { "content-type": "application/json", authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({ name: "Updated Name", professionalProfile: "Senior Developer" })
  })

  assert.equal(response.status, 200)
  const body = await response.json()
  assert.equal(body.data.name, "Updated Name")
  assert.equal(body.data.professionalProfile, "Senior Developer")
})

test("PATCH /api/users/:id is forbidden for a standard user", async () => {
  const target = await createStandardUser()
  const actor = await createStandardUser()
  const actorLogin = await login(actor.accessIdentifier, actor.password)

  const response = await fetch(`${baseUrl}/api/users/${target.id}`, {
    method: "PATCH",
    headers: { "content-type": "application/json", authorization: `Bearer ${actorLogin.body.data.token}` },
    body: JSON.stringify({ name: "Hacked Name" })
  })

  assert.equal(response.status, 403)
})

test("PATCH /api/users/:id rejects an empty payload", async () => {
  const standard = await createStandardUser()

  const response = await fetch(`${baseUrl}/api/users/${standard.id}`, {
    method: "PATCH",
    headers: { "content-type": "application/json", authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({})
  })

  assert.equal(response.status, 400)
})

test("PATCH /api/users/:id/deactivate deactivates the user and blocks their login", async () => {
  const standard = await createStandardUser()

  const response = await fetch(`${baseUrl}/api/users/${standard.id}/deactivate`, {
    method: "PATCH",
    headers: { authorization: `Bearer ${adminToken}` }
  })
  assert.equal(response.status, 200)
  const body = await response.json()
  assert.equal(body.data.state, "inactive")

  const blockedLogin = await login(standard.accessIdentifier, standard.password)
  assert.equal(blockedLogin.status, 403)
})

test("PATCH /api/users/:id/activate reactivates the user and restores their login", async () => {
  const standard = await createStandardUser("inactive")

  const response = await fetch(`${baseUrl}/api/users/${standard.id}/activate`, {
    method: "PATCH",
    headers: { authorization: `Bearer ${adminToken}` }
  })
  assert.equal(response.status, 200)
  const body = await response.json()
  assert.equal(body.data.state, "active")

  const restoredLogin = await login(standard.accessIdentifier, standard.password)
  assert.equal(restoredLogin.status, 200)
})

test("PATCH /api/users/:id/activate is forbidden for a standard user", async () => {
  const target = await createStandardUser("inactive")
  const actor = await createStandardUser()
  const actorLogin = await login(actor.accessIdentifier, actor.password)

  const response = await fetch(`${baseUrl}/api/users/${target.id}/activate`, {
    method: "PATCH",
    headers: { authorization: `Bearer ${actorLogin.body.data.token}` }
  })

  assert.equal(response.status, 403)
})

test("PATCH /api/users/me/password changes the caller's own password", async () => {
  const standard = await createStandardUser()
  const standardLogin = await login(standard.accessIdentifier, standard.password)

  const response = await fetch(`${baseUrl}/api/users/me/password`, {
    method: "PATCH",
    headers: { "content-type": "application/json", authorization: `Bearer ${standardLogin.body.data.token}` },
    body: JSON.stringify({ currentPassword: standard.password, newPassword: "Br4ndNewPass!" })
  })

  assert.equal(response.status, 200)

  const oldPasswordLogin = await login(standard.accessIdentifier, standard.password)
  assert.equal(oldPasswordLogin.status, 401)

  const newPasswordLogin = await login(standard.accessIdentifier, "Br4ndNewPass!")
  assert.equal(newPasswordLogin.status, 200)
})

test("PATCH /api/users/me/password rejects an incorrect current password", async () => {
  const standard = await createStandardUser()
  const standardLogin = await login(standard.accessIdentifier, standard.password)

  const response = await fetch(`${baseUrl}/api/users/me/password`, {
    method: "PATCH",
    headers: { "content-type": "application/json", authorization: `Bearer ${standardLogin.body.data.token}` },
    body: JSON.stringify({ currentPassword: "wrong-current", newPassword: "Br4ndNewPass!" })
  })

  assert.equal(response.status, 401)
})

test("PATCH /api/users/me/password rejects missing fields", async () => {
  const standard = await createStandardUser()
  const standardLogin = await login(standard.accessIdentifier, standard.password)

  const response = await fetch(`${baseUrl}/api/users/me/password`, {
    method: "PATCH",
    headers: { "content-type": "application/json", authorization: `Bearer ${standardLogin.body.data.token}` },
    body: JSON.stringify({ currentPassword: standard.password })
  })

  assert.equal(response.status, 400)
})

test("POST /api/users creates an admin user when role is 'admin'", async () => {
  const accessIdentifier = `it-created-admin-${crypto.randomUUID()}`

  const response = await fetch(`${baseUrl}/api/users`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({
      accessIdentifier,
      name: "New Admin User",
      professionalProfile: "Project Manager",
      password: "NewAdmin1!",
      role: "admin"
    })
  })

  assert.equal(response.status, 201)
  const body = await response.json()
  createdUserIds.push(body.data.id)

  assert.equal(body.data.role, "admin")
  assert.equal(body.data.state, "active")
})

test("POST /api/users rejects an invalid role value", async () => {
  const response = await fetch(`${baseUrl}/api/users`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({
      accessIdentifier: `it-invalid-role-${crypto.randomUUID()}`,
      name: "Invalid Role",
      professionalProfile: "QA",
      password: "Password1!",
      role: "superadmin"
    })
  })

  assert.equal(response.status, 400)
})

test("PATCH /api/users/:id promotes a standard user to admin", async () => {
  const standard = await createStandardUser()

  const response = await fetch(`${baseUrl}/api/users/${standard.id}`, {
    method: "PATCH",
    headers: { "content-type": "application/json", authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({ role: "admin" })
  })

  assert.equal(response.status, 200)
  const body = await response.json()
  assert.equal(body.data.role, "admin")
})

test("PATCH /api/users/:id demotes an admin to user when other active admins exist", async () => {
  const admin = await createAdminUser()

  const response = await fetch(`${baseUrl}/api/users/${admin.id}`, {
    method: "PATCH",
    headers: { "content-type": "application/json", authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({ role: "user" })
  })

  assert.equal(response.status, 200)
  const body = await response.json()
  assert.equal(body.data.role, "user")
})

test("PATCH /api/users/:id rejects an invalid role value", async () => {
  const standard = await createStandardUser()

  const response = await fetch(`${baseUrl}/api/users/${standard.id}`, {
    method: "PATCH",
    headers: { "content-type": "application/json", authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({ role: "superadmin" })
  })

  assert.equal(response.status, 400)
})

test("PATCH /api/users/:id forbids an admin from changing their own role", async () => {
  const meResponse = await fetch(`${baseUrl}/api/auth/me`, {
    headers: { authorization: `Bearer ${adminToken}` }
  })
  const me = await meResponse.json()

  const response = await fetch(`${baseUrl}/api/users/${me.data.user.id}`, {
    method: "PATCH",
    headers: { "content-type": "application/json", authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({ role: "user" })
  })

  assert.equal(response.status, 403)

  const stillAdmin = await fetch(`${baseUrl}/api/auth/me`, {
    headers: { authorization: `Bearer ${adminToken}` }
  })
  const stillAdminBody = await stillAdmin.json()
  assert.equal(stillAdminBody.data.user.role, "admin")
})
