import {
    type SubscriberConfig,
    type SubscriberArgs,
} from "@medusajs/medusa";
import { TOLGEE_MODULE } from "../modules/tolgee";
import { ProductEvents } from "@medusajs/framework/utils";

interface ProductDeletionEventData {
    id: string;
}

export default async function productDeletionHandler({
    event: { data },
    container,
}: SubscriberArgs<ProductDeletionEventData>) {
    const translationService = container.resolve(TOLGEE_MODULE);
    const { id } = data;

    await translationService.deleteProductTranslations(id);
}

export const config: SubscriberConfig = {
    event: ProductEvents.PRODUCT_DELETED
};
