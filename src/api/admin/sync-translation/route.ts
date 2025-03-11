import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { Modules } from "@medusajs/framework/utils";
import { TOLGEE_MODULE } from "../../../modules/tolgee";

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const translationModule = req.scope.resolve(TOLGEE_MODULE);
  const productModule = req.scope.resolve(Modules.PRODUCT);

  const productList = await productModule.listProducts();

  await translationModule
    .createProductTranslations(productList)
    .catch((err) => res.status(500).json(err))


  res.status(201).json({});
};
