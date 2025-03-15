import {
    type SubscriberConfig,
    type SubscriberArgs,
} from "@medusajs/medusa";
import { TOLGEE_MODULE } from "../modules/tolgee";
import { FulfillmentEvents, Modules } from "@medusajs/framework/utils";

export default async function productCreationHandler({
    event: { data },
    container,
}: SubscriberArgs<{ id: string }>) {
    const fulfillmentModule = container.resolve(Modules.FULFILLMENT);
    const translationModule = container.resolve(TOLGEE_MODULE);
    const { id } = data;

    const option = await fulfillmentModule.retrieveShippingOption(id);
    await translationModule.createModelTranslations([option], "shipping_option");
}

export const config: SubscriberConfig = {
    event: FulfillmentEvents.SHIPPING_OPTION_CREATED
};
