const DEFAULT_PORT = 3001

function toNumber(value: string | undefined, fallback: number): number {
  if (!value) {
    return fallback
  }

  const parsed = Number(value)
  return Number.isNaN(parsed) ? fallback : parsed
}

export const env = {
  appName: process.env.APP_NAME ?? "fullstack-gopass-api",
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: toNumber(process.env.PORT, DEFAULT_PORT),
  jwtSecret: process.env.JWT_SECRET ?? "change-this-secret",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "12h"
}
