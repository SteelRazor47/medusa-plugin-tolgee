import {
    type SubscriberConfig,
    type SubscriberArgs,
} from "@medusajs/medusa";
import { TOLGEE_MODULE } from "../modules/tolgee";
import { Modules } from "@medusajs/framework/utils"

// Only called if the option is created directly, not as part of product creation
export default async function productOptionCreationHandler({
    event: { data },
    container,
}: SubscriberArgs<{ id: string }>) {
    const productService = container.resolve(Modules.PRODUCT);
    const translationModule = container.resolve(TOLGEE_MODULE);
    const { id } = data;

    const option = await productService.retrieveProductOption(id, { relations: ["values"] });
    await Promise.all([
        translationModule.createModelTranslations([option], "product_option"),
        translationModule.createModelTranslations(option.values, "product_option_value")
    ])
}

export const config: SubscriberConfig = {
    event: "product-option.created"
};
