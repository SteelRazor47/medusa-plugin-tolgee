import { AxiosInstance, default as axios } from "axios";
import { MedusaError } from "@medusajs/utils";
import { ProductDTO } from "@medusajs/framework/types";

export type TolgeeModuleConfig = {
    productsKeys?: string[];
    projectId?: string;
    apiKey: string;
    baseURL: string;
};

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
    protected defaultLanguage: string;
    readonly options_: TolgeeModuleConfig;

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
            productsKeys: options.productsKeys ?? ["title", "subtitle", "description"],
        };
    }

    async getLanguages() {
        try {
            const { data } = await this.client_.get<TolgeeLanguagesResponse>(`/languages`);

            const languages = data?._embedded?.languages
            if (!languages)
                return []

            this.defaultLanguage = languages.find((lang) => lang.base)?.tag ?? languages[0].tag;
            const availableLanguages = languages.map((lang) => ({
                label: lang.name,
                tag: lang.tag,
            }));
            return { defaultLanguage: this.defaultLanguage, availableLanguages };
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

    async createNewKeyWithTranslation(keys: {
        productId: string,
        keyName: string,
        translation: string
    }[]): Promise<any> {
        try {
            const response = await this.client_.post(`/keys/import`,
                {
                    keys: keys.map(({ productId, keyName, translation }) => ({
                        name: `${productId}.${keyName}`,
                        namespace: productId,
                        translations: { [this.defaultLanguage!]: translation },
                    }))
                });

            return response.data;
        } catch (error) {
            console.error(error)
            throw new MedusaError(
                MedusaError.Types.UNEXPECTED_STATE,
                `Failed to import keys ${error}`
            );
        }
    }

    async createProductTranslations(
        products: ProductDTO[]
    ): Promise<any[]> {
        const results = [] as any[];

        const keys = products.flatMap((product) =>
            this.options_.productsKeys?.map((productKey) => ({
                productId: product.id,
                keyName: productKey,
                translation: product?.[productKey] ?? ""
            })) ?? []
        );

        try {
            const res = await this.createNewKeyWithTranslation(keys) ?? []
            results.push(res)
        } catch (error) {
            console.error('Product already translated or error creating translations.', error);
        }

        return results;
    }

    async deleteProductTranslations(productId: string): Promise<void> {
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
