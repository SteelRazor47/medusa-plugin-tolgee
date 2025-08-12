import {
  defineConfig,
  MikroORM,
  Options,
  SqlEntityManager,
} from "@mikro-orm/postgresql"
import { createDatabase, dropDatabase } from "pg-god"
import { logger } from "@medusajs/framework/logger"
import { execOrTimeout } from "./medusa-test-runner-utils"

const DB_HOST = process.env.DB_HOST ?? "localhost"
const DB_USERNAME = process.env.DB_USERNAME ?? ""
const DB_PASSWORD = process.env.DB_PASSWORD ?? ""

const pgGodCredentials = {
  user: DB_USERNAME,
  password: DB_PASSWORD,
  host: DB_HOST,
}

export function getDatabaseURL(dbName?: string): string {
  const DB_HOST = process.env.DB_HOST ?? "localhost"
  const DB_USERNAME = process.env.DB_USERNAME ?? "postgres"
  const DB_PASSWORD = process.env.DB_PASSWORD ?? ""
  const DB_NAME = dbName ?? process.env.DB_TEMP_NAME

  return `postgres://${DB_USERNAME}${
    DB_PASSWORD ? `:${DB_PASSWORD}` : ""
  }@${DB_HOST}/${DB_NAME}`
}

export function getMikroOrmConfig({
  mikroOrmEntities,
  pathToMigrations,
  clientUrl,
  schema,
}: {
  mikroOrmEntities: any[]
  pathToMigrations?: string
  clientUrl?: string
  schema?: string
}): Options {
  const DB_URL = clientUrl ?? getDatabaseURL()

  return defineConfig({
    clientUrl: DB_URL,
    entities: Object.values(mikroOrmEntities),
    schema: schema ?? process.env.MEDUSA_DB_SCHEMA,
    debug: false,
    pool: {
      min: 2,
    },
    migrations: {
      pathTs: pathToMigrations,
      silent: true,
    },
  })
}

export interface TestDatabase {
  mikroOrmEntities: any[]
  pathToMigrations?: string
  schema?: string
  clientUrl?: string

  orm: MikroORM | null
  manager: SqlEntityManager | null

  setupDatabase(): Promise<void>
  clearDatabase(): Promise<void>
  getManager(): SqlEntityManager
  forkManager(): SqlEntityManager
  getOrm(): MikroORM
}

export function getMikroOrmWrapper({
  mikroOrmEntities,
  pathToMigrations,
  clientUrl,
  schema,
}: {
  mikroOrmEntities: any[]
  pathToMigrations?: string
  clientUrl?: string
  schema?: string
}): TestDatabase {
  return {
    mikroOrmEntities,
    pathToMigrations,
    clientUrl: clientUrl ?? getDatabaseURL(),
    schema: schema ?? process.env.MEDUSA_DB_SCHEMA,

    orm: null,
    manager: null,

    getManager() {
      if (this.manager === null) {
        throw new Error("manager entity not available")
      }

      return this.manager
    },

    forkManager() {
      if (this.manager === null) {
        throw new Error("manager entity not available")
      }

      return this.manager.fork()
    },

    getOrm() {
      if (this.orm === null) {
        throw new Error("orm entity not available")
      }

      return this.orm
    },

    async setupDatabase() {
      const OrmConfig = getMikroOrmConfig({
        mikroOrmEntities: this.mikroOrmEntities,
        pathToMigrations: this.pathToMigrations,
        clientUrl: this.clientUrl,
        schema: this.schema,
      })

      try {
        this.orm = await MikroORM.init(OrmConfig)
        this.manager = this.orm.em

        try {
          await this.orm.getSchemaGenerator().ensureDatabase()
        } catch (err) {
          logger.error("Error ensuring database:", err)
          throw err
        }

        await this.manager?.execute(
          `CREATE SCHEMA IF NOT EXISTS "${this.schema ?? "public"}";`
        )

        const pendingMigrations = await this.orm
          .getMigrator()
          .getPendingMigrations()

        if (pendingMigrations && pendingMigrations.length > 0) {
          await this.orm
            .getMigrator()
            .up({ migrations: pendingMigrations.map((m) => m.name!) })
        } else {
          await this.orm.schema.refreshDatabase()
        }
      } catch (error) {
        if (this.orm) {
          try {
            await this.orm.close()
          } catch (closeError) {
            logger.error("Error closing ORM:", closeError)
          }
        }
        this.orm = null
        this.manager = null
        throw error
      }
    },

    async clearDatabase() {
      if (this.orm === null) {
        throw new Error("ORM not configured")
      }

      try {
        await this.manager?.execute(
          `DROP SCHEMA IF EXISTS "${this.schema ?? "public"}" CASCADE;`
        )

        await this.manager?.execute(
          `CREATE SCHEMA IF NOT EXISTS "${this.schema ?? "public"}";`
        )

        const closePromise = this.orm.close()

        await execOrTimeout(closePromise)
      } catch (error) {
        logger.error("Error clearing database:", error)
        try {
          await this.orm?.close()
        } catch (closeError) {
          logger.error("Error during forced ORM close:", closeError)
        }
        throw error
      } finally {
        this.orm = null
        this.manager = null
      }
    },
  }
}

export const dbTestUtilFactory = (): any => ({
  pgConnection_: null,

  create: async function (dbName: string) {
    try {
      await createDatabase(
        { databaseName: dbName, errorIfExist: false },
        pgGodCredentials
      )
    } catch (error) {
      logger.error("Error creating database:", error)
      throw error
    }
  },

  teardown: async function ({ schema }: { schema?: string } = {}) {
    if (!this.pgConnection_) {
      return
    }

    try {
      const runRawQuery = this.pgConnection_.raw.bind(this.pgConnection_)
      schema ??= "public"

      await runRawQuery(`SET session_replication_role = 'replica';`)
      const { rows: tableNames } = await runRawQuery(`SELECT table_name
                                              FROM information_schema.tables
                                              WHERE table_schema = '${schema}';`)

      const skipIndexPartitionPrefix = "cat_"
      const mainPartitionTables = ["index_data", "index_relation"]
      let hasIndexTables = false

      for (const { table_name } of tableNames) {
        if (mainPartitionTables.includes(table_name)) {
          hasIndexTables = true
        }

        if (
          table_name.startsWith(skipIndexPartitionPrefix) ||
          mainPartitionTables.includes(table_name)
        ) {
          continue
        }

        await runRawQuery(`DELETE FROM ${schema}."${table_name}";`)
      }

      if (hasIndexTables) {
        await runRawQuery(`TRUNCATE TABLE ${schema}.index_data;`)
        await runRawQuery(`TRUNCATE TABLE ${schema}.index_relation;`)
      }

      await runRawQuery(`SET session_replication_role = 'origin';`)
    } catch (error) {
      logger.error("Error during database teardown:", error)
      throw error
    }
  },

  shutdown: async function (dbName: string) {
    try {
      const cleanupPromises: Promise<any>[] = []

      if (this.pgConnection_?.context) {
        cleanupPromises.push(
          execOrTimeout(this.pgConnection_.context.destroy())
        )
      }

      if (this.pgConnection_) {
        cleanupPromises.push(execOrTimeout(this.pgConnection_.destroy()))
      }

      await Promise.all(cleanupPromises)

      return await dropDatabase(
        { databaseName: dbName, errorIfNonExist: false },
        pgGodCredentials
      )
    } catch (error) {
      logger.error("Error during database shutdown:", error)
      try {
        await this.pgConnection_?.context?.destroy()
        await this.pgConnection_?.destroy()
      } catch (cleanupError) {
        logger.error("Error during forced cleanup:", cleanupError)
      }
      throw error
    } finally {
      this.pgConnection_ = null
    }
  },
})
