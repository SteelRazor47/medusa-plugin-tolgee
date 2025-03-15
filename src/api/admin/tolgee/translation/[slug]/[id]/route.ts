import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { Modules } from "@medusajs/framework/utils";
import { TOLGEE_MODULE } from "../../../../../../modules/tolgee";
import { SupportedModels } from "../../../../../../common";

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const translationModule = req.scope.resolve(TOLGEE_MODULE);
  const { id } = req.params;

  try {
    const keyNames = await translationModule.getProductTranslationKeys(id);
    return res.status(200).json({ keyNames });
  }
  catch (e) {
    console.error(e)
    return res.status(500).json(e)
  }
};

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const translationModule = req.scope.resolve(TOLGEE_MODULE);
  const productModule = req.scope.resolve(Modules.PRODUCT);
  const fulfillmentModule = req.scope.resolve(Modules.FULFILLMENT);
  const { id, slug } = req.params as { id: string, slug: SupportedModels }; // TODO zod validation

  const retrieveFns = {
    product: (id: string) => productModule.retrieveProduct(id, { select: ["*"] }),
    product_category: (id: string) => productModule.retrieveProductCategory(id, { select: ["*"] }),
    product_collection: (id: string) => productModule.retrieveProductCollection(id, { select: ["*"] }),
    shipping_option: (id: string) => fulfillmentModule.retrieveShippingOption(id, { select: ["*"] })
  } satisfies Record<SupportedModels, unknown> // <- type assertion to ensure all keys are present

  try {
    const model = await retrieveFns[slug]?.(id)
    const ids = await translationModule.createModelTranslations([model], slug)
    return res.status(201).json({ ids });
  } catch (e) {
    return res.status(500).json(e)
  }
};

export const DELETE = async (req: MedusaRequest, res: MedusaResponse) => {
  const translationModule = req.scope.resolve(TOLGEE_MODULE);
  const { id } = req.params;

  try {
    await translationModule.deleteTranslation(id)
    return res.status(200).json({ ids: [id] });
  }
  catch (e) {
    return res.status(500).json(e)
  }
};
