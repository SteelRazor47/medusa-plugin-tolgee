import { AxiosInstance, default as axios } from "axios";
import { MedusaError } from "@medusajs/utils";
import { ProductCategoryDTO, ProductCollectionDTO, ProductDTO, ShippingOptionDTO } from "@medusajs/framework/types";
import { TolgeeAdminOptions, defaultSupportedProperties, SupportedModels } from "../../common";

export type TolgeeModuleConfig = {
    projectId: string;
    apiKey: string;
    baseURL: string;
    keys?: {
        [key in SupportedModels]?: string[];
    };
};

type TolgeeModuleConfigInternal = Omit<TolgeeModuleConfig, "keys"> &
{ keys: Required<TolgeeModuleConfig["keys"]> };

type TolgeeLanguagesResponse = {
    _embedded: {
        languages: {
            name: string;
            tag: string;
            base: boolean;
        }[]
    }
}

class TolgeeModuleService {
    protected client_: AxiosInstance;
    protected defaultLanguage: TolgeeAdminOptions["defaultLanguage"];
    protected availableLanguages: TolgeeAdminOptions["availableLanguages"];
    readonly options_: TolgeeModuleConfigInternal;

    constructor({ }, options: TolgeeModuleConfig) {

        this.client_ = axios.create({
            baseURL: `${options.baseURL}/v2/projects/${options.projectId}`,
            headers: {
                Accept: "application/json",
                "X-API-Key": options.apiKey,
            },
            maxBodyLength: Infinity,
        });

        this.options_ = {
            ...options,
            keys: {
                ...defaultSupportedProperties,
                ...options.keys,
            },
        };
    }

    async getOptions(): Promise<TolgeeAdminOptions> {
        try {
            const { data } = await this.client_.get<TolgeeLanguagesResponse>(`/languages`);

            const languages = data?._embedded?.languages
            if (!languages)
                return { defaultLanguage: "en", availableLanguages: [], apiKey: "", apiUrl: "" }

            this.defaultLanguage = languages.find((lang) => lang.base)?.tag ?? languages[0].tag;
            this.availableLanguages = languages.map((lang) => ({
                label: lang.name,
                tag: lang.tag,
            }));

            return {
                defaultLanguage: this.defaultLanguage,
                availableLanguages: this.availableLanguages ?? [],
                apiKey: this.options_.apiKey,
                apiUrl: this.options_.baseURL
            };
        } catch (error) {
            throw new MedusaError(
                MedusaError.Types.UNEXPECTED_STATE,
                `Failed to fetch languages for project: ${error.message}`
            );
        }
    }

    async getNamespaceKeys(id: string | string[]): Promise<string[]> {
        const ids = Array.isArray(id) ? id : [id];
        try {
            const response = await this.client_.get(
                `/keys/select?filterNamespace=${ids.join(",")}`
            );

            return response.data.ids;
        } catch (error) {
            throw new MedusaError(
                MedusaError.Types.UNEXPECTED_STATE,
                `Failed to fetch namespace keys for ${id}: ${error.message}`
            );
        }
    }

    async getKeyName(keyId: string): Promise<string> {
        try {
            const response = await this.client_.get(`/keys/${keyId}`);

            return response.data.name;
        } catch (error) {
            throw new MedusaError(
                MedusaError.Types.UNEXPECTED_STATE,
                `Failed to fetch key name for key ID ${keyId}: ${error.message}`
            );
        }
    }

    async getProductTranslationKeys(
        ids: string | string[]
    ) {
        const keys = await this.getNamespaceKeys(ids);
        return await Promise.all(keys.map((keyId) => this.getKeyName(keyId)));
    }

    async list(
        filter: {
            id: string | string[]
        }
    ) {
        try {
            const ids = Array.isArray(filter.id) ? filter.id : [filter.id]
            const langs = (await this.getOptions()).availableLanguages.map((lang) => lang.tag).join(",");
            const response = await Promise.all(ids.map(async id => {
                const { data } = await this.client_.get(`/translations/${langs}?ns=${id}`)
                for (const key in data) {
                    data[key] = data[key][id]
                }
                return { id, ...data }
            }))

            return response;
        } catch (error) {
            throw new MedusaError(
                MedusaError.Types.UNEXPECTED_STATE,
                `Failed to fetch translations for key ID ${filter.id}: ${error.message}`
            );
        }
    }

    async createNewKeyWithTranslation(keys: {
        id: string,
        keyName: string,
        translation: string
    }[]): Promise<any> {
        try {
            await this.client_.post(`/keys/import`,
                {
                    keys: keys.map(({ id, keyName, translation }) => ({
                        name: `${id}.${keyName}`,
                        namespace: id,
                        translations: { [this.defaultLanguage!]: translation },
                    }))
                });

            return
        } catch (error) {
            console.error(error)
            throw new MedusaError(
                MedusaError.Types.UNEXPECTED_STATE,
                `Failed to import keys ${error}`
            );
        }
    }

    async createModelTranslations(
        models: (ProductDTO | ProductCategoryDTO | ProductCollectionDTO | ShippingOptionDTO)[],
        type: SupportedModels
    ): Promise<string[]> {
        const keys = models.flatMap((model) =>
            this.options_.keys?.[type]?.map((key) => ({
                id: model.id,
                keyName: key,
                translation: model?.[key] ?? ""
            })) ?? []
        );

        try {
            await this.createNewKeyWithTranslation(keys)
            return models.map((model) => model.id);
        } catch (error) {
            console.error(`Entities of type ${type} already translated or error creating translations: ${models.map((model) => model.id)}`, error);
            return []
        }
    }

    async deleteTranslation(id: string): Promise<void> {
        const keys = await this.getNamespaceKeys(id);

        try {
            const response = await this.client_.delete(`/keys/${keys}`);

            return response.data;
        } catch (error) {
            throw new MedusaError(
                MedusaError.Types.UNEXPECTED_STATE,
                `Failed to delete translations for namespace ${id}: ${error.message}`
            );
        }
    }
}

export default TolgeeModuleService;
