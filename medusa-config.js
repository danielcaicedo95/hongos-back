const path = require("path")
const { loadEnv, defineConfig } = require("@medusajs/framework/utils")

loadEnv(process.env.NODE_ENV || "development", process.cwd())

// En producción (Render), el código compilado vive en .medusa/server
const isProd = process.env.NODE_ENV === "production"
const wompiModulePath = isProd
    ? path.resolve(__dirname, ".medusa/server/src/modules/wompi-payment")
    : path.resolve(__dirname, "src/modules/wompi-payment")

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
        path: "/app", // Path por defecto para el dashboard en Medusa v2
        ...(process.env.MEDUSA_ADMIN_BACKEND_URL && {
            backendUrl: process.env.MEDUSA_ADMIN_BACKEND_URL,
        }),
    },
    modules: [
        {
            resolve: "@medusajs/medusa/payment",
            options: {
                providers: [
                    {
                        resolve: wompiModulePath, // Usar ruta absoluta para evitar MODULE_NOT_FOUND
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
    ],
})
