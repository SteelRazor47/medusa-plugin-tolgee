import { createWorkflow, transform, WorkflowResponse } from "@medusajs/framework/workflows-sdk";
import { SupportedModels } from "../common";
import { retrieveModelsStep, createModelTranslationsStep } from "./steps";

const createModelTranslationsWorkflow = createWorkflow(
  "create-model-translations-workflow",
  (input: { id?: string[]; slug: SupportedModels }) => {
    const models = retrieveModelsStep(input);
    const modelsWithSlug = transform({ models, input }, ({ models, input }) => ({ models, slug: input.slug }))
    const tolgeeIds = createModelTranslationsStep(modelsWithSlug);
    return new WorkflowResponse(tolgeeIds);
  }
);

export default createModelTranslationsWorkflow
