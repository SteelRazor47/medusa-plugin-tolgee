import { Select, toast } from "@medusajs/ui";
import formatKeyName from "../utils/formatKeyName";
import { useTranslate } from "@tolgee/react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { sdk } from "../lib/sdk";
import { Container } from "./container";
import { Header } from "./header";
import { SectionRow } from "./section-row";
import { useMemo } from "react";
import { AdminOptions, SupportedModels } from "../../common";

type Props = {
  id: string;
  slug: SupportedModels
  notify: typeof toast;
  availableLanguages: AdminOptions["availableLanguages"];
  defaultLanguage: AdminOptions["defaultLanguage"];
  handleLanguageChange: (lang: string) => void;
};

type ResponseData = {
  keyNames: string[];
}

const TranslationManagement = ({
  id,
  slug,
  notify,
  availableLanguages,
  defaultLanguage,
  handleLanguageChange
}: Props) => {
  const { t } = useTranslate(id);
  const client = useQueryClient();

  const { mutateAsync: syncTranslation, isPending: syncing } =
    useMutation({
      mutationFn: async () => {
        await sdk.client.fetch(`/admin/tolgee/translation/${slug}`, {
          method: "post",
        })
      },
      onSuccess: () => {
        notify.success("Success", { description: "Translations sync successful." });
        client.invalidateQueries({ queryKey: ["tolgee-translations", slug] });
      },
      onError: (error) => {
        console.error(`Failed to sync translations for ${slug}:`, error);
        notify.error("Error", { description: "Failed to sync translations." });
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
        notify.success("Success", { description: "Translation created." });
        client.invalidateQueries({ queryKey: ["tolgee-translations", slug, id] });
      },
      onError: (error) => {
        console.error(`Failed to create translation for ${slug}(${id}):`, error.message);
        notify.error("Error", { description: "Failed to create translation." });
      },
      mutationKey: ["addTranslation"]
    })

  const { data: { keyNames } = { keyNames: [] }, isLoading } = useQuery<ResponseData>({
    queryFn: async () => await sdk.client.fetch(`/admin/tolgee/translation/${slug}/${id}`),
    queryKey: ["tolgee-translations", slug, id]
  })

  const syncAllAction = {
    type: "button",
    props: {
      children: "Sync all",
      onClick: () => syncTranslation(),
      isLoading: syncing,
      variant: "secondary",
    }
  } as const

  const selectLanguageAction = {
    type: "custom",
    children: (
      <Select
        onValueChange={handleLanguageChange}
        defaultValue={defaultLanguage}
      >
        <Select.Trigger>
          <Select.Value placeholder="Select a language" />
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
  } as const

  const addTranslationAction =
    {
      type: "button",
      props: {
        children: "Add",
        onClick: () => addTranslation(),
        isLoading: adding,
        variant: "secondary",
      }
    } as const


  const actions = useMemo(() => {
    if (isLoading) return []
    if (keyNames?.length > 0) return [selectLanguageAction]
    return [addTranslationAction, syncAllAction]
  }, [isLoading, keyNames?.length])


  return (
    <Container>
      <Header
        title="Translations"
        subtitle={keyNames?.length > 0 ?
          "To translate, ALT+click on the value." :
          "No translations present yet."
        }
        actions={actions}
      />

      {isLoading ? <SectionRow title="Loading..." /> :
        keyNames.map((keyName) =>
          <SectionRow
            key={keyName}
            title={formatKeyName(keyName)}
            value={t(keyName, "Not translated (press ALT + click the word)")}
          />
        )
      }

    </Container>
  );
};

export default TranslationManagement;
