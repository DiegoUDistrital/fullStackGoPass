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
  const accessIdentifier = `it-dash-user-${id}`
  const password = "St4ndardPass!"
  await userRepository.create({
    id,
    accessIdentifier,
    name: "Dashboard Test User",
    professionalProfile: "Developer",
    passwordHash: hashPassword(password),
    role: "user",
    state: "active"
  })
  createdUserIds.push(id)
  return { id, accessIdentifier, password }
}

async function createProject(state: "planned" | "active" | "on_hold" | "completed" | "archived" = "active") {
  const id = crypto.randomUUID()
  await projectRepository.create({
    id,
    name: `Dashboard Test Project ${id}`,
    description: "Created by integration test",
    responsibleAdminId: adminId,
    eta: new Date("2026-12-31T00:00:00.000Z"),
    state
  })
  createdProjectIds.push(id)
  return id
}

async function createTask(
  projectId: string,
  overrides: Partial<{
    assignedUserId: string | null
    state: "open" | "to_do" | "in_process" | "testing" | "qa" | "finished" | "on_hold"
    dueDate: Date
  }> = {}
) {
  const id = crypto.randomUUID()
  await taskRepository.create({
    id,
    projectId,
    assignedUserId: overrides.assignedUserId ?? null,
    title: `Dashboard Test Task ${id}`,
    description: "Created by integration test",
    priority: "medium",
    state: overrides.state ?? "open",
    dueDate: overrides.dueDate ?? new Date("2026-08-01T00:00:00.000Z")
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

test("GET /api/dashboard requires authentication", async () => {
  const response = await fetch(`${baseUrl}/api/dashboard`)
  assert.equal(response.status, 401)
})

test("GET /api/dashboard is forbidden for a standard user", async () => {
  const standard = await createStandardUser()
  const standardLogin = await login(standard.accessIdentifier, standard.password)

  const response = await fetch(`${baseUrl}/api/dashboard`, {
    headers: { authorization: `Bearer ${standardLogin.body.data.token}` }
  })

  assert.equal(response.status, 403)
})

test("GET /api/dashboard reports active projects count including our active project", async () => {
  await createProject("active")

  const response = await fetch(`${baseUrl}/api/dashboard`, {
    headers: { authorization: `Bearer ${adminToken}` }
  })

  assert.equal(response.status, 200)
  const body = await response.json()
  assert.ok(body.data.activeProjectsCount >= 1)
})

test("GET /api/dashboard computes per-project progress from finished vs total tasks", async () => {
  const projectId = await createProject("active")
  await createTask(projectId, { state: "finished" })
  await createTask(projectId, { state: "in_process" })

  const response = await fetch(`${baseUrl}/api/dashboard`, {
    headers: { authorization: `Bearer ${adminToken}` }
  })

  const body = await response.json()
  const progress = body.data.projectsProgress.find((entry: { projectId: string }) => entry.projectId === projectId)

  assert.ok(progress)
  assert.equal(progress.totalTasks, 2)
  assert.equal(progress.finishedTasks, 1)
  assert.equal(progress.progressPercentage, 50)
})

test("GET /api/dashboard reports a project with no tasks as 0% progress", async () => {
  const projectId = await createProject("planned")

  const response = await fetch(`${baseUrl}/api/dashboard`, {
    headers: { authorization: `Bearer ${adminToken}` }
  })

  const body = await response.json()
  const progress = body.data.projectsProgress.find((entry: { projectId: string }) => entry.projectId === projectId)

  assert.ok(progress)
  assert.equal(progress.totalTasks, 0)
  assert.equal(progress.progressPercentage, 0)
})

test("GET /api/dashboard task state distribution counts our created tasks per state", async () => {
  const projectId = await createProject()
  await createTask(projectId, { state: "open" })
  await createTask(projectId, { state: "qa" })
  await createTask(projectId, { state: "qa" })

  const before = await fetch(`${baseUrl}/api/dashboard`, { headers: { authorization: `Bearer ${adminToken}` } })
  const beforeBody = await before.json()

  assert.ok(beforeBody.data.taskStateDistribution.open >= 1)
  assert.ok(beforeBody.data.taskStateDistribution.qa >= 2)
})

test("GET /api/dashboard user workload counts only pending (non-finished) tasks for a specific user", async () => {
  const projectId = await createProject()
  const assignee = await createStandardUser()
  await createTask(projectId, { assignedUserId: assignee.id, state: "to_do" })
  await createTask(projectId, { assignedUserId: assignee.id, state: "in_process" })
  await createTask(projectId, { assignedUserId: assignee.id, state: "finished" })

  const response = await fetch(`${baseUrl}/api/dashboard`, {
    headers: { authorization: `Bearer ${adminToken}` }
  })
  const body = await response.json()

  const workload = body.data.userWorkload.find((entry: { userId: string }) => entry.userId === assignee.id)
  assert.ok(workload)
  assert.equal(workload.userName, "Dashboard Test User")
  assert.equal(workload.pendingTaskCount, 2)
})

test("GET /api/dashboard excludes a user from workload when their only tasks are finished", async () => {
  const projectId = await createProject()
  const assignee = await createStandardUser()
  await createTask(projectId, { assignedUserId: assignee.id, state: "finished" })

  const response = await fetch(`${baseUrl}/api/dashboard`, {
    headers: { authorization: `Bearer ${adminToken}` }
  })
  const body = await response.json()

  assert.ok(!body.data.userWorkload.some((entry: { userId: string }) => entry.userId === assignee.id))
})

test("GET /api/dashboard lists a non-finished task due within 7 days as upcoming", async () => {
  const projectId = await createProject()
  const soon = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
  const taskId = await createTask(projectId, { state: "to_do", dueDate: soon })

  const response = await fetch(`${baseUrl}/api/dashboard`, {
    headers: { authorization: `Bearer ${adminToken}` }
  })
  const body = await response.json()

  assert.ok(body.data.upcomingDueTasks.some((task: { id: string }) => task.id === taskId))
  assert.ok(!body.data.overdueTasks.some((task: { id: string }) => task.id === taskId))
})

test("GET /api/dashboard lists a non-finished task with a past due date as overdue", async () => {
  const projectId = await createProject()
  const past = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
  const taskId = await createTask(projectId, { state: "in_process", dueDate: past })

  const response = await fetch(`${baseUrl}/api/dashboard`, {
    headers: { authorization: `Bearer ${adminToken}` }
  })
  const body = await response.json()

  assert.ok(body.data.overdueTasks.some((task: { id: string }) => task.id === taskId))
  assert.ok(!body.data.upcomingDueTasks.some((task: { id: string }) => task.id === taskId))
})

test("GET /api/dashboard excludes a finished task with a past due date from overdue", async () => {
  const projectId = await createProject()
  const past = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
  const taskId = await createTask(projectId, { state: "finished", dueDate: past })

  const response = await fetch(`${baseUrl}/api/dashboard`, {
    headers: { authorization: `Bearer ${adminToken}` }
  })
  const body = await response.json()

  assert.ok(!body.data.overdueTasks.some((task: { id: string }) => task.id === taskId))
})
