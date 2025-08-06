import { defineLink } from "@medusajs/framework/utils"
import { TOLGEE_MODULE } from "../modules/tolgee"

export default (link: any) => defineLink(
    {
        ...link,
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
