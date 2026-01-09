import { loadEnv, defineConfig } from '@medusajs/framework/utils'

loadEnv(process.env.NODE_ENV || 'development', process.cwd())

export default defineConfig({
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
  admin: {
    disable: false,
  },
  modules: [
    {
      resolve: "@medusajs/medusa/payment",
      options: {
        providers: [
          {
            resolve: "./src/modules/wompi-payment",
            id: "wompi",
            options: {
              publicKey: process.env.WOMPI_PUB_KEY,
              privateKey: process.env.WOMPI_PRV_KEY,
              integritySecret: process.env.WOMPI_INTEGRITY_SECRET,
              testMode: process.env.WOMPI_TEST_MODE === "true",
            },
          },
        ],
      },
    },
  ]
})
