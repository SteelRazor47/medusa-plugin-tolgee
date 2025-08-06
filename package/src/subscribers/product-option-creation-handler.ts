import {
    type SubscriberConfig,
    type SubscriberArgs,
} from "@medusajs/medusa";
import { TOLGEE_MODULE } from "../modules/tolgee";
import { Modules, ProductEvents } from "@medusajs/framework/utils";

export default async function productOptionCreationHandler({
    event: { data },
    container,
}: SubscriberArgs<{ id: string }>) {
    const productService = container.resolve(Modules.PRODUCT);
    const translationModule = container.resolve(TOLGEE_MODULE);
    const { id } = data;

    const option = await productService.retrieveProductOption(id, { relations: ["values"] });
    await translationModule.createModelTranslations([option], "product_option");
    await translationModule.createModelTranslations(option.values, "product_option_value");
}

export const config: SubscriberConfig = {
    event: "product-option.created"
};
