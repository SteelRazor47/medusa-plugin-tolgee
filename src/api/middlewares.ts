import { defineMiddlewares } from "@medusajs/framework/http"
import { validateAndTransformQuery } from "@medusajs/framework"
import z from "zod"

const StoreGetTolgeeShippingOptionsQueryParams = z.object({
  cart_id: z.string(), is_return: z.boolean().optional(), country_code: z.string().optional()
})

export type StoreGetTolgeeShippingOptionList = z.infer<typeof StoreGetTolgeeShippingOptionsQueryParams>

export default defineMiddlewares({
  routes: [
    {
      method: ["GET"],
      matcher: "/store/shipping-options/tolgee",
      middlewares: [
        validateAndTransformQuery(StoreGetTolgeeShippingOptionsQueryParams, {}),
      ],
    }
  ]
})
