import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import { MedusaError } from "@medusajs/framework/utils"

type UpdateCartMetadataRequest = {
    cedula?: string
    [key: string]: any
}

/**
 * Endpoint personalizado para actualizar metadata del carrito
 * Principalmente usado para guardar la cédula del cliente
 */
export const POST = async (
    req: MedusaRequest<UpdateCartMetadataRequest>,
    res: MedusaResponse
) => {
    const { id } = req.params
    const metadata = req.validatedBody

    // Sanitizar cédula si viene en el payload
    if (metadata.cedula) {
        // Remover puntos, espacios y guiones
        metadata.cedula = metadata.cedula.replace(/[\s.-]/g, "")

        // Validar formato (6-10 dígitos)
        if (!/^\d{6,10}$/.test(metadata.cedula)) {
            throw new MedusaError(
                MedusaError.Types.INVALID_DATA,
                "La cédula debe contener entre 6 y 10 dígitos"
            )
        }
    }

    // Actualizar el carrito con la metadata
    const cartModuleService = req.scope.resolve("cart")

    const cart = await cartModuleService.retrieveCart(id)

    const updatedCarts = await cartModuleService.updateCarts([{
        id,
        metadata: {
            ...cart.metadata,
            ...metadata,
        },
    }])

    const updatedCart = updatedCarts[0] || updatedCarts


    res.status(200).json({ cart: updatedCart })
}
