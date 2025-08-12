import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { validateSlug } from "./utils";
import createModelTranslationsWorkflow from "../../../../../workflows/create-translations";

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const { slug } = req.params;
  validateSlug(slug)

  const { result } = await createModelTranslationsWorkflow(req.scope).run({ input: { slug } });
  return res.status(201).json(result);
};
