import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { TOLGEE_MODULE } from "../../../../modules/tolgee";

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const translationModule = req.scope.resolve(TOLGEE_MODULE);

  try {
    const options = await translationModule.getOptions();
    return res.json(options);
  } catch (e) {
    return res.status(500).json(e);
  }
};
