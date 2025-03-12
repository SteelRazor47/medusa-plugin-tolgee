import type { AdminProduct, AdminProductCategory } from "@medusajs/framework/types";
import { ProductEvents } from "@medusajs/framework/utils";

interface SupportedModelsMap {
    product: AdminProduct;
    product_category: AdminProductCategory;
}

const deletionEventsMap = {
    product: ProductEvents.PRODUCT_DELETED,
    product_category: ProductEvents.PRODUCT_CATEGORY_DELETED
} satisfies Record<SupportedModels, unknown>;

export const defaultSupportedProperties = {
    product: ["title", "subtitle", "description"],
    product_category: ["name", "description"],
} satisfies Record<SupportedModels, unknown>;

export type AdminOptions = {
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
