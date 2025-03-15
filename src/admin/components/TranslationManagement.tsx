import { Select, toast } from "@medusajs/ui";
import formatKeyName from "../utils/formatKeyName";
import { useTolgee, useTranslate } from "@tolgee/react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { sdk } from "../lib/sdk";
import { Container } from "./container";
import { Header } from "./header";
import { SectionRow } from "./section-row";
import { useMemo } from "react";
import { TolgeeAdminOptions, SupportedModels } from "../../common";
import { InContextTools } from "@tolgee/web/tools";

type Props = {
  id: string;
  slug: SupportedModels
  availableLanguages: TolgeeAdminOptions["availableLanguages"];
  defaultLanguage: TolgeeAdminOptions["defaultLanguage"];
};

const TranslationManagement = ({
  id,
  slug,
  availableLanguages,
  defaultLanguage,
}: Props) => {
  const { t } = useTranslate(id);
  const tolgee = useTolgee()
  const client = useQueryClient();

  const handleLanguageChange = async (lang: string) => {
    if (!tolgee) return

    await tolgee.changeLanguage(lang);
    tolgee.addPlugin(InContextTools())
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
          // TODO: bug: value not refreshed when first added by in-context tool(stays default)
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
