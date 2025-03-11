import { Select } from "@medusajs/ui";
import formatKeyName from "../../utils/formatKeyName";
import { useTranslate } from "@tolgee/react";

import {
  Props,
  ResponseData,
} from "./types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { sdk } from "../../lib/sdk";
import { Container } from "../container";
import { Header } from "../header";
import { SectionRow } from "../section-row";
import { useMemo } from "react";

const TranslationManagement = ({
  product,
  notify,
  availableLanguages,
  defaultLanguage,
  handleLanguageChange
}: Props) => {
  const { t } = useTranslate(product.id);
  const client = useQueryClient();

  const { mutateAsync: syncTranslation, isPending: syncing } =
    useMutation({
      mutationFn: async () => {
        await sdk.client.fetch(`/admin/sync-translation`, {
          method: "post",
        })
      },
      onSuccess: () => {
        notify.success("Success", { description: "Translations sync confirmed and processing." });
        client.invalidateQueries({ queryKey: ["tolgee-translations"] });
      },
      onError: (error) => {
        console.error("Failed to sync all translations:", error);
        notify.error("Error", { description: "Failed to sync translations." });
      },
      mutationKey: ["syncTranslation"]
    })

  const { mutateAsync: addTranslation, isPending: adding } =
    useMutation({
      mutationFn: () =>
        sdk.client.fetch(`/admin/product-translation/${product.id}`, {
          method: "post",
        }),
      onSuccess: () => {
        notify.success("Success", { description: "Product translations created." });
        client.invalidateQueries({ queryKey: ["tolgee-translations", product.id] });
      },
      onError: (error) => {
        console.error("Failed to create product translations:", error.message);
        notify.error("Error", { description: "Failed to create product translations." });
      },
      mutationKey: ["productTranslation"]
    })

  const { data: { keyNames } = { keyNames: [] }, isLoading } = useQuery<ResponseData>({
    queryFn: async () => await sdk.client.fetch(`/admin/product-translation/${product.id}`),
    queryKey: ["tolgee-translations", product.id]
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
          "The product has no translations yet."
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
