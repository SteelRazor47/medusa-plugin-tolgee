import { defineLink } from "@medusajs/framework/utils"
import ProductModule from "@medusajs/medusa/product"
import { TOLGEE_MODULE } from "../modules/tolgee"

export default defineLink(
    {
        ...ProductModule.linkable.productCollection.id,
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
