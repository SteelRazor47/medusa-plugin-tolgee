import {
    type SubscriberConfig,
    type SubscriberArgs,
} from "@medusajs/medusa";
import { TOLGEE_MODULE } from "../modules/tolgee";
import { Modules } from "@medusajs/framework/utils";

export default async function productOptionValueCreationHandler({
    event: { data },
    container,
}: SubscriberArgs<{ id: string }>) {
    const productService = container.resolve(Modules.PRODUCT);
    const translationModule = container.resolve(TOLGEE_MODULE);
    const { id } = data;

    // TODO: replace with retrieveProductOptionValue when implemented, 
    // for now passing all the values to the translation module. Already existing ones will be skipped
    const option = await productService.retrieveProductOption(id, { relations: ["values"] });
    await translationModule.createModelTranslations(option.values, "product_option_value");
}

export const config: SubscriberConfig = {
    // TODO: replace with product-option-value.updated when implemented
    event: "product-option.updated"
};
