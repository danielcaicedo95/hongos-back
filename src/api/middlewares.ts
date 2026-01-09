import {
    defineMiddlewares,
} from "@medusajs/framework/http"
import { MedusaRequest, MedusaResponse, MedusaNextFunction } from "@medusajs/framework/http"

/**
 * Middleware para sanear la cédula en metadata
 * Elimina puntos, espacios y caracteres no numéricos
 */
function sanitizeCedula(
    req: MedusaRequest,
    res: MedusaResponse,
    next: MedusaNextFunction
) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const body = req.body as any
    if (body && body.metadata && typeof body.metadata.cedula === 'string') {
        // Eliminar todo lo que no sea dígito
        body.metadata.cedula = body.metadata.cedula.replace(/[^\d]/g, "")
        console.log(`[Middleware] Cédula saneada: ${body.metadata.cedula}`)
    }
    next()
}

export default defineMiddlewares({
    routes: [
        {
            matcher: "/store/carts/:id",
            method: "POST",
            middlewares: [sanitizeCedula],
        },
        // También interceptamos completar orden por seguridad, si se enviara metadata ahí
        {
            matcher: "/store/carts/:id/complete",
            method: "POST",
            middlewares: [sanitizeCedula],
        },
    ],
})
