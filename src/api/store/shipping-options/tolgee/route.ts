import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { HttpTypes } from "@medusajs/framework/types"
import listShippingOptionsForCartWithTranslationsWorkflow from "../../../../workflows/shipping-options-with-translations"
import { StoreGetTolgeeShippingOptionList } from "./middlewares"

export const GET = async (
    req: MedusaRequest<{}, StoreGetTolgeeShippingOptionList>,
    res: MedusaResponse<HttpTypes.StoreShippingOptionListResponse>
) => {
    const workflow = listShippingOptionsForCartWithTranslationsWorkflow(req.scope)
    const { result: shipping_options } = await workflow.run({ input: req.validatedQuery })

    res.json({ shipping_options })
}
