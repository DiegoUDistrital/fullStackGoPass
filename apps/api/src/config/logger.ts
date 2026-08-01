import pino from "pino"
import { env } from "./env"

export const logger = pino({
  name: env.appName,
  level: env.nodeEnv === "production" ? "info" : "debug"
})
