import { defineWidgetConfig } from "@medusajs/admin-sdk";
import { AdminShippingOption, AdminStockLocation, DetailWidgetProps } from "@medusajs/framework/types";
import { useQuery } from "@tanstack/react-query";
import { sdk } from "../lib/sdk";
import { Drawer, Heading, IconButton, Kbd } from "@medusajs/ui";
import { XMarkMini } from "@medusajs/icons";
import { Suspense } from "react";
import TranslationWidget from "../components/TranslationWidget";
import { Header } from "../components/header";
import { Container } from "../components/container";
import { ShippingOptionCard } from "../components/shipping-option-card";
import { useTranslation } from "react-i18next"
import PluginI18n from "../components/PluginI18n";

const ShippingOptionWidget = TranslationWidget("shipping_option");

const SOWidget = ({ data }: DetailWidgetProps<AdminStockLocation>) => {
    const { id } = data;
    const { t } = useTranslation("tolgee")

    const { data: { stock_location } = {}, isLoading } = useQuery({
        queryFn: () => sdk.admin.stockLocation.retrieve(id, { fields: "name,*sales_channels,*address,fulfillment_sets.type,fulfillment_sets.name,*fulfillment_sets.service_zones.geo_zones,*fulfillment_sets.service_zones,*fulfillment_sets.service_zones.shipping_options,*fulfillment_sets.service_zones.shipping_options.rules,*fulfillment_sets.service_zones.shipping_options.shipping_profile,*fulfillment_providers" }),
        queryKey: ["shipping_options"],
    })

    const shipping_options = stock_location?.fulfillment_sets
        ?.flatMap(fs => fs.service_zones
            .flatMap(sz => sz.shipping_options
                .map(option => ({
                    fset_type: `${fs.type[0].toUpperCase()}${fs.type.slice(1)}`,
                    zone_name: sz.name,
                    option
                })))) ?? []

    const isEmpty = !shipping_options?.length;

    return (
        <PluginI18n>
            <Container>
                <Header title={t("shippingOptionsList.title")} subtitle={isEmpty ? t("shippingOptionsList.empty") : undefined} />
                {isLoading ?
                    <div className="px-6 py-4">Loading...</div> :
                    !isEmpty && ShippingOptionsGrid(shipping_options, t("widget.title"))
                }
            </Container>
        </PluginI18n>
    )
}

export const config = defineWidgetConfig({
    zone: "location.details.side.after",
})

export default SOWidget;

function ShippingOptionsGrid(shipping_options: {
    fset_type: string;
    zone_name: string;
    option: AdminShippingOption;
}[], title: string) {
    return (
        <div className="px-6 py-4 grid gap-4 grid-cols-1 sm:grid-cols-2">
            {shipping_options?.map(({ option, zone_name, fset_type }) => (
                <Drawer modal={false} key={option.id}>
                    <Drawer.Trigger asChild>
                        <button>
                            <ShippingOptionCard labelKey={option.name} descriptionKey={`${fset_type} - ${zone_name}`} />
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
                                    {`Drawer with translations for shipping option ${option.name}`}
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
                                    <ShippingOptionWidget data={option} />
                                </Suspense>
                            </div>
                        </Drawer.Body>
                    </Drawer.Content>
                </Drawer>
            ))}
        </div>
    )
}
