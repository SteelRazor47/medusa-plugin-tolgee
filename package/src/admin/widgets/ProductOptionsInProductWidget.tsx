import { defineWidgetConfig } from "@medusajs/admin-sdk";
import { AdminProduct, AdminProductOption, DetailWidgetProps } from "@medusajs/framework/types";
import { Divider, Drawer, Heading, IconButton, Kbd } from "@medusajs/ui";
import { XMarkMini } from "@medusajs/icons";
import { Suspense } from "react";
import TranslationWidget from "../components/TranslationWidget";
import { Header } from "../components/header";
import { Container } from "../components/container";
import { ShippingOptionCard } from "../components/shipping-option-card";
import { useTranslation } from "react-i18next"
import PluginI18n from "../components/PluginI18n";

const ProductOptionWidget = TranslationWidget("product_option");
const ProductOptionValueWidget = TranslationWidget("product_option_value");

const ProductOptionsInProductWidget = ({ data }: DetailWidgetProps<AdminProduct>) => {
    const { options } = data;
    const { t } = useTranslation("tolgee")

    const isEmpty = !options?.length;
    return (
        <PluginI18n>
            <Container>
                <Header title={t("productOptionsList.title")} subtitle={isEmpty ? t("productOptionsList.empty") : undefined} />
                {!isEmpty && OptionsGrid(options, t("widget.title"))}
            </Container>
        </PluginI18n>
    )
}

export const config = defineWidgetConfig({
    zone: "product.details.side.after",
})

export default ProductOptionsInProductWidget;

function OptionsGrid(options: AdminProductOption[], title: string) {
    // TODO: causes too few/too many hooks error when loading conditionally. also in SO list widget
    // passing in the title as prop to the widget for now.
    // const { t } = useTranslation("tolgee")

    return (
        <div className="px-6 py-4 grid gap-4 grid-cols-1 sm:grid-cols-2">
            {options?.map((option) => (
                <Drawer modal={false} key={option.id}>
                    <Drawer.Trigger asChild>
                        <button>
                            <ShippingOptionCard labelKey={option.title} descriptionKey="" />
                        </button>
                    </Drawer.Trigger>
                    <Drawer.Content
                        onInteractOutside={e => e.preventDefault()}
                        className="bg-ui-contrast-bg-base text-ui-code-fg-subtle !shadow-elevation-commandbar overflow-hidden border border-none max-md:inset-x-2 max-md:max-w-[calc(100%-16px)]"
                    >
                        <div className="bg-ui-code-bg-base flex items-center justify-between px-6 py-4">
                            <div className="flex items-center gap-x-4">
                                <Drawer.Title asChild>
                                    <Heading className="text-ui-contrast-fg-primary">
                                        {title}
                                    </Heading>
                                </Drawer.Title>
                                <Drawer.Description className="sr-only">
                                    {`Drawer with translations for product option ${option.title}`}
                                </Drawer.Description>
                            </div>
                            <div className="flex items-center gap-x-2">
                                <Kbd className="bg-ui-contrast-bg-subtle border-ui-contrast-border-base text-ui-contrast-fg-secondary">
                                    esc
                                </Kbd>
                                <Drawer.Close asChild>
                                    <IconButton
                                        size="small"
                                        variant="transparent"
                                        className="text-ui-contrast-fg-secondary hover:text-ui-contrast-fg-primary hover:bg-ui-contrast-bg-base-hover active:bg-ui-contrast-bg-base-pressed focus-visible:bg-ui-contrast-bg-base-hover focus-visible:shadow-borders-interactive-with-active"
                                    >
                                        <XMarkMini />
                                    </IconButton>
                                </Drawer.Close>
                            </div>
                        </div>
                        <Drawer.Body className="flex flex-1 flex-col overflow-hidden px-[5px] py-0 pb-[5px]">
                            <div className="bg-ui-contrast-bg-subtle flex-1 overflow-auto rounded-b-[4px] rounded-t-lg p-3">
                                <Suspense
                                    fallback={<div className="flex size-full flex-col"></div>}
                                >
                                    <Heading className="text-ui-contrast-fg-primary ps-2 pb-4">
                                        Option title
                                    </Heading>
                                    <ProductOptionWidget key={option.id} data={option} />
                                    <Divider className="h-8" />
                                    <Heading className="text-ui-contrast-fg-primary ps-2 pb-4">
                                        Option values:
                                    </Heading>
                                    <div className="flex flex-col gap-y-2">
                                        {option.values?.map((value) => (
                                            <ProductOptionValueWidget key={value.id} data={value} />
                                        ))}
                                    </div>
                                </Suspense>
                            </div>
                        </Drawer.Body>
                    </Drawer.Content>
                </Drawer>
            ))}
        </div>
    )
}
