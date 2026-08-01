import test from "node:test"
import assert from "node:assert/strict"
import crypto from "node:crypto"
import type { AddressInfo } from "node:net"
import { createApp } from "../src/app"
import { sequelize } from "../src/database/sequelize"
import { CommentModel, ProjectModel, TaskModel, UserModel } from "../src/models"
import { ProjectRepository } from "../src/repositories/project.repository"
import { TaskRepository } from "../src/repositories/task.repository"
import { UserRepository } from "../src/repositories/user.repository"
import { hashPassword } from "../src/utils/password"

const userRepository = new UserRepository()
const projectRepository = new ProjectRepository()
const taskRepository = new TaskRepository()

const createdUserIds: string[] = []
const createdProjectIds: string[] = []
const createdTaskIds: string[] = []

let baseUrl: string
let close: () => Promise<void>
let adminToken: string
let adminId: string

async function login(accessIdentifier: string, password: string) {
  const response = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ accessIdentifier, password })
  })
  const body = await response.json()
  return { status: response.status, body }
}

async function createStandardUser() {
  const id = crypto.randomUUID()
  const accessIdentifier = `it-proj-user-${id}`
  const password = "St4ndardPass!"
  await userRepository.create({
    id,
    accessIdentifier,
    name: "Standard Project User",
    professionalProfile: "Developer",
    passwordHash: hashPassword(password),
    role: "user",
    state: "active"
  })
  createdUserIds.push(id)
  return { id, accessIdentifier, password }
}

async function createProject(state: "planned" | "active" | "on_hold" | "completed" | "archived" = "planned") {
  const id = crypto.randomUUID()
  await projectRepository.create({
    id,
    name: `Integration Project ${id}`,
    description: "Created by integration test",
    responsibleAdminId: adminId,
    eta: new Date("2026-12-31T00:00:00.000Z"),
    state
  })
  createdProjectIds.push(id)
  return id
}

async function assignTask(projectId: string, assignedUserId: string) {
  const id = crypto.randomUUID()
  await taskRepository.create({
    id,
    projectId,
    assignedUserId,
    title: "Integration Task",
    description: "Created by integration test",
    priority: "medium",
    state: "to_do",
    dueDate: new Date("2026-07-01T00:00:00.000Z")
  })
  createdTaskIds.push(id)
  return id
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

  const me = await fetch(`${baseUrl}/api/auth/me`, { headers: { authorization: `Bearer ${adminToken}` } })
  const meBody = await me.json()
  adminId = meBody.data.user.id
})

test.after(async () => {
  await CommentModel.destroy({ where: { projectId: createdProjectIds }, force: true })
  await TaskModel.destroy({ where: { id: createdTaskIds }, force: true })
  await ProjectModel.destroy({ where: { id: createdProjectIds }, force: true })
  await UserModel.destroy({ where: { id: createdUserIds }, force: true })
  await close()
  await sequelize.close()
})

test("POST /api/projects requires authentication", async () => {
  const response = await fetch(`${baseUrl}/api/projects`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ name: "No Auth", description: "x", eta: "2026-12-31T00:00:00.000Z" })
  })

  assert.equal(response.status, 401)
})

test("POST /api/projects is forbidden for a standard user", async () => {
  const standard = await createStandardUser()
  const standardLogin = await login(standard.accessIdentifier, standard.password)

  const response = await fetch(`${baseUrl}/api/projects`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${standardLogin.body.data.token}` },
    body: JSON.stringify({ name: "Should Fail", description: "x", eta: "2026-12-31T00:00:00.000Z" })
  })

  assert.equal(response.status, 403)
})

test("POST /api/projects creates a project defaulting to state 'planned'", async () => {
  const response = await fetch(`${baseUrl}/api/projects`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({
      name: "New Integration Project",
      description: "Created via API",
      eta: "2026-12-31T00:00:00.000Z"
    })
  })

  assert.equal(response.status, 201)
  const body = await response.json()
  createdProjectIds.push(body.data.id)

  assert.equal(body.data.state, "planned")
  assert.equal(body.data.responsibleAdminId, adminId)
  assert.equal(body.data.progressCalculated, 0)
})

test("POST /api/projects rejects missing fields", async () => {
  const response = await fetch(`${baseUrl}/api/projects`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({ name: "Incomplete" })
  })

  assert.equal(response.status, 400)
})

test("POST /api/projects rejects an invalid eta", async () => {
  const response = await fetch(`${baseUrl}/api/projects`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({ name: "Bad ETA", description: "x", eta: "not-a-date" })
  })

  assert.equal(response.status, 400)
})

test("POST /api/projects rejects setting state to 'archived' directly", async () => {
  const response = await fetch(`${baseUrl}/api/projects`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({
      name: "Should Not Archive",
      description: "x",
      eta: "2026-12-31T00:00:00.000Z",
      state: "archived"
    })
  })

  assert.equal(response.status, 400)
})

test("GET /api/projects returns all projects for admin but only assigned ones for a standard user", async () => {
  const projectId = await createProject()
  const standard = await createStandardUser()
  const standardLogin = await login(standard.accessIdentifier, standard.password)

  const emptyList = await fetch(`${baseUrl}/api/projects`, {
    headers: { authorization: `Bearer ${standardLogin.body.data.token}` }
  })
  const emptyBody = await emptyList.json()
  assert.ok(!emptyBody.data.some((project: { id: string }) => project.id === projectId))

  await assignTask(projectId, standard.id)

  const filledList = await fetch(`${baseUrl}/api/projects`, {
    headers: { authorization: `Bearer ${standardLogin.body.data.token}` }
  })
  const filledBody = await filledList.json()
  assert.ok(filledBody.data.some((project: { id: string }) => project.id === projectId))

  const adminList = await fetch(`${baseUrl}/api/projects`, {
    headers: { authorization: `Bearer ${adminToken}` }
  })
  const adminBody = await adminList.json()
  assert.ok(adminBody.data.some((project: { id: string }) => project.id === projectId))
})

test("GET /api/projects/:id returns 404 for a standard user without an assigned task in that project", async () => {
  const projectId = await createProject()
  const standard = await createStandardUser()
  const standardLogin = await login(standard.accessIdentifier, standard.password)

  const response = await fetch(`${baseUrl}/api/projects/${projectId}`, {
    headers: { authorization: `Bearer ${standardLogin.body.data.token}` }
  })

  assert.equal(response.status, 404)
})

test("GET /api/projects/:id returns 200 for a standard user with an assigned task in that project", async () => {
  const projectId = await createProject()
  const standard = await createStandardUser()
  await assignTask(projectId, standard.id)
  const standardLogin = await login(standard.accessIdentifier, standard.password)

  const response = await fetch(`${baseUrl}/api/projects/${projectId}`, {
    headers: { authorization: `Bearer ${standardLogin.body.data.token}` }
  })

  assert.equal(response.status, 200)
  const body = await response.json()
  assert.equal(body.data.id, projectId)
})

test("PATCH /api/projects/:id updates a project as admin", async () => {
  const projectId = await createProject()

  const response = await fetch(`${baseUrl}/api/projects/${projectId}`, {
    method: "PATCH",
    headers: { "content-type": "application/json", authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({ name: "Updated Name", state: "active" })
  })

  assert.equal(response.status, 200)
  const body = await response.json()
  assert.equal(body.data.name, "Updated Name")
  assert.equal(body.data.state, "active")
})

test("PATCH /api/projects/:id is forbidden for a standard user", async () => {
  const projectId = await createProject()
  const standard = await createStandardUser()
  const standardLogin = await login(standard.accessIdentifier, standard.password)

  const response = await fetch(`${baseUrl}/api/projects/${projectId}`, {
    method: "PATCH",
    headers: { "content-type": "application/json", authorization: `Bearer ${standardLogin.body.data.token}` },
    body: JSON.stringify({ name: "Hacked" })
  })

  assert.equal(response.status, 403)
})

test("PATCH /api/projects/:id rejects an empty payload", async () => {
  const projectId = await createProject()

  const response = await fetch(`${baseUrl}/api/projects/${projectId}`, {
    method: "PATCH",
    headers: { "content-type": "application/json", authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({})
  })

  assert.equal(response.status, 400)
})

test("PATCH /api/projects/:id/archive requires a comment and archives the project", async () => {
  const projectId = await createProject()

  const missingComment = await fetch(`${baseUrl}/api/projects/${projectId}/archive`, {
    method: "PATCH",
    headers: { "content-type": "application/json", authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({})
  })
  assert.equal(missingComment.status, 400)

  const response = await fetch(`${baseUrl}/api/projects/${projectId}/archive`, {
    method: "PATCH",
    headers: { "content-type": "application/json", authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({ comment: "Archivado por baja prioridad" })
  })

  assert.equal(response.status, 200)
  const body = await response.json()
  assert.equal(body.data.state, "archived")
  assert.ok(body.data.archivedAt)

  const comments = await fetch(`${baseUrl}/api/projects/${projectId}/comments`, {
    headers: { authorization: `Bearer ${adminToken}` }
  })
  const commentsBody = await comments.json()
  assert.ok(
    commentsBody.data.some((comment: { content: string }) => comment.content === "Archivado por baja prioridad")
  )
})

test("PATCH /api/projects/:id/archive is forbidden for a standard user", async () => {
  const projectId = await createProject()
  const standard = await createStandardUser()
  const standardLogin = await login(standard.accessIdentifier, standard.password)

  const response = await fetch(`${baseUrl}/api/projects/${projectId}/archive`, {
    method: "PATCH",
    headers: { "content-type": "application/json", authorization: `Bearer ${standardLogin.body.data.token}` },
    body: JSON.stringify({ comment: "Intento no autorizado" })
  })

  assert.equal(response.status, 403)
})

test("PATCH /api/projects/:id/archive rejects archiving an already archived project", async () => {
  const projectId = await createProject("archived")

  const response = await fetch(`${baseUrl}/api/projects/${projectId}/archive`, {
    method: "PATCH",
    headers: { "content-type": "application/json", authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({ comment: "Otro comentario" })
  })

  assert.equal(response.status, 409)
})

test("DELETE /api/projects/:id rejects deleting a project that is not archived", async () => {
  const projectId = await createProject("active")

  const response = await fetch(`${baseUrl}/api/projects/${projectId}`, {
    method: "DELETE",
    headers: { "content-type": "application/json", authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({ comment: "Eliminar sin archivar" })
  })

  assert.equal(response.status, 409)
})

test("DELETE /api/projects/:id requires a comment and soft-deletes an archived project", async () => {
  const projectId = await createProject("archived")

  const missingComment = await fetch(`${baseUrl}/api/projects/${projectId}`, {
    method: "DELETE",
    headers: { "content-type": "application/json", authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({})
  })
  assert.equal(missingComment.status, 400)

  const response = await fetch(`${baseUrl}/api/projects/${projectId}`, {
    method: "DELETE",
    headers: { "content-type": "application/json", authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({ comment: "Eliminado tras revisión" })
  })

  assert.equal(response.status, 200)

  const list = await fetch(`${baseUrl}/api/projects`, { headers: { authorization: `Bearer ${adminToken}` } })
  const listBody = await list.json()
  assert.ok(!listBody.data.some((project: { id: string }) => project.id === projectId))

  const getById = await fetch(`${baseUrl}/api/projects/${projectId}`, {
    headers: { authorization: `Bearer ${adminToken}` }
  })
  assert.equal(getById.status, 404)
})

test("DELETE /api/projects/:id is forbidden for a standard user", async () => {
  const projectId = await createProject("archived")
  const standard = await createStandardUser()
  const standardLogin = await login(standard.accessIdentifier, standard.password)

  const response = await fetch(`${baseUrl}/api/projects/${projectId}`, {
    method: "DELETE",
    headers: { "content-type": "application/json", authorization: `Bearer ${standardLogin.body.data.token}` },
    body: JSON.stringify({ comment: "Intento no autorizado" })
  })

  assert.equal(response.status, 403)
})

test("GET /api/projects/:id/comments is forbidden (404) for a standard user without visibility", async () => {
  const projectId = await createProject()
  const standard = await createStandardUser()
  const standardLogin = await login(standard.accessIdentifier, standard.password)

  const response = await fetch(`${baseUrl}/api/projects/${projectId}/comments`, {
    headers: { authorization: `Bearer ${standardLogin.body.data.token}` }
  })

  assert.equal(response.status, 404)
})

test("POST /api/projects/:id/comments allows a standard user with visibility to comment", async () => {
  const projectId = await createProject()
  const standard = await createStandardUser()
  await assignTask(projectId, standard.id)
  const standardLogin = await login(standard.accessIdentifier, standard.password)

  const response = await fetch(`${baseUrl}/api/projects/${projectId}/comments`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${standardLogin.body.data.token}` },
    body: JSON.stringify({ content: "Comentario de usuario asignado" })
  })

  assert.equal(response.status, 201)
  const body = await response.json()
  assert.equal(body.data.content, "Comentario de usuario asignado")
  assert.equal(body.data.authorName, "Standard Project User")
})

test("POST /api/projects/:id/comments rejects a standard user without visibility", async () => {
  const projectId = await createProject()
  const standard = await createStandardUser()
  const standardLogin = await login(standard.accessIdentifier, standard.password)

  const response = await fetch(`${baseUrl}/api/projects/${projectId}/comments`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${standardLogin.body.data.token}` },
    body: JSON.stringify({ content: "No debería poder comentar" })
  })

  assert.equal(response.status, 404)
})

test("POST /api/projects/:id/comments rejects empty content", async () => {
  const projectId = await createProject()

  const response = await fetch(`${baseUrl}/api/projects/${projectId}/comments`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({ content: "   " })
  })

  assert.equal(response.status, 400)
})

test("GET /api/projects/:id/comments returns comments with author name for admin", async () => {
  const projectId = await createProject()

  await fetch(`${baseUrl}/api/projects/${projectId}/comments`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({ content: "Comentario del administrador" })
  })

  const response = await fetch(`${baseUrl}/api/projects/${projectId}/comments`, {
    headers: { authorization: `Bearer ${adminToken}` }
  })

  assert.equal(response.status, 200)
  const body = await response.json()
  const created = body.data.find((comment: { content: string }) => comment.content === "Comentario del administrador")
  assert.ok(created)
  assert.equal(created.authorUserId, adminId)
  assert.ok(created.authorName)
})
