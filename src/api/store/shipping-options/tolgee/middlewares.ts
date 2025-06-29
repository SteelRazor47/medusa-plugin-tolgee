import { MiddlewareRoute } from "@medusajs/framework/http"
import { validateAndTransformQuery } from "@medusajs/framework"
import z from "zod"

const StoreGetTolgeeShippingOptionsQueryParams = z.object({
  cart_id: z.string(), is_return: z.boolean(), country_code: z.string()
})

export type StoreGetTolgeeShippingOptionList = z.infer<typeof StoreGetTolgeeShippingOptionsQueryParams>

export const storeTolgeeShippingOptionsMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/store/shipping-options/tolgee",
    middlewares: [
      validateAndTransformQuery(StoreGetTolgeeShippingOptionsQueryParams, {}),
    ],
  }
]
