const path = require("path")
const { loadEnv, defineConfig } = require("@medusajs/framework/utils")

loadEnv(process.env.NODE_ENV || "development", process.cwd())

// --- LOGS DE DIAGNÓSTICO PARA RENDER ---
console.log("-----------------------------------------")
console.log("DIAGNÓSTICO DE DESPLIEGUE:")
console.log("NODE_ENV:", process.env.NODE_ENV)
console.log("DATABASE_URL detectada:", !!process.env.DATABASE_URL)
if (process.env.DATABASE_URL) {
    console.log("DATABASE_URL comienza con:", process.env.DATABASE_URL.substring(0, 15) + "...")
}
console.log("REDIS_URL detectada:", !!process.env.REDIS_URL)
console.log("WOMPI_PUB_KEY detectada:", !!process.env.WOMPI_PUB_KEY)
console.log("-----------------------------------------")

const isProd = process.env.NODE_ENV === "production"
// En producción (Render), el código compilado vive en .medusa/server/src/modules
const wompiModulePath = isProd
    ? path.resolve(__dirname, ".medusa", "server", "src", "modules", "wompi-payment")
    : path.resolve(__dirname, "src", "modules", "wompi-payment")

console.log("Ruta de Wompi resuelta:", wompiModulePath)

module.exports = defineConfig({
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
        // Usamos una carpeta no oculta para evitar problemas con el despliegue de Render
        outDir: "build-admin",
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
                        resolve: wompiModulePath,
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
