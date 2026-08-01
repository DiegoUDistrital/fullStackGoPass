import crypto from "node:crypto"
import { Client } from "pg"
import { hashPassword } from "../src/utils/password"

const databaseUrl =
  process.env.DATABASE_URL ?? "postgres://postgres:postgres@localhost:5432/fullstack_gopass"

const adminConfig = {
  accessIdentifier: process.env.ADMIN_ACCESS_IDENTIFIER ?? "admin",
  name: process.env.ADMIN_NAME ?? "Administrador Inicial",
  professionalProfile: process.env.ADMIN_PROFILE ?? "Administrador",
  password: process.env.ADMIN_PASSWORD ?? "admin1234"
}

async function run() {
  const client = new Client({ connectionString: databaseUrl })
  await client.connect()

  try {
    const existing = await client.query("SELECT id FROM users WHERE access_identifier = $1", [
      adminConfig.accessIdentifier
    ])

    if (existing.rowCount && existing.rowCount > 0) {
      return
    }

    await client.query(
      `
      INSERT INTO users (
        id, access_identifier, name, professional_profile, password_hash, role, state
      ) VALUES ($1, $2, $3, $4, $5, 'admin', 'active')
      `,
      [
        crypto.randomUUID(),
        adminConfig.accessIdentifier,
        adminConfig.name,
        adminConfig.professionalProfile,
        hashPassword(adminConfig.password)
      ]
    )
  } finally {
    await client.end()
  }
}

run().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Unknown seed error"
  process.stderr.write(`${message}\n`)
  process.exit(1)
})
