import {
    type SubscriberConfig,
    type SubscriberArgs,
} from "@medusajs/medusa";
import { TOLGEE_MODULE } from "../modules/tolgee";
import { Modules, ProductEvents } from "@medusajs/framework/utils";

export default async function productCategoryCreationHandler({
    event: { data },
    container,
}: SubscriberArgs<{ id: string }>) {
    const productService = container.resolve(Modules.PRODUCT);
    const translationModule = container.resolve(TOLGEE_MODULE);
    const { id } = data;

    const category = await productService.retrieveProductCategory(id);
    await translationModule.createModelTranslations([category], "product_category");
}

export const config: SubscriberConfig = {
    event: ProductEvents.PRODUCT_CATEGORY_CREATED
};
