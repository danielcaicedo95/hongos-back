import { loadEnv, defineConfig } from "@medusajs/framework/utils"

loadEnv(process.env.NODE_ENV || "development", process.cwd())

// --- LOGS DE DIAGNÓSTICO PARA RENDER (VERSIÓN ESM) ---
console.log("-----------------------------------------")
console.log("DIAGNÓSTICO DE DESPLIEGUE (ESM):")
console.log("NODE_ENV:", process.env.NODE_ENV)
console.log("CWD:", process.cwd())
console.log("FILENAME:", import.meta.url)
console.log("DATABASE_URL detectada:", !!process.env.DATABASE_URL)
if (process.env.DATABASE_URL) {
  console.log("DATABASE_URL comienza con:", process.env.DATABASE_URL.substring(0, 15) + "...")
}
console.log("REDIS_URL detectada:", !!process.env.REDIS_URL)
console.log("WOMPI_PUB_KEY detectada:", !!process.env.WOMPI_PUB_KEY)
console.log("-----------------------------------------")

export default defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    redisUrl: process.env.REDIS_URL,
    http: {
      storeCors: process.env.STORE_CORS,
      adminCors: process.env.ADMIN_CORS,
      authCors: process.env.AUTH_CORS,
      jwtSecret: process.env.JWT_SECRET || "supersecret",
      cookieSecret: process.env.COOKIE_SECRET || "supersecret",
    },
  },
  admin: {
    disable: false,
    // Eliminamos outDir personalizado para evitar conflictos con el build estándar de Medusa v2
    ...(process.env.MEDUSA_ADMIN_BACKEND_URL && {
      backendUrl: process.env.MEDUSA_ADMIN_BACKEND_URL,
    }),
  },
  modules: {
    payment: {
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
  },
})
