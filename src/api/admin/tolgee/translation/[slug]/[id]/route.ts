import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import getModelTranslationKeysWorkflow from "../../../../../../workflows/get-translations";
import createModelTranslationsWorkflow from "../../../../../../workflows/create-translations";
import deleteTranslationWorkflow from "../../../../../../workflows/delete-translations";
import { validateSlug } from "../utils";

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const { id } = req.params;

  const { result } = await getModelTranslationKeysWorkflow(req.scope).run({ input: { id } });
  return res.status(200).json({ keyNames: result });
};

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const { id, slug } = req.params;
  validateSlug(slug)

  const { result } = await createModelTranslationsWorkflow(req.scope).run({ input: { id: [id], slug } });
  return res.status(201).json(result);
};

export const DELETE = async (req: MedusaRequest, res: MedusaResponse) => {
  const { id } = req.params;

  const { result } = await deleteTranslationWorkflow(req.scope).run({ input: { id } });
  return res.status(200).json(result);
};
