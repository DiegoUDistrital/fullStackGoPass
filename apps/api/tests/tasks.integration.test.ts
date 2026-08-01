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

async function createStandardUser(state: "active" | "inactive" = "active") {
  const id = crypto.randomUUID()
  const accessIdentifier = `it-task-user-${id}`
  const password = "St4ndardPass!"
  await userRepository.create({
    id,
    accessIdentifier,
    name: "Standard Task User",
    professionalProfile: "Developer",
    passwordHash: hashPassword(password),
    role: "user",
    state
  })
  createdUserIds.push(id)
  return { id, accessIdentifier, password }
}

async function createProject() {
  const id = crypto.randomUUID()
  await projectRepository.create({
    id,
    name: `Integration Task Project ${id}`,
    description: "Created by integration test",
    responsibleAdminId: adminId,
    eta: new Date("2026-12-31T00:00:00.000Z"),
    state: "active"
  })
  createdProjectIds.push(id)
  return id
}

async function createTask(
  projectId: string,
  overrides: Partial<{
    assignedUserId: string | null
    state: "open" | "to_do" | "in_process" | "testing" | "qa" | "finished" | "on_hold"
  }> = {}
) {
  const id = crypto.randomUUID()
  await taskRepository.create({
    id,
    projectId,
    assignedUserId: overrides.assignedUserId ?? null,
    title: "Integration Task",
    description: "Created by integration test",
    priority: "medium",
    state: overrides.state ?? "open",
    dueDate: new Date("2026-08-01T00:00:00.000Z")
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
  await CommentModel.destroy({ where: { taskId: createdTaskIds }, force: true })
  await TaskModel.destroy({ where: { id: createdTaskIds }, force: true })
  await ProjectModel.destroy({ where: { id: createdProjectIds }, force: true })
  await UserModel.destroy({ where: { id: createdUserIds }, force: true })
  await close()
  await sequelize.close()
})

test("POST /api/projects/:projectId/tasks requires authentication", async () => {
  const projectId = await createProject()

  const response = await fetch(`${baseUrl}/api/projects/${projectId}/tasks`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ title: "No Auth", description: "x", priority: "low", dueDate: "2026-08-01" })
  })

  assert.equal(response.status, 401)
})

test("POST /api/projects/:projectId/tasks is forbidden for a standard user", async () => {
  const projectId = await createProject()
  const standard = await createStandardUser()
  const standardLogin = await login(standard.accessIdentifier, standard.password)

  const response = await fetch(`${baseUrl}/api/projects/${projectId}/tasks`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${standardLogin.body.data.token}` },
    body: JSON.stringify({ title: "Should Fail", description: "x", priority: "low", dueDate: "2026-08-01" })
  })

  assert.equal(response.status, 403)
})

test("POST /api/projects/:projectId/tasks creates a task in 'open' state without an assignee", async () => {
  const projectId = await createProject()

  const response = await fetch(`${baseUrl}/api/projects/${projectId}/tasks`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({
      title: "New Integration Task",
      description: "Created via API",
      priority: "high",
      dueDate: "2026-09-01"
    })
  })

  assert.equal(response.status, 201)
  const body = await response.json()
  createdTaskIds.push(body.data.id)

  assert.equal(body.data.state, "open")
  assert.equal(body.data.assignedUserId, null)
  assert.equal(body.data.priority, "high")
})

test("POST /api/projects/:projectId/tasks rejects missing fields", async () => {
  const projectId = await createProject()

  const response = await fetch(`${baseUrl}/api/projects/${projectId}/tasks`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({ title: "Incomplete" })
  })

  assert.equal(response.status, 400)
})

test("POST /api/projects/:projectId/tasks rejects an invalid priority", async () => {
  const projectId = await createProject()

  const response = await fetch(`${baseUrl}/api/projects/${projectId}/tasks`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({ title: "Bad Priority", description: "x", priority: "critical", dueDate: "2026-08-01" })
  })

  assert.equal(response.status, 400)
})

test("POST /api/projects/:projectId/tasks returns 404 for a nonexistent project", async () => {
  const response = await fetch(`${baseUrl}/api/projects/${crypto.randomUUID()}/tasks`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({ title: "Orphan", description: "x", priority: "low", dueDate: "2026-08-01" })
  })

  assert.equal(response.status, 404)
})

test("GET /api/projects/:projectId/tasks hides 'open' tasks from a standard user with project visibility", async () => {
  const projectId = await createProject()
  const standard = await createStandardUser()
  const assignedTaskId = await createTask(projectId, { assignedUserId: standard.id, state: "to_do" })
  const openTaskId = await createTask(projectId, { state: "open" })
  const standardLogin = await login(standard.accessIdentifier, standard.password)

  const response = await fetch(`${baseUrl}/api/projects/${projectId}/tasks`, {
    headers: { authorization: `Bearer ${standardLogin.body.data.token}` }
  })

  assert.equal(response.status, 200)
  const body = await response.json()
  assert.ok(body.data.some((task: { id: string }) => task.id === assignedTaskId))
  assert.ok(!body.data.some((task: { id: string }) => task.id === openTaskId))

  const adminResponse = await fetch(`${baseUrl}/api/projects/${projectId}/tasks`, {
    headers: { authorization: `Bearer ${adminToken}` }
  })
  const adminBody = await adminResponse.json()
  assert.ok(adminBody.data.some((task: { id: string }) => task.id === openTaskId))
})

test("GET /api/projects/:projectId/tasks returns 404 for a standard user without visibility on the project", async () => {
  const projectId = await createProject()
  await createTask(projectId, { state: "to_do" })
  const standard = await createStandardUser()
  const standardLogin = await login(standard.accessIdentifier, standard.password)

  const response = await fetch(`${baseUrl}/api/projects/${projectId}/tasks`, {
    headers: { authorization: `Bearer ${standardLogin.body.data.token}` }
  })

  assert.equal(response.status, 404)
})

test("GET /api/tasks/:id returns 404 for an 'open' task to a standard user with project visibility", async () => {
  const projectId = await createProject()
  const standard = await createStandardUser()
  await createTask(projectId, { assignedUserId: standard.id, state: "to_do" })
  const openTaskId = await createTask(projectId, { state: "open" })
  const standardLogin = await login(standard.accessIdentifier, standard.password)

  const response = await fetch(`${baseUrl}/api/tasks/${openTaskId}`, {
    headers: { authorization: `Bearer ${standardLogin.body.data.token}` }
  })

  assert.equal(response.status, 404)
})

test("GET /api/tasks/:id allows a standard user to view a non-open task in a visible project even if not assigned to them", async () => {
  const projectId = await createProject()
  const standard = await createStandardUser()
  const other = await createStandardUser()
  await createTask(projectId, { assignedUserId: standard.id, state: "to_do" })
  const otherTaskId = await createTask(projectId, { assignedUserId: other.id, state: "in_process" })
  const standardLogin = await login(standard.accessIdentifier, standard.password)

  const response = await fetch(`${baseUrl}/api/tasks/${otherTaskId}`, {
    headers: { authorization: `Bearer ${standardLogin.body.data.token}` }
  })

  assert.equal(response.status, 200)
  const body = await response.json()
  assert.equal(body.data.id, otherTaskId)
})

test("PATCH /api/tasks/:id updates task fields as admin", async () => {
  const projectId = await createProject()
  const taskId = await createTask(projectId)

  const response = await fetch(`${baseUrl}/api/tasks/${taskId}`, {
    method: "PATCH",
    headers: { "content-type": "application/json", authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({ title: "Updated Title", priority: "urgent" })
  })

  assert.equal(response.status, 200)
  const body = await response.json()
  assert.equal(body.data.title, "Updated Title")
  assert.equal(body.data.priority, "urgent")
})

test("PATCH /api/tasks/:id is forbidden for a standard user", async () => {
  const projectId = await createProject()
  const standard = await createStandardUser()
  const taskId = await createTask(projectId, { assignedUserId: standard.id, state: "to_do" })
  const standardLogin = await login(standard.accessIdentifier, standard.password)

  const response = await fetch(`${baseUrl}/api/tasks/${taskId}`, {
    method: "PATCH",
    headers: { "content-type": "application/json", authorization: `Bearer ${standardLogin.body.data.token}` },
    body: JSON.stringify({ title: "Hacked" })
  })

  assert.equal(response.status, 403)
})

test("PATCH /api/tasks/:id rejects an empty payload", async () => {
  const projectId = await createProject()
  const taskId = await createTask(projectId)

  const response = await fetch(`${baseUrl}/api/tasks/${taskId}`, {
    method: "PATCH",
    headers: { "content-type": "application/json", authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({})
  })

  assert.equal(response.status, 400)
})

test("PATCH /api/tasks/:id/assign sets state to 'to_do' and is forbidden for standard users", async () => {
  const projectId = await createProject()
  const taskId = await createTask(projectId)
  const assignee = await createStandardUser()

  const forbidden = await fetch(`${baseUrl}/api/tasks/${taskId}/assign`, {
    method: "PATCH",
    headers: { "content-type": "application/json", authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({})
  })
  assert.equal(forbidden.status, 400)

  const response = await fetch(`${baseUrl}/api/tasks/${taskId}/assign`, {
    method: "PATCH",
    headers: { "content-type": "application/json", authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({ assignedUserId: assignee.id })
  })

  assert.equal(response.status, 200)
  const body = await response.json()
  assert.equal(body.data.state, "to_do")
  assert.equal(body.data.assignedUserId, assignee.id)

  const standardLogin = await login(assignee.accessIdentifier, assignee.password)
  const asStandard = await fetch(`${baseUrl}/api/tasks/${taskId}/assign`, {
    method: "PATCH",
    headers: { "content-type": "application/json", authorization: `Bearer ${standardLogin.body.data.token}` },
    body: JSON.stringify({ assignedUserId: assignee.id })
  })
  assert.equal(asStandard.status, 403)
})

test("PATCH /api/tasks/:id/assign rejects assigning to a nonexistent or inactive user", async () => {
  const projectId = await createProject()
  const taskId = await createTask(projectId)
  const inactive = await createStandardUser("inactive")

  const nonexistent = await fetch(`${baseUrl}/api/tasks/${taskId}/assign`, {
    method: "PATCH",
    headers: { "content-type": "application/json", authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({ assignedUserId: crypto.randomUUID() })
  })
  assert.equal(nonexistent.status, 404)

  const inactiveResponse = await fetch(`${baseUrl}/api/tasks/${taskId}/assign`, {
    method: "PATCH",
    headers: { "content-type": "application/json", authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({ assignedUserId: inactive.id })
  })
  assert.equal(inactiveResponse.status, 409)
})

test("PATCH /api/tasks/:id/unassign reverts to 'open' and rejects unassigning an already open task", async () => {
  const projectId = await createProject()
  const assignee = await createStandardUser()
  const taskId = await createTask(projectId, { assignedUserId: assignee.id, state: "to_do" })

  const response = await fetch(`${baseUrl}/api/tasks/${taskId}/unassign`, {
    method: "PATCH",
    headers: { authorization: `Bearer ${adminToken}` }
  })

  assert.equal(response.status, 200)
  const body = await response.json()
  assert.equal(body.data.state, "open")
  assert.equal(body.data.assignedUserId, null)

  const alreadyOpen = await fetch(`${baseUrl}/api/tasks/${taskId}/unassign`, {
    method: "PATCH",
    headers: { authorization: `Bearer ${adminToken}` }
  })
  assert.equal(alreadyOpen.status, 409)
})

test("PATCH /api/tasks/:id/unassign is forbidden for a standard user", async () => {
  const projectId = await createProject()
  const assignee = await createStandardUser()
  const taskId = await createTask(projectId, { assignedUserId: assignee.id, state: "to_do" })
  const standardLogin = await login(assignee.accessIdentifier, assignee.password)

  const response = await fetch(`${baseUrl}/api/tasks/${taskId}/unassign`, {
    method: "PATCH",
    headers: { authorization: `Bearer ${standardLogin.body.data.token}` }
  })

  assert.equal(response.status, 403)
})

test("PATCH /api/tasks/:id/state rejects an invalid target state", async () => {
  const projectId = await createProject()
  const taskId = await createTask(projectId, { state: "to_do" })

  const response = await fetch(`${baseUrl}/api/tasks/${taskId}/state`, {
    method: "PATCH",
    headers: { "content-type": "application/json", authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({ state: "open" })
  })

  assert.equal(response.status, 400)
})

test("PATCH /api/tasks/:id/state allows progressing states as admin", async () => {
  const projectId = await createProject()
  const taskId = await createTask(projectId, { state: "to_do" })

  const response = await fetch(`${baseUrl}/api/tasks/${taskId}/state`, {
    method: "PATCH",
    headers: { "content-type": "application/json", authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({ state: "in_process" })
  })

  assert.equal(response.status, 200)
  const body = await response.json()
  assert.equal(body.data.state, "in_process")
})

test("PATCH /api/tasks/:id/state rejects setting the same current state", async () => {
  const projectId = await createProject()
  const taskId = await createTask(projectId, { state: "in_process" })

  const response = await fetch(`${baseUrl}/api/tasks/${taskId}/state`, {
    method: "PATCH",
    headers: { "content-type": "application/json", authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({ state: "in_process" })
  })

  assert.equal(response.status, 409)
})

test("PATCH /api/tasks/:id/state only finishes from testing or qa", async () => {
  const projectId = await createProject()
  const taskInProcess = await createTask(projectId, { state: "in_process" })
  const taskInTesting = await createTask(projectId, { state: "testing" })

  const rejected = await fetch(`${baseUrl}/api/tasks/${taskInProcess}/state`, {
    method: "PATCH",
    headers: { "content-type": "application/json", authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({ state: "finished" })
  })
  assert.equal(rejected.status, 409)

  const accepted = await fetch(`${baseUrl}/api/tasks/${taskInTesting}/state`, {
    method: "PATCH",
    headers: { "content-type": "application/json", authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({ state: "finished" })
  })
  assert.equal(accepted.status, 200)
  const body = await accepted.json()
  assert.equal(body.data.state, "finished")
})

test("PATCH /api/tasks/:id/state requires a comment to reopen a finished task", async () => {
  const projectId = await createProject()
  const taskId = await createTask(projectId, { state: "finished" })

  const withoutComment = await fetch(`${baseUrl}/api/tasks/${taskId}/state`, {
    method: "PATCH",
    headers: { "content-type": "application/json", authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({ state: "in_process" })
  })
  assert.equal(withoutComment.status, 400)

  const withComment = await fetch(`${baseUrl}/api/tasks/${taskId}/state`, {
    method: "PATCH",
    headers: { "content-type": "application/json", authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({ state: "in_process", comment: "Se detectó un defecto, se reabre" })
  })
  assert.equal(withComment.status, 200)
  const body = await withComment.json()
  assert.equal(body.data.state, "in_process")

  const comments = await fetch(`${baseUrl}/api/tasks/${taskId}/comments`, {
    headers: { authorization: `Bearer ${adminToken}` }
  })
  const commentsBody = await comments.json()
  assert.ok(
    commentsBody.data.some(
      (comment: { content: string }) => comment.content === "Se detectó un defecto, se reabre"
    )
  )
})

test("PATCH /api/tasks/:id/state allows a standard user to change the state of their own task", async () => {
  const projectId = await createProject()
  const assignee = await createStandardUser()
  const taskId = await createTask(projectId, { assignedUserId: assignee.id, state: "to_do" })
  const standardLogin = await login(assignee.accessIdentifier, assignee.password)

  const response = await fetch(`${baseUrl}/api/tasks/${taskId}/state`, {
    method: "PATCH",
    headers: { "content-type": "application/json", authorization: `Bearer ${standardLogin.body.data.token}` },
    body: JSON.stringify({ state: "in_process" })
  })

  assert.equal(response.status, 200)
  const body = await response.json()
  assert.equal(body.data.state, "in_process")
})

test("PATCH /api/tasks/:id/state forbids a standard user with project visibility from changing another user's task", async () => {
  const projectId = await createProject()
  const owner = await createStandardUser()
  const other = await createStandardUser()
  const taskId = await createTask(projectId, { assignedUserId: owner.id, state: "to_do" })
  // Grants "other" visibility into the same project via their own assigned task.
  await createTask(projectId, { assignedUserId: other.id, state: "to_do" })
  const otherLogin = await login(other.accessIdentifier, other.password)

  const response = await fetch(`${baseUrl}/api/tasks/${taskId}/state`, {
    method: "PATCH",
    headers: { "content-type": "application/json", authorization: `Bearer ${otherLogin.body.data.token}` },
    body: JSON.stringify({ state: "in_process" })
  })

  assert.equal(response.status, 403)
})

test("PATCH /api/tasks/:id/state returns 404 (not 403) for a standard user with no visibility into the task's project", async () => {
  const projectId = await createProject()
  const owner = await createStandardUser()
  const stranger = await createStandardUser()
  const taskId = await createTask(projectId, { assignedUserId: owner.id, state: "to_do" })
  const strangerLogin = await login(stranger.accessIdentifier, stranger.password)

  const response = await fetch(`${baseUrl}/api/tasks/${taskId}/state`, {
    method: "PATCH",
    headers: { "content-type": "application/json", authorization: `Bearer ${strangerLogin.body.data.token}` },
    body: JSON.stringify({ state: "in_process" })
  })

  assert.equal(response.status, 404)
})

test("PATCH /api/tasks/:id/state rejects changing state directly from 'open' without assigning first", async () => {
  const projectId = await createProject()
  const taskId = await createTask(projectId, { state: "open" })

  const response = await fetch(`${baseUrl}/api/tasks/${taskId}/state`, {
    method: "PATCH",
    headers: { "content-type": "application/json", authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({ state: "in_process" })
  })

  assert.equal(response.status, 409)
})

test("PATCH /api/tasks/:id/assign requires a comment to reassign a finished task and records it", async () => {
  const projectId = await createProject()
  const assignee = await createStandardUser()
  const taskId = await createTask(projectId, { assignedUserId: assignee.id, state: "qa" })

  await fetch(`${baseUrl}/api/tasks/${taskId}/state`, {
    method: "PATCH",
    headers: { "content-type": "application/json", authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({ state: "finished" })
  })

  const withoutComment = await fetch(`${baseUrl}/api/tasks/${taskId}/assign`, {
    method: "PATCH",
    headers: { "content-type": "application/json", authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({ assignedUserId: assignee.id })
  })
  assert.equal(withoutComment.status, 400)

  const withComment = await fetch(`${baseUrl}/api/tasks/${taskId}/assign`, {
    method: "PATCH",
    headers: { "content-type": "application/json", authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({ assignedUserId: assignee.id, comment: "Se reabre para ajustes menores" })
  })
  assert.equal(withComment.status, 200)
  const withCommentBody = await withComment.json()
  assert.equal(withCommentBody.data.state, "to_do")

  const comments = await fetch(`${baseUrl}/api/tasks/${taskId}/comments`, {
    headers: { authorization: `Bearer ${adminToken}` }
  })
  const commentsBody = await comments.json()
  assert.ok(
    commentsBody.data.some((comment: { content: string }) => comment.content === "Se reabre para ajustes menores")
  )
})

test("PATCH /api/tasks/:id/unassign requires a comment to reopen a finished task and records it", async () => {
  const projectId = await createProject()
  const assignee = await createStandardUser()
  const taskId = await createTask(projectId, { assignedUserId: assignee.id, state: "testing" })

  await fetch(`${baseUrl}/api/tasks/${taskId}/state`, {
    method: "PATCH",
    headers: { "content-type": "application/json", authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({ state: "finished" })
  })

  const withoutComment = await fetch(`${baseUrl}/api/tasks/${taskId}/unassign`, {
    method: "PATCH",
    headers: { "content-type": "application/json", authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({})
  })
  assert.equal(withoutComment.status, 400)

  const withComment = await fetch(`${baseUrl}/api/tasks/${taskId}/unassign`, {
    method: "PATCH",
    headers: { "content-type": "application/json", authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({ comment: "Se descarta el resultado y se reabre" })
  })
  assert.equal(withComment.status, 200)
  const withCommentBody = await withComment.json()
  assert.equal(withCommentBody.data.state, "open")
  assert.equal(withCommentBody.data.assignedUserId, null)

  const comments = await fetch(`${baseUrl}/api/tasks/${taskId}/comments`, {
    headers: { authorization: `Bearer ${adminToken}` }
  })
  const commentsBody = await comments.json()
  assert.ok(
    commentsBody.data.some(
      (comment: { content: string }) => comment.content === "Se descarta el resultado y se reabre"
    )
  )
})

test("PATCH /api/tasks/:id/unassign without a body does not error when the task is not finished", async () => {
  const projectId = await createProject()
  const assignee = await createStandardUser()
  const taskId = await createTask(projectId, { assignedUserId: assignee.id, state: "to_do" })

  const response = await fetch(`${baseUrl}/api/tasks/${taskId}/unassign`, {
    method: "PATCH",
    headers: { authorization: `Bearer ${adminToken}` }
  })

  assert.equal(response.status, 200)
  const body = await response.json()
  assert.equal(body.data.state, "open")
})

test("DELETE /api/tasks/:id requires a comment, soft-deletes the task and is forbidden for standard users", async () => {
  const projectId = await createProject()
  const standard = await createStandardUser()
  const taskId = await createTask(projectId, { assignedUserId: standard.id, state: "to_do" })
  const standardLogin = await login(standard.accessIdentifier, standard.password)

  const forbidden = await fetch(`${baseUrl}/api/tasks/${taskId}`, {
    method: "DELETE",
    headers: { "content-type": "application/json", authorization: `Bearer ${standardLogin.body.data.token}` },
    body: JSON.stringify({ comment: "Intento no autorizado" })
  })
  assert.equal(forbidden.status, 403)

  const missingComment = await fetch(`${baseUrl}/api/tasks/${taskId}`, {
    method: "DELETE",
    headers: { "content-type": "application/json", authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({})
  })
  assert.equal(missingComment.status, 400)

  const response = await fetch(`${baseUrl}/api/tasks/${taskId}`, {
    method: "DELETE",
    headers: { "content-type": "application/json", authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({ comment: "Eliminada por duplicidad" })
  })
  assert.equal(response.status, 200)

  const getAfterDelete = await fetch(`${baseUrl}/api/tasks/${taskId}`, {
    headers: { authorization: `Bearer ${adminToken}` }
  })
  assert.equal(getAfterDelete.status, 404)
})

test("GET /api/tasks/:id/comments is forbidden (404) for a standard user without visibility", async () => {
  const projectId = await createProject()
  const taskId = await createTask(projectId, { state: "to_do" })
  const standard = await createStandardUser()
  const standardLogin = await login(standard.accessIdentifier, standard.password)

  const response = await fetch(`${baseUrl}/api/tasks/${taskId}/comments`, {
    headers: { authorization: `Bearer ${standardLogin.body.data.token}` }
  })

  assert.equal(response.status, 404)
})

test("POST /api/tasks/:id/comments allows a standard user with project visibility to comment on a non-open task", async () => {
  const projectId = await createProject()
  const standard = await createStandardUser()
  const taskId = await createTask(projectId, { assignedUserId: standard.id, state: "to_do" })
  const standardLogin = await login(standard.accessIdentifier, standard.password)

  const response = await fetch(`${baseUrl}/api/tasks/${taskId}/comments`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${standardLogin.body.data.token}` },
    body: JSON.stringify({ content: "Comentario de usuario asignado" })
  })

  assert.equal(response.status, 201)
  const body = await response.json()
  assert.equal(body.data.content, "Comentario de usuario asignado")
  assert.equal(body.data.authorName, "Standard Task User")
})

test("POST /api/tasks/:id/comments rejects empty content", async () => {
  const projectId = await createProject()
  const taskId = await createTask(projectId, { state: "to_do" })

  const response = await fetch(`${baseUrl}/api/tasks/${taskId}/comments`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({ content: "   " })
  })

  assert.equal(response.status, 400)
})
