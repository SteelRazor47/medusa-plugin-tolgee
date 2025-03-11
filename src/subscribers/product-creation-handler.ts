import {
    type SubscriberConfig,
    type SubscriberArgs,
} from "@medusajs/medusa";
import TranslationManagementService, { TOLGEE_MODULE } from "../modules/tolgee";
import { Modules, ProductEvents } from "@medusajs/framework/utils";

interface ProductCreationEventData {
    id: string;
}

export default async function productCreationHandler({
    event: { data },
    container,
}: SubscriberArgs<ProductCreationEventData>) {
    const productService = container.resolve(Modules.PRODUCT);
    const translationModule = container.resolve(TOLGEE_MODULE);

    const { id } = data;

    const product = await productService.retrieveProduct(id);

    await translationModule.createProductTranslations([product]);
}

export const config: SubscriberConfig = {
    event: ProductEvents.PRODUCT_CREATED
};
