import { WorkflowData, createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk";
import { getModelTranslationKeysStep } from "./steps";

const getModelTranslationKeysWorkflow = createWorkflow(
  "tolgee-get-model-translation-keys-workflow",
  (input: WorkflowData<{ id: string }>) => {
    const keyNames = getModelTranslationKeysStep(input);
    return new WorkflowResponse(keyNames);
  }
);

export default getModelTranslationKeysWorkflow
