import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { Modules } from "@medusajs/framework/utils";
import { TOLGEE_MODULE } from "../../../../../modules/tolgee";
import { SupportedModels } from "../../../../../common";

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const translationModule = req.scope.resolve(TOLGEE_MODULE);
  const productModule = req.scope.resolve(Modules.PRODUCT);
  const { slug } = req.params as { slug: SupportedModels }; // TODO zod validation

  const listFns = {
    product: () => productModule.listProducts(undefined, { select: ["*"] }),
    product_category: () => productModule.listProductCategories(undefined, { select: ["*"] }),
    product_collection: () => productModule.listProductCollections(undefined, { select: ["*"] }),
  } satisfies Record<SupportedModels, unknown> // <- type assertion to ensure all keys are present

  try {
    const list = await listFns[slug]?.();
    const ids = await translationModule.createModelTranslations(list, slug)
    return res.status(201).json({ ids });
  } catch (e) {
    return res.status(500).json(e);
  }
};
