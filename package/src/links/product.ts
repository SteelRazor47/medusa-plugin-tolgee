import ProductModule from "@medusajs/medusa/product"
import linkFactory from "./link-factory"

export default linkFactory(ProductModule.linkable.product.id)
