import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { Modules } from "@medusajs/framework/utils";
import { TOLGEE_MODULE } from "../../../../../modules/tolgee";
import { SupportedModels } from "../../../../../common";

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const translationModule = req.scope.resolve(TOLGEE_MODULE);
  const productModule = req.scope.resolve(Modules.PRODUCT);
  const fulfillmentModule = req.scope.resolve(Modules.FULFILLMENT);
  const { slug } = req.params as { slug: SupportedModels }; // TODO zod validation

  const listFns = {
    product: () => productModule.listProducts(undefined, { select: ["*"] }),
    product_category: () => productModule.listProductCategories(undefined, { select: ["*"] }),
    product_collection: () => productModule.listProductCollections(undefined, { select: ["*"] }),
    product_option: () => productModule.listProductOptions(undefined, { select: ["*"] }),
    product_option_value: () => productModule.listProductOptionValues(undefined, { select: ["*"] }),
    product_tag: () => productModule.listProductTags(undefined, { select: ["*"] }),
    product_type: () => productModule.listProductTypes(undefined, { select: ["*"] }),
    product_variant: () => productModule.listProductVariants(undefined, { select: ["*"] }),
    shipping_option: () => fulfillmentModule.listShippingOptions(undefined, { select: ["*"] }),
  } satisfies Record<SupportedModels, unknown> // <- type assertion to ensure all keys are present

  try {
    const list = await listFns[slug]?.();
    const ids = await translationModule.createModelTranslations(list, slug)
    return res.status(201).json({ ids });
  } catch (e) {
    return res.status(500).json(e);
  }
};
