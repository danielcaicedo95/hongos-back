import { PaymentSessionStatus } from "@medusajs/types"
import { AbstractPaymentProvider } from "@medusajs/utils"
import { Logger } from "@medusajs/framework/types"

type Options = {
    publicKey: string
    privateKey: string
    integritySecret: string
    testMode?: boolean
}

type WompiPaymentIntent = {
    id: string
    amount: number
    currency: string
    reference: string
    signature?: string
}

export default class WompiPaymentProviderService extends AbstractPaymentProvider<Options> {
    static identifier = "wompi"
    protected logger_: Logger
    protected options_: Options

    constructor(container: { logger: Logger }, options: Options) {
        super(container, options)
        this.logger_ = container.logger
        this.options_ = options
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async initiatePayment(input: any): Promise<any> {
        const { amount, currency_code, resource_id } = input

        // In a real Wompi integration, we might create a transaction reference here
        const reference = `wompi-${resource_id}-${Date.now()}`

        // Logic to generate integrity signature can be added here
        // const signature = generateSignature(reference, amount * 100, currency_code, this.options_.integritySecret)

        const sessionData: WompiPaymentIntent = {
            id: reference, // Wompi doesn't create a session ID upfront like Stripe, using reference
            amount,
            currency: currency_code,
            reference,
        }

        return {
            ...sessionData,
            data: {
                ...sessionData
            }
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async authorizePayment(input: any): Promise<any> {
        // In Medusa v2, input usually contains paymentSessionData
        const paymentSessionData = input

        // In the widget flow, authorization happens on client/redirect.
        // Here we would verify the transaction status with Wompi's API using the reference.

        // Stub: Assuming success for development/testing if triggered
        this.logger_.info(`[Wompi] Authorizing payment ${paymentSessionData.reference}`)

        return {
            status: "authorized",
            data: {
                ...paymentSessionData,
            },
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async cancelPayment(input: any): Promise<any> {
        return {
            ...input
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async capturePayment(input: any): Promise<any> {
        // Call Wompi API to capture if it's a two-step auth
        this.logger_.info(`[Wompi] Capturing payment ${input.reference}`)
        return {
            ...input,
            status: "captured"
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async deletePayment(input: any): Promise<any> {
        return {
            ...input
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async getPaymentStatus(input: any): Promise<any> {
        // Logic to map Wompi status to Medusa status
        return { status: "authorized" }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async refundPayment(input: any): Promise<any> {
        this.logger_.info(`[Wompi] Refunding for ${input.reference}`)
        return {
            ...input,
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async retrievePayment(input: any): Promise<any> {
        return {
            ...input
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async updatePayment(input: any): Promise<any> {
        return this.initiatePayment(input)
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async getWebhookActionAndData(data: any): Promise<any> {
        return {
            action: "not_supported",
        }
    }
}
