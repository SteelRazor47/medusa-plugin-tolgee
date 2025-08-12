import { Text } from "@medusajs/ui"
import { TriangleRightMini } from "@medusajs/icons"

export interface SidebarButtonProps {
    labelKey: string
    descriptionKey: string
}

export const ShippingOptionCard = ({
    labelKey,
    descriptionKey,
}: SidebarButtonProps) => {
    return <div className="flex flex-col gap-2">
        <div className="shadow-elevation-card-rest bg-ui-bg-component transition-fg hover:bg-ui-bg-component-hover active:bg-ui-bg-component-pressed group-focus-visible:shadow-borders-interactive-with-active rounded-md px-4 py-2">
            <div className="flex items-center gap-4 justify-between">
                <div className="flex flex-col items-start">
                    <Text size="small" leading="compact" weight="plus">
                        {labelKey}
                    </Text>
                    <Text
                        size="small"
                        leading="compact"
                        className="text-ui-fg-subtle"
                    >
                        {descriptionKey}
                    </Text>
                </div>
                <div className="flex size-7 items-center justify-center">
                    <TriangleRightMini className="text-ui-fg-muted" />
                </div>
            </div>
        </div>
    </div>
}
