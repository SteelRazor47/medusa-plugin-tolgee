import express from "express"
import getPort from "get-port"
import { resolve } from "path"
import { MedusaContainer } from "@medusajs/framework/types"
import { applyEnvVarsToProcess, execOrTimeout } from "./utils"
import { promiseAll, GracefulShutdownServer } from "@medusajs/framework/utils"
import { logger } from "@medusajs/framework/logger"

async function bootstrapApp({
  cwd,
  env = {},
}: { cwd?: string; env?: Record<any, any> } = {}) {
  const app = express()
  applyEnvVarsToProcess(env)

  const loaders = require("@medusajs/medusa/loaders/index").default

  try {
    const { container, shutdown } = await loaders({
      directory: resolve(cwd || process.cwd()),
      expressApp: app,
    })

    const PORT = process.env.PORT ? parseInt(process.env.PORT) : await getPort()

    return {
      shutdown,
      container,
      app,
      port: PORT,
    }
  } catch (error) {
    logger.error("Error bootstrapping app:", error)
    throw error
  }
}

export async function startApp({
  cwd,
  env = {},
}: { cwd?: string; env?: Record<any, any> } = {}): Promise<{
  shutdown: () => Promise<void>
  container: MedusaContainer
  port: number
}> {
  let expressServer: any
  let medusaShutdown: () => Promise<void> = async () => void 0
  let container: MedusaContainer

  try {
    const {
      app,
      port,
      container: appContainer,
      shutdown: appShutdown,
    } = await bootstrapApp({
      cwd,
      env,
    })

    container = appContainer
    medusaShutdown = appShutdown

    const shutdown = async () => {
      try {
        const shutdownPromise = promiseAll([
          expressServer?.shutdown(),
          medusaShutdown(),
        ])

        await execOrTimeout(shutdownPromise)

        if (typeof global !== "undefined" && global?.gc) {
          global.gc()
        }
      } catch (error) {
        logger.error("Error during shutdown:", error)
        try {
          await expressServer?.shutdown()
          await medusaShutdown()
        } catch (cleanupError) {
          logger.error("Error during forced cleanup:", cleanupError)
        }
        throw error
      }
    }

    return await new Promise((resolve, reject) => {
      const server = app
        .listen(port)
        .on("error", async (err) => {
          logger.error("Error starting server:", err)
          await shutdown()
          return reject(err)
        })
        .on("listening", () => {
          process.send?.(port)

          resolve({
            shutdown,
            container,
            port,
          })
        })

      expressServer = GracefulShutdownServer.create(server)
    })
  } catch (error) {
    logger.error("Error in startApp:", error)
    if (expressServer) {
      try {
        await expressServer.shutdown()
      } catch (cleanupError) {
        logger.error("Error cleaning up express server:", cleanupError)
      }
    }
    if (medusaShutdown) {
      try {
        await medusaShutdown()
      } catch (cleanupError) {
        logger.error("Error cleaning up medusa:", cleanupError)
      }
    }
    throw error
  }
}
