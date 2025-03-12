import { DetailWidgetProps } from "@medusajs/framework/types"
import { useQuery } from "@tanstack/react-query"
import { Tolgee, TolgeeProvider, FormatSimple, TolgeeInstance } from "@tolgee/react";
import { InContextTools } from "@tolgee/web/tools";

import TranslationManagement from "./TranslationManagement";
import { sdk } from "../lib/sdk";
import { toast as notify } from "@medusajs/ui";
import { useEffect, useState } from "react";
import { AdminOptions, SupportedModels, WidgetType } from "../../common";

export const TranslationWidget = (slug: SupportedModels) =>
  ({ data: { id } }: DetailWidgetProps<WidgetType<SupportedModels>>) => {
    const [tolgee, setTolgee] = useState<TolgeeInstance | null>(null);

    const { data } = useQuery<AdminOptions>({
      queryFn: () => sdk.client.fetch("/admin/tolgee/options"),
      queryKey: ["tolgee-options"],
    })

    useEffect(() => {
      if (data && !tolgee) {
        const languages = data.availableLanguages.map((lang) => lang.tag);

        const tolgeeInstance = Tolgee()
          .use(FormatSimple())
          .init({
            language: data.defaultLanguage,
            apiUrl: data.apiUrl,
            apiKey: data.apiKey,
            availableLanguages: languages,
            observerOptions: {
              highlightColor: "rgba(0,0,0,0.7)",
            },
          });

        tolgeeInstance.addPlugin(InContextTools());
        setTolgee(tolgeeInstance);
      }
    }, [data]);

    const handleLanguageChange = async (lang: string) => {
      if (tolgee) {
        await tolgee.changeLanguage(lang);
      }
    };

    return (
      <>
        {tolgee ? (
          <TolgeeProvider tolgee={tolgee} fallback="Loading...">
            <TranslationManagement
              id={id}
              slug={slug}
              notify={notify}
              availableLanguages={data?.availableLanguages || []}
              defaultLanguage={data?.defaultLanguage || "en"}
              handleLanguageChange={handleLanguageChange}
            />
          </TolgeeProvider>
        ) : (
          <div>Loading...</div>
        )}
      </>
    );
  };



export default TranslationWidget
