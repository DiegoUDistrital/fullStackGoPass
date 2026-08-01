import test from "node:test"
import assert from "node:assert/strict"
import crypto from "node:crypto"
import { sequelize } from "../src/database/sequelize"
import { CommentModel, ProjectModel, TaskModel, UserModel } from "../src/models"
import { CommentRepository } from "../src/repositories/comment.repository"
import { ProjectRepository } from "../src/repositories/project.repository"
import { TaskRepository } from "../src/repositories/task.repository"
import { UserRepository } from "../src/repositories/user.repository"
import { hashPassword, verifyPassword } from "../src/utils/password"

const userRepository = new UserRepository()
const projectRepository = new ProjectRepository()
const taskRepository = new TaskRepository()
const commentRepository = new CommentRepository()

const createdCommentIds: string[] = []
const createdTaskIds: string[] = []
const createdProjectIds: string[] = []
const createdUserIds: string[] = []

test.before(async () => {
  await sequelize.authenticate()
})

test.after(async () => {
  await CommentModel.destroy({ where: { id: createdCommentIds }, force: true })
  await TaskModel.destroy({ where: { id: createdTaskIds }, force: true })
  await ProjectModel.destroy({ where: { id: createdProjectIds }, force: true })
  await UserModel.destroy({ where: { id: createdUserIds }, force: true })
  await sequelize.close()
})

test("all SQL migrations have been applied to PostgreSQL", async () => {
  const [rows] = await sequelize.query("SELECT name FROM schema_migrations ORDER BY name")
  const names = (rows as Array<{ name: string }>).map((row) => row.name)

  assert.deepEqual(names, [
    "001_create_users.sql",
    "002_create_projects.sql",
    "003_create_tasks.sql",
    "004_create_comments.sql",
    "005_add_performance_indexes.sql"
  ])
})

test("initial admin seed is present and active", async () => {
  const admin = await userRepository.findByAccessIdentifier("admin")

  assert.ok(admin)
  assert.equal(admin?.role, "admin")
  assert.equal(admin?.state, "active")
})

test("UserRepository persists, authenticates and updates a user against PostgreSQL", async () => {
  const id = crypto.randomUUID()
  const accessIdentifier = `it-user-${id}`
  const passwordHash = hashPassword("Str0ngPass!")

  const created = await userRepository.create({
    id,
    accessIdentifier,
    name: "Integration User",
    professionalProfile: "QA Engineer",
    passwordHash,
    role: "user",
    state: "active"
  })
  createdUserIds.push(id)
  assert.equal(created.id, id)

  const found = await userRepository.findById(id)
  assert.ok(found)
  assert.equal(found?.accessIdentifier, accessIdentifier)

  const byIdentifier = await userRepository.findByAccessIdentifier(accessIdentifier)
  assert.ok(byIdentifier)
  assert.ok(verifyPassword("Str0ngPass!", byIdentifier!.passwordHash))
  assert.equal(verifyPassword("wrong-password", byIdentifier!.passwordHash), false)

  const updated = await userRepository.updateById(id, { state: "inactive" })
  assert.equal(updated?.state, "inactive")

  const users = await userRepository.list()
  assert.ok(users.some((user) => user.id === id))
})

test("ProjectRepository persists, updates and soft-deletes a project against PostgreSQL", async () => {
  const adminId = crypto.randomUUID()
  await userRepository.create({
    id: adminId,
    accessIdentifier: `it-admin-${adminId}`,
    name: "Integration Admin",
    professionalProfile: "Project Manager",
    passwordHash: hashPassword("Adm1nPass!"),
    role: "admin",
    state: "active"
  })
  createdUserIds.push(adminId)

  const projectId = crypto.randomUUID()
  await projectRepository.create({
    id: projectId,
    name: "Integration Project",
    description: "Created by integration test",
    responsibleAdminId: adminId,
    eta: new Date("2026-12-31T00:00:00.000Z"),
    state: "planned"
  })
  createdProjectIds.push(projectId)

  const found = await projectRepository.findById(projectId)
  assert.ok(found)
  assert.equal(found?.state, "planned")

  const activeBefore = await projectRepository.listActive()
  assert.ok(activeBefore.some((project) => project.id === projectId))

  const archived = await projectRepository.updateById(projectId, {
    state: "archived",
    archivedAt: new Date()
  })
  assert.equal(archived?.state, "archived")

  const deleted = await projectRepository.softDeleteById(projectId)
  assert.ok(deleted)

  const afterDelete = await projectRepository.findById(projectId)
  assert.equal(afterDelete, null)

  const activeAfter = await projectRepository.listActive()
  assert.ok(!activeAfter.some((project) => project.id === projectId))
})

test("TaskRepository persists tasks scoped to a project and supports soft-delete", async () => {
  const adminId = crypto.randomUUID()
  await userRepository.create({
    id: adminId,
    accessIdentifier: `it-admin-task-${adminId}`,
    name: "Integration Admin",
    professionalProfile: "Project Manager",
    passwordHash: hashPassword("Adm1nPass!"),
    role: "admin",
    state: "active"
  })
  createdUserIds.push(adminId)

  const projectId = crypto.randomUUID()
  await projectRepository.create({
    id: projectId,
    name: "Task Integration Project",
    description: "Created by integration test",
    responsibleAdminId: adminId,
    eta: new Date("2026-06-01T00:00:00.000Z"),
    state: "active"
  })
  createdProjectIds.push(projectId)

  const assigneeId = crypto.randomUUID()
  await userRepository.create({
    id: assigneeId,
    accessIdentifier: `it-user-task-${assigneeId}`,
    name: "Integration Assignee",
    professionalProfile: "Developer",
    passwordHash: hashPassword("Us3rPass!"),
    role: "user",
    state: "active"
  })
  createdUserIds.push(assigneeId)

  const taskId = crypto.randomUUID()
  await taskRepository.create({
    id: taskId,
    projectId,
    assignedUserId: null,
    title: "Integration Task",
    description: "Created by integration test",
    priority: "medium",
    state: "open",
    dueDate: new Date("2026-07-01T00:00:00.000Z")
  })
  createdTaskIds.push(taskId)

  const listed = await taskRepository.listByProject(projectId)
  assert.ok(listed.some((task) => task.id === taskId))

  const assigned = await taskRepository.updateById(taskId, {
    assignedUserId: assigneeId,
    state: "to_do"
  })
  assert.equal(assigned?.state, "to_do")
  assert.equal(assigned?.assignedUserId, assigneeId)

  const softDeleted = await taskRepository.softDeleteById(taskId)
  assert.ok(softDeleted)

  const afterDelete = await taskRepository.findById(taskId)
  assert.equal(afterDelete, null)
})

test("CommentRepository stores comments for projects and tasks with author reference", async () => {
  const adminId = crypto.randomUUID()
  await userRepository.create({
    id: adminId,
    accessIdentifier: `it-admin-comment-${adminId}`,
    name: "Integration Admin",
    professionalProfile: "Project Manager",
    passwordHash: hashPassword("Adm1nPass!"),
    role: "admin",
    state: "active"
  })
  createdUserIds.push(adminId)

  const projectId = crypto.randomUUID()
  await projectRepository.create({
    id: projectId,
    name: "Comment Integration Project",
    description: "Created by integration test",
    responsibleAdminId: adminId,
    eta: new Date("2026-05-01T00:00:00.000Z"),
    state: "active"
  })
  createdProjectIds.push(projectId)

  const taskId = crypto.randomUUID()
  await taskRepository.create({
    id: taskId,
    projectId,
    assignedUserId: null,
    title: "Comment Integration Task",
    description: "Created by integration test",
    priority: "low",
    state: "open",
    dueDate: new Date("2026-05-15T00:00:00.000Z")
  })
  createdTaskIds.push(taskId)

  const projectCommentId = crypto.randomUUID()
  await commentRepository.createForProject({
    id: projectCommentId,
    projectId,
    authorUserId: adminId,
    content: "Comentario obligatorio de proyecto"
  })
  createdCommentIds.push(projectCommentId)

  const taskCommentId = crypto.randomUUID()
  await commentRepository.createForTask({
    id: taskCommentId,
    taskId,
    authorUserId: adminId,
    content: "Comentario obligatorio de tarea"
  })
  createdCommentIds.push(taskCommentId)

  const projectComments = await commentRepository.listByProject(projectId)
  assert.ok(projectComments.some((comment) => comment.id === projectCommentId && comment.taskId === null))

  const taskComments = await commentRepository.listByTask(taskId)
  assert.ok(taskComments.some((comment) => comment.id === taskCommentId && comment.projectId === null))
})
