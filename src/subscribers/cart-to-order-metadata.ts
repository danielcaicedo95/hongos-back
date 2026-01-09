import { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"

/**
 * Subscriber que transfiere metadata del carrito a la orden
 * Especialmente importante para preservar la cédula
 */
export default async function cartToOrderMetadataHandler({
    event: { data },
    container,
}: SubscriberArgs<{ id: string }>) {
    const orderModuleService = container.resolve("order")
    const cartModuleService = container.resolve("cart")

    // Obtener la orden recién creada
    const order = await orderModuleService.retrieve(data.id)

    // Obtener el carrito original
    if (!order.cart_id) {
        return
    }

    const cart = await cartModuleService.retrieve(order.cart_id)

    // Si el carrito tiene metadata, transferirla a la orden
    if (cart.metadata && Object.keys(cart.metadata).length > 0) {
        await orderModuleService.update(order.id, {
            metadata: {
                ...order.metadata,
                ...cart.metadata,
            },
        })

        console.log(
            `[Metadata Transfer] Transferida metadata de cart ${cart.id} a order ${order.id}`,
            cart.metadata
        )
    }
}

export const config: SubscriberConfig = {
    event: "order.placed",
}
