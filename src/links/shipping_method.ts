import { defineLink } from "@medusajs/framework/utils"
import OrderModule from "@medusajs/medusa/order"
import { TOLGEE_MODULE } from "../modules/tolgee"

export default defineLink(
  {
    ...OrderModule.linkable.orderShippingMethod.id,
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
