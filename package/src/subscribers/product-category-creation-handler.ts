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

    const category = await productService.retrieveProductCategory(id, { select: ["*"] });
    await translationModule.createModelTranslations([category], "product_category");
}

export const config: SubscriberConfig = {
    // TODO: replace all with ProductEvents.* constants maybe? 
    // they are different events and not all of them are emitted for now
    event: "product-category.created"
};
