import { defineWidgetConfig } from "@medusajs/admin-sdk";
import { AdminStockLocation, DetailWidgetProps } from "@medusajs/framework/types";
import { useQuery } from "@tanstack/react-query";
import { sdk } from "../lib/sdk";
import { Drawer, Heading, IconButton, Kbd } from "@medusajs/ui";
import { XMarkMini } from "@medusajs/icons";
import { Suspense } from "react";
import TranslationWidget from "../components/TranslationWidget";
import { Header } from "../components/header";
import { Container } from "../components/container";
import { ShippingOptionCard } from "../components/shipping-option-card";

const ShippingOptionWidget = TranslationWidget("shipping_option");

const SOWidget = ({ data: { id = "" } }: DetailWidgetProps<AdminStockLocation>) => {
    if (!id) return null; // TODO: remove after upgrade to 2.6.2

    const { data: { stock_location } = {}, isLoading } = useQuery({
        queryFn: () => sdk.admin.stockLocation.retrieve(id, { fields: "name,*sales_channels,*address,fulfillment_sets.type,fulfillment_sets.name,*fulfillment_sets.service_zones.geo_zones,*fulfillment_sets.service_zones,*fulfillment_sets.service_zones.shipping_options,*fulfillment_sets.service_zones.shipping_options.rules,*fulfillment_sets.service_zones.shipping_options.shipping_profile,*fulfillment_providers" }),
        queryKey: ["tolgee-stock-location", id],
    })

    const shipping_options = stock_location?.fulfillment_sets
        ?.flatMap(fs => fs.service_zones
            .flatMap(sz => sz.shipping_options
                .map(option => ({
                    fset_type: `${fs.type[0].toUpperCase()}${fs.type.slice(1)}`,
                    zone_name: sz.name,
                    option
                })))) ?? []

    return (
        <Container>
            <Header title="Translations" />
            <div className="px-6 py-4 grid gap-4 grid-cols-1 sm:grid-cols-2">
                {isLoading ? "Loading..." : (
                    shipping_options?.map(({ option, zone_name, fset_type }) =>
                        <Drawer modal={false}>
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
                                                Translations
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
                                        <Drawer.Close asChild >
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
                    )
                )
                }
            </div>
        </Container>
    )
}

export const config = defineWidgetConfig({
    zone: "location.details.side.after",
})

export default SOWidget;
