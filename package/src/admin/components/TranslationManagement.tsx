import { Select, toast } from "@medusajs/ui";
import formatKeyName from "../utils/formatKeyName";
import { useTolgee, useTranslate } from "@tolgee/react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { sdk } from "../lib/sdk";
import { Container } from "./container";
import { Header } from "./header";
import { SectionRow } from "./section-row";
import { TolgeeAdminOptions, SupportedModels } from "../../common";
import { InContextTools } from "@tolgee/web/tools";
import { useTranslation } from "react-i18next";

type Props = {
  id: string;
  slug: SupportedModels
  availableLanguages: TolgeeAdminOptions["availableLanguages"];
};

const TranslationManagement = ({
  id,
  slug,
  availableLanguages
}: Props) => {
  const { t: adminT } = useTranslation("tolgee")

  const { t } = useTranslate(id);
  const tolgee = useTolgee()
  const client = useQueryClient();

  const handleLanguageChange = async (lang: string) => {
    if (!tolgee) return

    await tolgee.changeLanguage(lang);
  };

  const { mutateAsync: syncTranslation, isPending: syncing } =
    useMutation({
      mutationFn: async () => {
        await sdk.client.fetch(`/admin/tolgee/translation/${slug}`, {
          method: "post",
        })
      },
      onSuccess: () => {
        toast.success("Success", { description: "Translations sync successful." });
        client.invalidateQueries({ queryKey: ["tolgee-translations", slug] });
        tolgee?.addPlugin(InContextTools())
      },
      onError: (error) => {
        console.error(`Failed to sync translations for ${slug}:`, error);
        toast.error("Error", { description: "Failed to sync translations." });
      },
      mutationKey: ["syncTranslation"]
    })

  const { mutateAsync: addTranslation, isPending: adding } =
    useMutation({
      mutationFn: () =>
        sdk.client.fetch(`/admin/tolgee/translation/${slug}/${id}`, {
          method: "post",
        }),
      onSuccess: () => {
        toast.success("Success", { description: "Translation created." });
        client.invalidateQueries({ queryKey: ["tolgee-translations", slug, id] });
        tolgee?.addPlugin(InContextTools())
      },
      onError: (error) => {
        console.error(`Failed to create translation for ${slug}(${id}):`, error.message);
        toast.error("Error", { description: "Failed to create translation." });
      },
      mutationKey: ["addTranslation"]
    })

  const { data: { keyNames = [] } = {}, isLoading } = useQuery<{ keyNames: string[]; }>({
    queryFn: async () => await sdk.client.fetch(`/admin/tolgee/translation/${slug}/${id}`),
    queryKey: ["tolgee-translations", slug, id]
  })

  const syncAllAction = {
    type: "button",
    props: {
      children: adminT("widget.syncAll"),
      onClick: () => syncTranslation(),
      isLoading: syncing,
      variant: "secondary",
    }
  } as const

  const addTranslationAction =
    {
      type: "button",
      props: {
        children: adminT("widget.add"),
        onClick: () => addTranslation(),
        isLoading: adding,
        variant: "secondary",
      }
    } as const


  return (
    <Container>
      <Header
        title={adminT("widget.title")}
        subtitle={keyNames?.length > 0 ? adminT("widget.subtitle") : adminT("widget.subtitleEmpty")}
        actions={keyNames?.length <= 0 ? [addTranslationAction, syncAllAction] : [{
          type: "custom",
          children: (
            <Select
              onValueChange={handleLanguageChange}
              value={tolgee.getLanguage()}
            >
              <Select.Trigger>
                <Select.Value placeholder={adminT("widget.selectLanguage")} />
              </Select.Trigger>
              <Select.Content>
                {availableLanguages.map((item) => (
                  <Select.Item key={item.tag} value={item.tag}>
                    {item.label}
                  </Select.Item>
                ))}
              </Select.Content>
            </Select>
          )
        }]}
      />

      {isLoading ? <SectionRow title={adminT("loading")} /> :
        keyNames.map((keyName) =>
          <SectionRow
            key={keyName}
            title={formatKeyName(keyName)}
            value={t(keyName, adminT("widget.notTranslated"))}
          />
        )
      }

    </Container>
  );
};

export default TranslationManagement;
