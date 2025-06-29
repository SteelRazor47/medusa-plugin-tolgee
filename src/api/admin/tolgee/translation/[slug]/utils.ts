import { MedusaError } from "@medusajs/utils";
import { SupportedModels, supportedModelsList } from "../../../../../common";

export function validateSlug(slug: string): asserts slug is SupportedModels {
  if (!supportedModelsList.includes(slug as SupportedModels)) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      `Invalid param slug (${slug})`
    )
  }
}
