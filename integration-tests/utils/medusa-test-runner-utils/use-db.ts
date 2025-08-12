import type { MedusaAppLoader } from "@medusajs/framework"
import { Logger, MedusaContainer } from "@medusajs/framework/types"
import { logger } from "@medusajs/framework/logger"
import {
  ContainerRegistrationKeys,
  getResolvedPlugins,
} from "@medusajs/framework/utils"
import { join } from "path"

/**
 * Initiates the database connection
 */
export async function initDb() {
  const { pgConnectionLoader, featureFlagsLoader } = await import(
    "@medusajs/framework"
  )

  const pgConnection = await pgConnectionLoader()
  await featureFlagsLoader()

  return pgConnection
}

/**
 * Migrates the database
 */
export async function migrateDatabase(appLoader: MedusaAppLoader) {
  try {
    await appLoader.runModulesMigrations()
  } catch (err) {
    logger.error("Something went wrong while running the migrations")
    throw err
  }
}

/**
 * Syncs links with the databse
 */
export async function syncLinks(
  appLoader: MedusaAppLoader,
  directory: string,
  container: MedusaContainer,
  logger: Logger
) {
  try {
    await loadCustomLinks(directory, container)

    const planner = await appLoader.getLinksExecutionPlanner()
    const actionPlan = await planner.createPlan()
    actionPlan.forEach((action) => {
      logger.info(`Sync links: "${action.action}" ${action.tableName}`)
    })
    await planner.executePlan(actionPlan)
  } catch (err) {
    logger.error("Something went wrong while syncing links")
    throw err
  }
}

async function loadCustomLinks(directory: string, container: MedusaContainer) {
  const configModule = container.resolve(
    ContainerRegistrationKeys.CONFIG_MODULE
  )
  const plugins = await getResolvedPlugins(directory, configModule, true)
  const linksSourcePaths = plugins.map((plugin) =>
    join(plugin.resolve, "links")
  )

  const { LinkLoader } = await import("@medusajs/framework")
  await new LinkLoader(linksSourcePaths).load()
}
