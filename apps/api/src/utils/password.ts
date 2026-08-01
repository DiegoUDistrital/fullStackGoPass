import crypto from "node:crypto"

const ITERATIONS = 120_000
const KEY_LENGTH = 64
const DIGEST = "sha512"

export function hashPassword(plainPassword: string): string {
  const salt = crypto.randomBytes(16).toString("hex")
  const hash = crypto.pbkdf2Sync(plainPassword, salt, ITERATIONS, KEY_LENGTH, DIGEST).toString("hex")
  return `${ITERATIONS}:${salt}:${hash}`
}

export function verifyPassword(plainPassword: string, storedHash: string): boolean {
  const [iterationsPart, salt, hash] = storedHash.split(":")
  const iterations = Number(iterationsPart)
  if (!salt || !hash || Number.isNaN(iterations)) {
    return false
  }

  const computed = crypto.pbkdf2Sync(plainPassword, salt, iterations, KEY_LENGTH, DIGEST).toString("hex")
  return crypto.timingSafeEqual(Buffer.from(computed, "hex"), Buffer.from(hash, "hex"))
}
