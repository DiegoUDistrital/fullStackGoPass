import test from "node:test"
import assert from "node:assert/strict"
import type { AddressInfo } from "node:net"
import { createApp } from "../src/app"
import { sequelize } from "../src/database/sequelize"

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
  await close()
  await sequelize.close()
})

test("malformed JSON body returns 400, not 500", async () => {
  const response = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: "{not valid json"
  })

  assert.equal(response.status, 400)
  const body = await response.json()
  assert.equal(body.error.message, "El cuerpo de la solicitud no es un JSON válido")
})

test("unknown route returns a Spanish 'not found' message", async () => {
  const response = await fetch(`${baseUrl}/api/does-not-exist`)

  assert.equal(response.status, 404)
  const body = await response.json()
  assert.equal(body.error.message, "Recurso no encontrado")
})
