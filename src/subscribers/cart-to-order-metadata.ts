import { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"

/**
 * Subscriber que transfiere metadata del carrito a la orden
 * Especialmente importante para preservar la cédula
 */
export default async function cartToOrderMetadataHandler({
    event: { data },
    container,
}: SubscriberArgs<{ id: string }>) {
    const query = container.resolve("query")
    const orderModuleService = container.resolve("order")

    // Obtener la orden con su carrito vinculado usando Query
    const { data: [order] } = await query.graph({
        entity: "order",
        fields: ["id", "metadata", "cart.metadata", "cart.id"],
        filters: { id: data.id }
    })

    if (!order || !order.cart) {
        return
    }

    const cart = order.cart

    // Si el carrito tiene metadata, transferirla a la orden
    if (cart.metadata && Object.keys(cart.metadata).length > 0) {
        await orderModuleService.updateOrders([{
            id: order.id,
            metadata: {
                ...order.metadata,
                ...cart.metadata,
            },
        }])

        console.log(
            `[Metadata Transfer] Transferida metadata de cart ${cart.id} a order ${order.id}`,
            cart.metadata
        )
    }
}


export const config: SubscriberConfig = {
    event: "order.placed",
}
