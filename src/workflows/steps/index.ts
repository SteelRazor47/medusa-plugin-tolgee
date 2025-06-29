import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { Modules } from "@medusajs/utils";
import { SupportedModels, ModelDTO } from "../../common";
import { TOLGEE_MODULE } from "../../modules/tolgee";

type RetrieveStepInput = { id?: string[]; slug: SupportedModels };
export const retrieveModelsStep = createStep(
  "tolgee-retrieve-models",
  async ({ id, slug }: RetrieveStepInput, { container }) => {
    const productModule = container.resolve(Modules.PRODUCT);
    const fulfillmentModule = container.resolve(Modules.FULFILLMENT);

    const filter = id ? { id } : undefined
    const listFns = {
      product: () => productModule.listProducts(filter, { select: ["*"] }),
      product_category: () => productModule.listProductCategories(filter, { select: ["*"] }),
      product_collection: () => productModule.listProductCollections(filter, { select: ["*"] }),
      product_option: () => productModule.listProductOptions(filter, { select: ["*"] }),
      product_option_value: () => productModule.listProductOptionValues(filter, { select: ["*"] }),
      product_tag: () => productModule.listProductTags(filter, { select: ["*"] }),
      product_type: () => productModule.listProductTypes(filter, { select: ["*"] }),
      product_variant: () => productModule.listProductVariants(filter, { select: ["*"] }),
      shipping_option: () => fulfillmentModule.listShippingOptions(filter, { select: ["*"] }),
    } satisfies Record<SupportedModels, unknown> // <- type assertion to ensure all keys are present

    const models = await listFns[slug]?.();
    return new StepResponse(models);
  }
);

type CreateStepInput = { models: ModelDTO[]; slug: SupportedModels };
export const createModelTranslationsStep = createStep(
  "tolgee-create-model-translations",
  async ({ models, slug }: CreateStepInput, { container }) => {
    const translationModule = container.resolve(TOLGEE_MODULE);
    const ids = await translationModule.createModelTranslations(models, slug);
    return new StepResponse(ids, ids); // ids as compensation context
  },
  async (ids, { container }) => {
    if (!ids) return
    const translationModule = container.resolve(TOLGEE_MODULE);
    for (const id of ids) {
      await translationModule.deleteTranslation(id);
    }
  }
);

type DeleteStepInput = { id: string };
export const deleteTranslationStep = createStep(
  "tolgee-delete-translation",
  async ({ id }: DeleteStepInput, { container }) => {
    const translationModule = container.resolve(TOLGEE_MODULE);
    await translationModule.deleteTranslation(id);
    return new StepResponse([id]);
  }
);

type GetStepInput = { id: string };
export const getModelTranslationKeysStep = createStep(
  "tolgee-get-model-translation-keys",
  async ({ id }: GetStepInput, { container }) => {
    const translationModule = container.resolve(TOLGEE_MODULE);
    const keyNames = await translationModule.getProductTranslationKeys(id);
    return new StepResponse(keyNames);
  }
);
