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
    // This event only exists as the module version(with prefix)
    // can't use "shipping-option.created" directly
    event: FulfillmentEvents.SHIPPING_OPTION_CREATED
};
