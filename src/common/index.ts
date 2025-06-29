import type { AdminCollection, AdminProduct, AdminProductCategory, AdminProductOption, AdminProductOptionValue, AdminProductTag, AdminProductType, AdminProductVariant, AdminShippingOption, Context, FindConfig, ProductCategoryDTO, ProductCollectionDTO, ProductDTO, ProductOptionDTO, ProductOptionValueDTO, ProductTagDTO, ProductTypeDTO, ProductVariantDTO, ShippingOptionDTO } from "@medusajs/framework/types";
import { FulfillmentEvents, ProductEvents } from "@medusajs/framework/utils";

export const supportedModelsList = [
    "product",
    "product_category",
    "product_collection",
    "product_option",
    "product_option_value",
    "product_type",
    "product_tag",
    "product_variant",
    "shipping_option",
] as const

interface SupportedModelsMap {
    product: AdminProduct;
    product_category: AdminProductCategory;
    product_collection: AdminCollection;
    product_option: AdminProductOption;
    product_option_value: AdminProductOptionValue;
    product_type: AdminProductType;
    product_tag: AdminProductTag;
    product_variant: AdminProductVariant;
    shipping_option: AdminShippingOption;
}

const deletionEventsMap = {
    product: ProductEvents.PRODUCT_DELETED,
    product_category: ProductEvents.PRODUCT_CATEGORY_DELETED,
    product_collection: ProductEvents.PRODUCT_COLLECTION_DELETED,
    product_option: ProductEvents.PRODUCT_OPTION_DELETED,
    product_option_value: ProductEvents.PRODUCT_OPTION_VALUE_DELETED,
    product_type: ProductEvents.PRODUCT_TYPE_DELETED,
    product_tag: ProductEvents.PRODUCT_TAG_DELETED,
    product_variant: ProductEvents.PRODUCT_VARIANT_DELETED,
    shipping_option: FulfillmentEvents.SHIPPING_OPTION_DELETED
} satisfies Record<SupportedModels, unknown>;

export const defaultSupportedProperties = {
    product: ["title", "subtitle", "description"],
    product_category: ["name", "description"],
    product_collection: ["title"],
    product_option: ["title"],
    product_option_value: ["value"],
    product_type: ["value"],
    product_tag: ["value"],
    product_variant: ["title"],
    shipping_option: ["name"]
} satisfies Record<SupportedModels, unknown>;

export type ModelDTO =
    | ProductDTO
    | ProductCategoryDTO
    | ProductCollectionDTO
    | ProductOptionDTO
    | ProductOptionValueDTO
    | ProductTagDTO
    | ProductTypeDTO
    | ProductVariantDTO
    | ShippingOptionDTO

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

// TODO: the method exists but not on the upstream interface
// remove when added
declare module "@medusajs/framework/types" {
    interface IProductModuleService {
        retrieveProductOptionValue(id: string, config?: FindConfig<ProductOptionValueDTO>, sharedContext?: Context): Promise<ProductOptionValueDTO>;
    }
}
