import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { Modules } from "@medusajs/framework/utils";
import { TOLGEE_MODULE } from "../../../../modules/tolgee";

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const translationModule = req.scope.resolve(TOLGEE_MODULE);
  const { product_id } = req.params;

  const keyNames = await translationModule.getProductTranslationKeys(
    product_id
  );

  res.status(200).json({ keyNames });
};

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const translationModule = req.scope.resolve(TOLGEE_MODULE);
  const productModule = req.scope.resolve(Modules.PRODUCT);
  const { product_id } = req.params;

  const product = await productModule.retrieveProduct(product_id);

  await translationModule.createProductTranslations([product])
    .catch((err) => { res.status(500).json(err) })

  res.status(201).json({});
};

export const DELETE = async (req: MedusaRequest, res: MedusaResponse) => {
  const translationModule = req.scope.resolve(TOLGEE_MODULE);
  const { product_id } = req.params;

  await translationModule.deleteProductTranslations(product_id)
    .catch((err) => { res.status(500).json(err) })

  res.status(200).json({});
};
