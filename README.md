<div align="center">
  <h1>Medusa Plugin Tolgee</h1>
  <p>A Medusa V2 version of the Tolgee plugin by Rigby, and much more.</p>
  
  <!-- Shields.io Badges -->
  <a href="https://github.com/rigby-sh/medusa-multilingual-tolgee/blob/main/LICENSE">
    <img alt="License" src="https://img.shields.io/badge/license-MIT-blue.svg" />
  </a>

  <!-- Documentation and Website Links -->
  <p>
    <a href="https://www.medusajs.com/">Medusa</a> |
        <a href="https://tolgee.io/">Tolgee</a> |
    <a href="https://rigbyjs.com/en">Rigby</a>
  </p>
</div>
<br>

## About the plugin

This plugin integrates Medusa eCommerce with Tolgee, an open-source localization platform, to provide an easy translation management solution. It's designed to simplify product data translation without the need for complex CMS or PIM systems. By leveraging Tolgee, users access powerful localization features directly within their Medusa admin panel.

![Medusa Multilanguage Tolgee GIF](https://rigby-web.fra1.digitaloceanspaces.com/medusa-multilanguage.gif)

**Key Features of Tolgee**

- **In-Context Translating**: Utilize Tolgee’s development tools to translate content directly on the frontend, providing a real-time, intuitive translating experience.
- **Translation Assistance**: Enhance translation accuracy and speed with automatic translation suggestions powered by leading AI services such as DeepL, Google Translate, and AWS Translate.
- **Collaborative Workflows**: Streamline the translation process with features that support collaboration, allowing teams to easily review and approve translations, ensuring consistency and quality.

Tolgee is all about making the translation process as simple as possible. For more details on the extensive capabilities of Tolgee, visit their official website: [Tolgee.io](https://tolgee.io/)

## Plugin features and supported models

| Model                                          | Status      |
|------------------------------------------------|-------------|
| Products                                       | ✅         |
| Product collections                            | ✅         |
| Product categories                             | ✅         |
| Product variants                               | ✅         |
| Product options                                | ✅         |
| Product types                                  | ✅         |
| Product tags                                   | ✅         |
| Shipping options                               | ✅         |

| Feature                                                   | Status      |
|-----------------------------------------------------------|-------------|
| Admin widget to manage translations                       | ✅         |
| Add translation                                           | ✅         |
| Sync all model instances with Tolgee                      | ✅         |
| Automatically add translations when instance is added     | ✅         |
| Automatically remove translations when instance is removed| ✅         |
| Support for custom model attributes                       | ✅         |


## How to use

#### Set up your Tolgee project

Before configuring the Medusa plugin, ensure your Tolgee project is ready. You can either set up an open-source version of Tolgee on your own infrastructure or opt for the managed cloud version offered by Tolgee. Obtain your project ID from the project's dashboard URL (e.g., `https://app.tolgee.io/projects/YOUR_PROJECT_ID`).

#### Install the plugin

```javascript
npm install medusa-plugin-tolgee
```

or 

```javascript
yarn add medusa-plugin-tolgee
```

#### Add plugin configurations to medusa-config.js

Once your Tolgee project is set up, add the plugin configuration to your Medusa store by modifying the `medusa-config.js` file. Here's what you need to include:

```javascript
import { TolgeeModuleConfig } from 'medusa-plugin-tolgee'

const plugins = [
  {
    resolve: `medusa-plugin-tolgee`,
    options: {
      baseURL: process.env.TOLGEE_API_URL,
      apiKey: process.env.TOLGEE_API_KEY,
      projectId: "your_tolgee_project_id",
      ttl: 1000 * 60 * 5 // Optional, default 5min
      rateLimit: { // Optional
        maxRequests: 15, // default
        perMilliseconds: 3000 // default
      },
      keys: { // Optional
        product: ["title", "subtitle", "description"]
      },
      tags: { // Optional
        product: ["custom_tag"]
      }
    } satisfies TolgeeModuleConfig,
  },
];
```

Configuration options: 

- **keys**: For each supported model, you can optionally specify which properties should be translatable. Otherwise all the core properties that make sense will be available by default.
- **projectId**: Your Tolgee project ID, which you can find in the URL of your project dashboard on the Tolgee platform.
- **ttl**: Expiration time for the in-memory cache used to deduplicate requests to Tolgee. 
- **rateLimit**: Customizable rate limiting. The default value is designed for the Tolgee free tier, consider raising it considerably if self-hosting.

#### Set Environment Variables in Medusa

```javascript
TOLGEE_API_URL=your_tolgee_app_url
TOLGEE_API_KEY=your_tolgee_api_key
```

Explanation of Variables

- **`TOLGEE_API_URL`**: This is the base URL where your Tolgee instance is hosted. If you are using the Tolgee cloud service, this will be **`https://app.tolgee.io`**. If you have a self-hosted instance, replace this URL with the URL of your own deployment.
- **`TOLGEE_API_KEY`**: You can find or generate a new API key by navigating to /account/apiKeys within your Tolgee dashboard. If you haven't generated an API key yet, create one by following the prompts in the Tolgee interface.

#### Sync all your models with Tolgee 

After configuring your environment variables and setting up the plugin, it's time to synchronize your data with Tolgee to enable translations across your e-commerce platform. Here's how to complete the synchronization process and start translating your models:

**Restart Medusa**: First, ensure that all your changes are saved, then restart your Medusa server to apply the new configuration settings. This ensures that all components are loaded correctly, including the newly configured translation management plugin.

**Access the Translations Section**: Navigate to the edit page for a model within your Medusa admin panel, for example a product. Here's what you need to do:

**Scroll to the Translations Section**: On the edit page, scroll down until you find a new section labeled "Translations". This section is added by the **`medusa-plugin-tolgee`** plugin and provides the tools necessary for managing translations.

![Medusa Multilingual Tolgee Plugin](https://rigby-web.fra1.digitaloceanspaces.com/translation-management-not-synced.png)

**Initiate the Sync Process**: Click on the "Sync all" button. This action triggers a workflow that communicates with Tolgee to create translations for all existing instances of the same model (for example all products, but not also categories, shipping options etc).

**Wait for Completion**: After clicking the sync button, the process may take some time depending on the number of entities and the complexity of the translations.

![Medusa Multilingual Tolgee Plugin](https://rigby-web.fra1.digitaloceanspaces.com/translation-management-synced.png)

Congratulations! Your configuration is now complete, and you can start translating all of your models. 🎉

If you want to translate a word, press the ALT button and click on the word in the Value column.

## How to use it on the frontend

**Medusa link**: All supported models have been augmented with a linked `translations` property. You can retrieve translations for a specific language or all languages by adding respectively `+translations.${countryCode}` or `+translations.*` to your query's `fields` property. For example:
```javascript
const translationsField = countryCode ? `,+translations.${countryCode},+options.translations.${countryCode},+options.values.translations.${countryCode}` : ""

sdk.client.fetch<{ products: StoreProductWithTranslations[]; count: number }>(
  `/store/products`,
  {
    method: "GET",
    query: {
      limit,
      offset,
      region_id: region?.id,
      fields:`...,+metadata,+tags${translationsField}`, // <----
      ...queryParams,
    },
    headers,
    next,
    cache: "force-cache",
  }
).then(({ products, count }) => {
  const nextPage = count > offset + limit ? pageParam + 1 : null

  return {
    response: {
      products: products.map((product) => ({
        ...product,
        // assign the translations for the desired language directly to the product 
        // so that the country code is not needed anymore
        options: product.options?.map((option) => ({
          ...option,
          translations: countryCode ? option.translations?.[countryCode] : undefined,
          values: option.values?.map(value => ({
            ...value,
            translations: countryCode ? value.translations?.[countryCode] : undefined,
          }))
        })),
        translations: countryCode ? product.translations?.[countryCode] : undefined,
      })),
      count,
    },
    nextPage: nextPage,
    queryParams,
  }
})
```

Note: the store API endpoint for shipping options ignores query fields. For now, you can use the custom endpoint below, which accepts the country code as a query parameter. 
```javascript
sdk.client.fetch<HttpTypes.StoreShippingOptionListResponse>(
  `/store/shipping-options/tolgee`,
  {
    method: "GET",
    query: { cart_id: cartId, country_code: countryCode },
    headers,
    next,
    cache: "force-cache",
  }
)
.then(({ shipping_options }) => shipping_options)
.catch(() => {
  return null
})
```

**Tolgee hook**: You can also directly use the `useTranslate` hook provided by Tolgee. [See more info](https://docs.tolgee.io/js-sdk/integrations/react/overview)

### SSG

IF you have hundred of static pages to render, the default rate limit of Tolgee's free tier might cause timeouts while rendering.
Consider adding the following code to your `next.config.js`: it prevents the requests from waiting for the rate limit and timing out, by only processing a few pages at the time. Since it's network limited, this shouldn't affect build times.
```
experimental: {
  // Limits to 2 pages at a time
  staticGenerationMaxConcurrency: 2
}
```

## License

Licensed under the [MIT License](https://github.com/rigby-sh/medusa-multilingual-tolgee/blob/main/LICENSE).
