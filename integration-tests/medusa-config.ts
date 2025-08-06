import { loadEnv, defineConfig } from '@medusajs/framework/utils'
import { TolgeeModuleConfig } from 'medusa-plugin-tolgee/.medusa/server/src/modules/tolgee'

loadEnv(process.env.NODE_ENV || 'development', process.cwd())

module.exports = defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    http: {
      storeCors: process.env.STORE_CORS!,
      adminCors: process.env.ADMIN_CORS!,
      authCors: process.env.AUTH_CORS!,
      jwtSecret: process.env.JWT_SECRET || "supersecret",
      cookieSecret: process.env.COOKIE_SECRET || "supersecret",
    }
  },
  plugins: [
    {
      resolve: "medusa-plugin-tolgee",
      options: {
        baseURL: process.env.TOLGEE_API_URL!,
        apiKey: process.env.TOLGEE_API_KEY!,
        projectId: process.env.TOLGEE_PROJECT_ID!
      } satisfies TolgeeModuleConfig,
    }
  ]
})
