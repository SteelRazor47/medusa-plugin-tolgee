import { defineLink } from "@medusajs/framework/utils"
import CartModule from "@medusajs/medusa/cart"
import { TOLGEE_MODULE } from "../modules/tolgee"

export default defineLink(
  {
    ...CartModule.linkable.shippingMethod.id,
    field: "shipping_option_id",
  },
  {
    linkable: {
      serviceName: TOLGEE_MODULE,
      alias: "translations",
      primaryKey: "id",
    },
  },
  { readOnly: true }
)
