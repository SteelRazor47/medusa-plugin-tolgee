import {
    type SubscriberConfig,
    type SubscriberArgs,
} from "@medusajs/medusa";
import { TOLGEE_MODULE } from "../modules/tolgee";
import { Modules } from "@medusajs/framework/utils"

export default async function productCreationHandler({
    event: { data },
    container,
}: SubscriberArgs<{ id: string }>) {
    const productService = container.resolve(Modules.PRODUCT);
    const translationModule = container.resolve(TOLGEE_MODULE);
    const { id } = data;

    const product = await productService.retrieveProduct(id, { relations: ["options", "options.values"] })

    await Promise.all([
        translationModule.createModelTranslations([product], "product"),
        translationModule.createModelTranslations(product.options, "product_option"),
        translationModule.createModelTranslations(product.options.flatMap(o => o.values), "product_option_value"),
    ])
}

export const config: SubscriberConfig = {
    event: "product.created"
};
