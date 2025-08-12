import {
    type SubscriberConfig,
    type SubscriberArgs,
} from "@medusajs/medusa";
import { TOLGEE_MODULE } from "../modules/tolgee";
import { Modules, ProductEvents } from "@medusajs/framework/utils";

export default async function productVariantCreationHandler({
    event: { data },
    container,
}: SubscriberArgs<{ id: string }>) {
    const productService = container.resolve(Modules.PRODUCT);
    const translationModule = container.resolve(TOLGEE_MODULE);
    const { id } = data;

    const variant = await productService.retrieveProductVariant(id);
    await translationModule.createModelTranslations([variant], "product_variant");
}

export const config: SubscriberConfig = {
    event: "product-variant.created"
};
