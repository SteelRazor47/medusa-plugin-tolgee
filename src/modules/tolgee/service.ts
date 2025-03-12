import { AxiosInstance, default as axios } from "axios";
import { MedusaError } from "@medusajs/utils";
import { ProductCategoryDTO, ProductDTO } from "@medusajs/framework/types";
import { AdminOptions, defaultSupportedProperties, SupportedModels } from "../../common";

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
    protected defaultLanguage: AdminOptions["defaultLanguage"];
    protected availableLanguages: AdminOptions["availableLanguages"];
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

    async getOptions(): Promise<AdminOptions> {
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

    async getNamespaceKeys(productId: string): Promise<string[]> {
        try {
            const response = await this.client_.get(
                `/keys/select?filterNamespace=${productId}`
            );

            return response.data.ids;
        } catch (error) {
            throw new MedusaError(
                MedusaError.Types.UNEXPECTED_STATE,
                `Failed to fetch namespace keys for product ${productId}: ${error.message}`
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
        productId: string
    ): Promise<string[] | any[]> {
        const ids = await this.getNamespaceKeys(productId);

        return await Promise.all(ids.map((keyId) => this.getKeyName(keyId)));
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

            console.log(response)
            return response;
        } catch (error) {
            throw new MedusaError(
                MedusaError.Types.UNEXPECTED_STATE,
                `Failed to fetch translations for product ID ${filter.id}: ${error.message}`
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
        models: (ProductDTO | ProductCategoryDTO)[],
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
            console.error('Product already translated or error creating translations.', error);
            return []
        }
    }

    async deleteTranslation(productId: string): Promise<void> {
        const productTranslationKeys = await this.getNamespaceKeys(productId);

        try {
            const response = await this.client_.delete(
                `/keys/${productTranslationKeys}`
            );

            return response.data;
        } catch (error) {
            throw new MedusaError(
                MedusaError.Types.UNEXPECTED_STATE,
                `Failed to delete product translations for product ${productId}: ${error.message}`
            );
        }
    }
}

export default TolgeeModuleService;
