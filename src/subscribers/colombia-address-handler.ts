import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"

/**
 * Subscriber que maneja direcciones colombianas
 * Auto-inyecta código postal "000000" cuando no se proporciona
 */
export default async function colombiaAddressHandler({
    event: { data },
    container,
}: SubscriberArgs<{ id: string }>) {
    const cartModuleService = container.resolve("cart")

    const cart = await cartModuleService.retrieveCart(data.id, {
        select: ["id", "shipping_address.*"],
    })

    // Solo procesar si hay dirección de envío
    if (!cart.shipping_address) {
        return
    }

    const address = cart.shipping_address

    // Si es Colombia y no tiene código postal, inyectar uno genérico
    if (
        address.country_code?.toLowerCase() === "co" &&
        (!address.postal_code || address.postal_code.trim() === "")
    ) {
        await cartModuleService.updateAddresses([{
            id: address.id,
            postal_code: "000000",
        }])

        console.log(
            `[Colombia Handler] Auto-inyectado código postal para cart ${cart.id}`
        )
    }
}

export const config: SubscriberConfig = {
    event: "cart.updated",
}
