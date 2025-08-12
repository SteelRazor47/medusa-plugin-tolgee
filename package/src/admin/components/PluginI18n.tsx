import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";
import translations from "../i18n/translations";

export default ({ children }: { children: React.ReactNode }) => {
    // Create plugin-specific i18n instance
    const { i18n } = useTranslation()

    useEffect(() => {
        if (!i18n.isInitialized) return
        // Assume that if "en" is already loaded, all other languages are too
        if (i18n.hasResourceBundle("en", "tolgee")) return

        for (const [lng, resource] of Object.entries(translations))
            i18n.addResourceBundle(lng, "tolgee", resource)
    }, [])

    return <> {children} </>;
};
