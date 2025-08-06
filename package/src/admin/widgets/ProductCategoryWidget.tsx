import { defineWidgetConfig } from "@medusajs/admin-sdk";
import TranslationWidget from "../components/TranslationWidget";

export const config = defineWidgetConfig({
    zone: "product_category.details.after",
})

export default TranslationWidget("product_category");
