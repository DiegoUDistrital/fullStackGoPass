import fs from "node:fs/promises"
import path from "node:path"
import { Client } from "pg"

const migrationsDir = path.join(process.cwd(), "migrations")
const databaseUrl =
  process.env.DATABASE_URL ?? "postgres://postgres:postgres@localhost:5432/fullstack_gopass"

async function ensureMigrationsTable(client: Client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name VARCHAR(255) PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `)
}

async function readMigrations(): Promise<string[]> {
  const entries = await fs.readdir(migrationsDir)
  return entries.filter((entry) => entry.endsWith(".sql")).sort()
}

async function run() {
  const client = new Client({ connectionString: databaseUrl })
  await client.connect()
  let transactionOpen = false

  try {
    await ensureMigrationsTable(client)
    const files = await readMigrations()

    for (const file of files) {
      const alreadyApplied = await client.query("SELECT 1 FROM schema_migrations WHERE name = $1", [file])
      if (alreadyApplied.rowCount && alreadyApplied.rowCount > 0) {
        continue
      }

      const sql = await fs.readFile(path.join(migrationsDir, file), "utf8")

      await client.query("BEGIN")
      transactionOpen = true
      await client.query(sql)
      await client.query("INSERT INTO schema_migrations (name) VALUES ($1)", [file])
      await client.query("COMMIT")
      transactionOpen = false
    }
  } catch (error) {
    if (transactionOpen) {
      await client.query("ROLLBACK")
    }
    throw error
  } finally {
    await client.end()
  }
}

run().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Unknown migration error"
  process.stderr.write(`${message}\n`)
  process.exit(1)
})
