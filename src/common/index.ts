import type { AdminCollection, AdminProduct, AdminProductCategory, AdminShippingOption } from "@medusajs/framework/types";
import { FulfillmentEvents, ProductEvents } from "@medusajs/framework/utils";

interface SupportedModelsMap {
    product: AdminProduct;
    product_category: AdminProductCategory;
    product_collection: AdminCollection;
    shipping_option: AdminShippingOption;
}

const deletionEventsMap = {
    product: ProductEvents.PRODUCT_DELETED,
    product_category: ProductEvents.PRODUCT_CATEGORY_DELETED,
    product_collection: ProductEvents.PRODUCT_COLLECTION_DELETED,
    shipping_option: FulfillmentEvents.SHIPPING_OPTION_DELETED
} satisfies Record<SupportedModels, unknown>;

export const defaultSupportedProperties = {
    product: ["title", "subtitle", "description"],
    product_category: ["name", "description"],
    product_collection: ["title"],
    shipping_option: ["name"]
} satisfies Record<SupportedModels, unknown>;

export type TolgeeAdminOptions = {
    defaultLanguage: Language["tag"];
    availableLanguages: Language[];
    apiKey: string;
    apiUrl: string;
}

export const deletionEvents = Object.values(deletionEventsMap);
export type SupportedModels = keyof SupportedModelsMap;
export type WidgetType<K extends SupportedModels> = SupportedModelsMap[K];

interface Language {
    label: string;
    tag: string;
}
