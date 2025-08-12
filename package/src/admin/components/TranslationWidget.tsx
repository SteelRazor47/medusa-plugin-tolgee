import { DetailWidgetProps } from "@medusajs/framework/types"
import { useQuery } from "@tanstack/react-query"
import { Tolgee, TolgeeProvider, FormatSimple } from "@tolgee/react";
import { InContextTools } from "@tolgee/web/tools";

import TranslationManagement from "./TranslationManagement";
import { sdk } from "../lib/sdk";
import { TolgeeAdminOptions, SupportedModels, WidgetType } from "../../common";
import PluginI18n from "./PluginI18n";

const TranslationWidget = <T extends SupportedModels>(slug: T) =>
  ({ data: { id } }: DetailWidgetProps<WidgetType<T>>) => {
    const { options, tolgeeInstance } = useTolgeeFromOptions();

    return (
      <>
        <PluginI18n>
          {options && tolgeeInstance ? (
            <TolgeeProvider tolgee={tolgeeInstance} fallback="Loading...">
              <TranslationManagement
                id={id}
                slug={slug}
                availableLanguages={options.availableLanguages || []}
              />
            </TolgeeProvider>
          ) : (
            <div>Loading...</div>
          )}
        </PluginI18n>
      </>
    );
  };

const useTolgeeFromOptions = () => {
  const { data: { options, tolgeeInstance } = {} } = useQuery({
    queryFn: () => sdk.client.fetch<TolgeeAdminOptions>("/admin/tolgee/options").then(options => {
      const languages = options.availableLanguages.map((lang) => lang.tag);

      const tolgeeInstance = Tolgee()
        .use(FormatSimple())
        .init({
          language: options.defaultLanguage,
          apiUrl: options.apiUrl,
          apiKey: options.apiKey,
          availableLanguages: languages,
          observerOptions: {
            highlightColor: "rgba(0,0,0,0.7)",
          },
        });

      tolgeeInstance.addPlugin(InContextTools());
      return {
        options, tolgeeInstance
      }
    }),

    queryKey: ["tolgee-options"],
  })

  return { options, tolgeeInstance }
}


export default TranslationWidget
