import {
    type SubscriberConfig,
    type SubscriberArgs,
} from "@medusajs/medusa";
import { TOLGEE_MODULE } from "../modules/tolgee";
import { deletionEvents } from "../common";


export default async function deletionHandler({
    event: { data },
    container,
}: SubscriberArgs<{ id: string }>) {
    const translationService = container.resolve(TOLGEE_MODULE);
    const { id } = data;

    await translationService.deleteTranslation(id);
}

export const config: SubscriberConfig = {
    event: deletionEvents
};
