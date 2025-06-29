import { createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk";
import { deleteTranslationStep } from "./steps";

const deleteTranslationWorkflow = createWorkflow(
  "tolgee-delete-translation-workflow",
  (input: { id: string }) => {
    const ids = deleteTranslationStep(input);
    return new WorkflowResponse(ids);
  }
);

export default deleteTranslationWorkflow
