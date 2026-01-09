import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { Container, Heading, Button, Input, toast, Label, Text } from "@medusajs/ui"
import { DetailWidgetProps, AdminProduct } from "@medusajs/framework/types"
import { useState, useEffect } from "react"
import { useQueryClient } from "@tanstack/react-query"

// Helper for requests
const BASE_URL = "http://localhost:9000"

const ProductPriceCopWidget = ({
    data: product
}: DetailWidgetProps<AdminProduct>) => {
    const [price, setPrice] = useState<string>("")
    const [loading, setLoading] = useState(false)
    const [variantId, setVariantId] = useState<string | null>(null)
    const [variantTitle, setVariantTitle] = useState<string>("Cargando...")
    const queryClient = useQueryClient()

    // Explicitly fetch variants since props might be shallow
    useEffect(() => {
        const fetchVariants = async () => {
            try {
                // Expanding prices to get current values using Medusa 2 syntax
                const req = await fetch(`${BASE_URL}/admin/products/${product.id}?fields=+variants,+variants.prices`, {
                    credentials: "include"
                })
                const res = await req.json()

                // Medusa 2 response structure: { product: { ... } }
                const productData = res.product

                if (productData && productData.variants && productData.variants.length > 0) {
                    const firstVariant = productData.variants[0]
                    setVariantId(firstVariant.id)
                    setVariantTitle(firstVariant.title)

                    // Find existing COP price
                    const copPrice = firstVariant.prices?.find((p: any) => p.currency_code === "cop")

                    if (copPrice) {
                        // Convert from cents to main unit (2 decimals => /100)
                        setPrice((copPrice.amount / 100).toString())
                    }
                } else {
                    setVariantTitle("No se encontraron variantes")
                }
            } catch (e) {
                console.error("Failed to fetch variants", e)
                setVariantTitle("Error cargando variantes")
            }
        }

        fetchVariants()
    }, [product.id])


    const handleSave = async () => {
        if (!variantId) {
            toast.error("No se encontró variante para actualizar")
            return
        }

        setLoading(true)
        try {
            // Convert main unit to cents
            const amountInCents = Math.round(parseFloat(price) * 100)

            const updateReq = await fetch(`${BASE_URL}/admin/products/${product.id}/variants/${variantId}`, {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    prices: [
                        {
                            currency_code: "cop",
                            amount: amountInCents
                        }
                    ]
                })
            })

            if (!updateReq.ok) {
                const err = await updateReq.json()
                throw new Error(err.message || "Error al actualizar")
            }

            toast.success("Precio actualizado (COP)")

            // Invalidate queries
            queryClient.invalidateQueries({ queryKey: [['product', 'detail', product.id]] })
            queryClient.invalidateQueries({ queryKey: [['variants']] })

        } catch (error) {
            console.error(error)
            toast.error("Error al guardar precio.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Container className="p-8 border bg-white rounded-lg shadow-sm">
            <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center">
                    <Heading level="h2" className="text-xl">Precio Rápido (COP)</Heading>
                    <Text className="text-ui-fg-subtle text-small">Variante: {variantTitle}</Text>
                </div>

                <div className="flex items-end gap-4">
                    <div className="flex-1 max-w-sm">
                        <Label htmlFor="cop-price" className="mb-2 block">Precio en Pesos</Label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                            <Input
                                id="cop-price"
                                type="number"
                                placeholder="Ej: 50000"
                                value={price}
                                onChange={(e) => setPrice(e.target.value)}
                                className="pl-8"
                            />
                        </div>
                    </div>
                    <Button
                        onClick={handleSave}
                        isLoading={loading}
                        disabled={!variantId}
                    >
                        Guardar Precio
                    </Button>
                </div>
                <Text className="text-xs text-gray-400">
                    * Se actualizará el precio COP de la primera variante encontrada.
                </Text>
            </div>
        </Container>
    )
}

export const config = defineWidgetConfig({
    zone: "product.details.before",
})

export default ProductPriceCopWidget
