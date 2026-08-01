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

test.before(async () => {
  await sequelize.authenticate()

  const app = createApp()
  const server = app.listen(0)
  await new Promise<void>((resolve) => server.once("listening", resolve))
  const { port } = server.address() as AddressInfo
  baseUrl = `http://127.0.0.1:${port}`
  close = () => new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())))
})

test.after(async () => {
  await UserModel.destroy({ where: { id: createdUserIds }, force: true })
  await close()
  await sequelize.close()
})

test("POST /api/auth/login authenticates the seeded administrator", async () => {
  const response = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ accessIdentifier: "admin", password: "admin1234" })
  })

  assert.equal(response.status, 200)
  const body = await response.json()
  assert.ok(body.data.token)
  assert.equal(body.data.user.accessIdentifier, "admin")
  assert.equal(body.data.user.role, "admin")
  assert.equal(body.data.user.state, "active")
  assert.equal(body.data.user.passwordHash, undefined)
})

test("POST /api/auth/login rejects an unknown accessIdentifier", async () => {
  const response = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ accessIdentifier: "does-not-exist", password: "whatever" })
  })

  assert.equal(response.status, 401)
  const body = await response.json()
  assert.equal(body.error.message, "Credenciales inválidas")
})

test("POST /api/auth/login rejects a wrong password", async () => {
  const response = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ accessIdentifier: "admin", password: "wrong-password" })
  })

  assert.equal(response.status, 401)
  const body = await response.json()
  assert.equal(body.error.message, "Credenciales inválidas")
})

test("POST /api/auth/login rejects missing fields", async () => {
  const response = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ accessIdentifier: "admin" })
  })

  assert.equal(response.status, 400)
})

test("POST /api/auth/login rejects an inactive user with correct credentials", async () => {
  const id = crypto.randomUUID()
  await userRepository.create({
    id,
    accessIdentifier: `it-inactive-${id}`,
    name: "Inactive Integration User",
    professionalProfile: "QA",
    passwordHash: hashPassword("Inactive1!"),
    role: "user",
    state: "inactive"
  })
  createdUserIds.push(id)

  const response = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ accessIdentifier: `it-inactive-${id}`, password: "Inactive1!" })
  })

  assert.equal(response.status, 403)
  const body = await response.json()
  assert.equal(body.error.message, "Usuario inactivo")
})

test("GET /api/auth/me rejects requests without a token", async () => {
  const response = await fetch(`${baseUrl}/api/auth/me`)
  assert.equal(response.status, 401)
})

test("GET /api/auth/me rejects an invalid token", async () => {
  const response = await fetch(`${baseUrl}/api/auth/me`, {
    headers: { authorization: "Bearer not-a-real-token" }
  })
  assert.equal(response.status, 401)
})

test("GET /api/auth/me returns the authenticated user for a valid token", async () => {
  const login = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ accessIdentifier: "admin", password: "admin1234" })
  })
  const { data } = await login.json()

  const response = await fetch(`${baseUrl}/api/auth/me`, {
    headers: { authorization: `Bearer ${data.token}` }
  })

  assert.equal(response.status, 200)
  const body = await response.json()
  assert.equal(body.data.user.accessIdentifier, "admin")
})

test("GET /api/auth/me rejects a token whose user was deactivated afterwards", async () => {
  const id = crypto.randomUUID()
  const accessIdentifier = `it-deactivated-${id}`
  await userRepository.create({
    id,
    accessIdentifier,
    name: "Soon Inactive User",
    professionalProfile: "QA",
    passwordHash: hashPassword("Active1!"),
    role: "user",
    state: "active"
  })
  createdUserIds.push(id)

  const login = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ accessIdentifier, password: "Active1!" })
  })
  const { data } = await login.json()
  assert.equal(login.status, 200)

  await userRepository.updateById(id, { state: "inactive" })

  const response = await fetch(`${baseUrl}/api/auth/me`, {
    headers: { authorization: `Bearer ${data.token}` }
  })

  assert.equal(response.status, 403)
})
