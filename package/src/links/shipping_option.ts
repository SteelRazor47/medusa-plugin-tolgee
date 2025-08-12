import FulfillmentModule from "@medusajs/medusa/fulfillment"
import linkFactory from "./link-factory"

export default linkFactory(FulfillmentModule.linkable.shippingOption.id)
