import { useEffect, useState } from "react";
import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { AdminProduct, DetailWidgetProps } from "@medusajs/framework/types"
import { useQuery } from "@tanstack/react-query"
import { Tolgee, TolgeeProvider, FormatSimple, TolgeeInstance } from "@tolgee/react";
import { InContextTools } from "@tolgee/web/tools";

import TranslationManagement from "../../components/TranslationManagement";
import { sdk } from "../../lib/sdk";
import { toast } from "@medusajs/ui";

interface Language {
  label: string;
  tag: string;
}

export interface ResponseData {
  defaultLanguage: string;
  availableLanguages: Language[];
}

const TranslationWidget = ({ data: product }: DetailWidgetProps<AdminProduct>) => {
  const notify = toast
  const [tolgee, setTolgee] = useState<TolgeeInstance | null>(null);

  const { data } = useQuery<ResponseData>({
    queryFn: () => sdk.client.fetch("/admin/multilingual-options"),
    queryKey: ["defaultLanguage", "availableLanguages"],
  })

  useEffect(() => {
    if (data && !tolgee) {
      const languages = data.availableLanguages.map((lang) => lang.tag);

      const tolgeeInstance = Tolgee()
        .use(FormatSimple())
        .init({
          language: data.defaultLanguage,
          apiUrl: import.meta.env.VITE_ADMIN_TOLGEE_API_URL,
          apiKey: import.meta.env.VITE_ADMIN_TOLGEE_API_KEY,
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
            product={product}
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

export const config = defineWidgetConfig({
  zone: "product.details.after",
})

export default TranslationWidget
