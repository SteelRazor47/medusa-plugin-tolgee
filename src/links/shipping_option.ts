import { defineLink } from "@medusajs/framework/utils"
import FulfillmentModule from "@medusajs/medusa/fulfillment"
import { TOLGEE_MODULE } from "../modules/tolgee"

export default defineLink(
    {
        ...FulfillmentModule.linkable.shippingOption.id,
        field: "id",
    },
    {
        linkable: {
            serviceName: TOLGEE_MODULE,
            alias: "translations",
            primaryKey: "id",
        },
    },
    {
        readOnly: true,
    }
)
