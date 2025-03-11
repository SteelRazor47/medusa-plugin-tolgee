import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { TOLGEE_MODULE } from "../../../modules/tolgee";

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const translationModule = req.scope.resolve(TOLGEE_MODULE);

  const languages = await translationModule.getLanguages()
    .catch((err) => { res.status(500).json(err); });

  res.json(languages);
};
