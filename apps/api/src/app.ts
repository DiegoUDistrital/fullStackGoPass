import express from "express"
import { errorMiddleware } from "./middlewares/error.middleware"
import { notFoundMiddleware } from "./middlewares/not-found.middleware"
import { authRouter } from "./routes/auth.route"
import { healthRouter } from "./routes/health.route"
import { userRouter } from "./routes/user.route"

export function createApp() {
  const app = express()

  app.use(express.json())
  app.use("/api", healthRouter)
  app.use("/api", authRouter)
  app.use("/api", userRouter)
  app.use(notFoundMiddleware)
  app.use(errorMiddleware)

  return app
}
