import { SalesChannelDTO, RegionDTO, ShippingOptionDTO, IEventBusModuleService, CartDTO, ProductDTO, CreateProductDTO, AdminCreateProduct, ProductVariantDTO, ProductCategoryDTO, ProductCollectionDTO, ProductTypeDTO, ProductTagDTO } from "@medusajs/framework/types"
import { MedusaContainer } from "@medusajs/medusa"
import { TestEventUtils } from "@medusajs/test-utils"
import { ApiKeyType, ContainerRegistrationKeys, FulfillmentEvents, Modules, ProductEvents, PUBLISHABLE_KEY_HEADER } from "@medusajs/utils"
import jwt from "jsonwebtoken"
import { TOLGEE_MODULE } from "medusa-plugin-tolgee"
import { medusaIntegrationTestRunnerManual } from "../utils/medusa-test-runner"

jest.setTimeout(60000)

medusaIntegrationTestRunnerManual({
  testSuite: ({ getContainer, api }) => {
    let appContainer: MedusaContainer, eventBus: IEventBusModuleService
    const storeHeaders = { headers: {} }
    const adminHeaders = { headers: {} }

    beforeAll(async () => {
      appContainer = getContainer()
      eventBus = appContainer.resolve(Modules.EVENT_BUS)

      await Promise.all([
        getPublishableKey(appContainer, storeHeaders),
        getAdminToken(appContainer, adminHeaders)
      ])
    })



    describe("Shipping Option", () => {
      let cart: CartDTO
      let shippingOption: ShippingOptionDTO

      beforeAll(async () => {
        const [region, shippingProfile, salesChannel, stockLocation] = await Promise.all([
          api.post(
            "/admin/regions",
            { name: "US", currency_code: "usd", countries: ["US"] },
            adminHeaders
          ).then(res => res.data.region),
          api.post(
            `/admin/shipping-profiles`,
            { name: "Test", type: "default" },
            adminHeaders
          ).then(res => res.data.shipping_profile),
          api.post(
            "/admin/sales-channels",
            { name: "first channel", description: "channel" },
            adminHeaders
          ).then(res => res.data.sales_channel),
          api.post(
            `/admin/stock-locations`,
            { name: "test location" },
            adminHeaders
          ).then(res => res.data.stock_location)
        ])

        let fulfillmentSets
        [cart, fulfillmentSets] = await Promise.all([
          api.post(
            `/store/carts`,
            {
              region_id: region.id,
              sales_channel_id: salesChannel.id,
              currency_code: "usd",
              email: "test@admin.com",
              items: [],
            },
            storeHeaders
          ).then(res => res.data.cart),
          api.post(
            `/admin/stock-locations/${stockLocation.id}/fulfillment-sets?fields=*fulfillment_sets`,
            {
              name: "Test",
              type: "test-type",
            },
            adminHeaders
          ).then(res => res.data.stock_location.fulfillment_sets),
          api.post(
            `/admin/stock-locations/${stockLocation.id}/sales-channels`,
            { add: [salesChannel.id] },
            adminHeaders
          ),
          api.post(
            `/admin/stock-locations/${stockLocation.id}/fulfillment-providers`,
            { add: ["manual_manual"] },
            adminHeaders
          )
        ])

        const fulfillmentSet = (
          await api.post(
            `/admin/fulfillment-sets/${fulfillmentSets[0].id}/service-zones`,
            {
              name: "Test",
              geo_zones: [
                { type: "country", country_code: "us" },
                { type: "country", country_code: "dk" },
              ],
            },
            adminHeaders
          )
        ).data.fulfillment_set

        const subscriberExecution = TestEventUtils.waitSubscribersExecution(FulfillmentEvents.SHIPPING_OPTION_CREATED, eventBus)
        shippingOption = (
          await api.post(
            `/admin/shipping-options`,
            {
              name: "Test shipping option",
              service_zone_id: fulfillmentSet.service_zones[0].id,
              shipping_profile_id: shippingProfile.id,
              provider_id: "manual_manual",
              price_type: "flat",
              type: {
                label: "Test type",
                description: "Test description",
                code: "test-code",
              },
              prices: [
                {
                  currency_code: "usd",
                  amount: 1000,
                },
                {
                  region_id: region.id,
                  amount: 1100,
                },
                {
                  region_id: region.id,
                  amount: 0,
                  rules: [
                    {
                      operator: "gt",
                      attribute: "item_total",
                      value: 2000,
                    },
                  ],
                },
              ],
              rules: [],
            },
            adminHeaders
          )
        ).data.shipping_option
        await subscriberExecution

      })

      afterAll(async () => {
        const tolgeeService = appContainer.resolve(TOLGEE_MODULE)
        await tolgeeService.deleteTranslation(shippingOption.id)
      })


      test("subscriber created translation + link works", async () => {
        const query = appContainer.resolve(ContainerRegistrationKeys.QUERY)
        const { data: shippingOptions } = await query.graph({
          entity: "shipping_option",
          fields: ["translations.*"],
          filters: { id: shippingOption.id },
        })

        expect(shippingOptions).toHaveLength(1)
        expect(shippingOptions[0]).toHaveProperty("translations")
        expect(shippingOptions[0].translations).toMatchObject({
          id: shippingOption.id,
          it: { name: "Test shipping option" }
        })
      })

      describe("GET /store/shipping-options", () => {
        it("should get translated shipping options for a cart successfully", async () => {
          const shippingOptions = (await api.get(
            `/store/shipping-options/tolgee?cart_id=${cart.id}`,
            storeHeaders
          )).data.shipping_options

          expect(shippingOptions).toHaveLength(1)
          expect(shippingOptions[0]).toHaveProperty("translations")
          expect(shippingOptions[0].translations).toEqual(
            expect.objectContaining({
              id: shippingOption.id,
              it: { name: "Test shipping option" }
            })
          )
        })
      })
    })

    describe("Product + variant + options + option values", () => {
      let product: ProductDTO

      beforeAll(async () => {
        const subscriberExecution = TestEventUtils.waitSubscribersExecution("product.created", eventBus)
        product = (
          await api.post(
            `/admin/products`,
            {
              title: "Test product",
              options: [
                {
                  title: "Size",
                  values: ["S"],
                },
              ],
              variants: [
                {
                  title: "Test variant",
                  prices: [
                    {
                      currency_code: "usd",
                      amount: 1000,
                    }
                  ]
                }
              ]
            },
            adminHeaders
          )
        ).data.product
        await subscriberExecution

      })

      afterAll(async () => {
        const tolgeeService = appContainer.resolve(TOLGEE_MODULE)
        await tolgeeService.deleteTranslation(product.id)
      })

      describe("Product", () => {
        test("subscriber created translation + link works", async () => {
          const query = appContainer.resolve(ContainerRegistrationKeys.QUERY)
          const { data: products } = await query.graph({
            entity: "product",
            fields: ["translations.*"],
            filters: { id: product.id },
          })

          expect(products).toHaveLength(1)
          expect(products[0]).toHaveProperty("translations")
          expect(products[0].translations).toMatchObject({
            id: product.id,
            it: { title: "Test product" }
          })
        })
      })

      describe("Product variant", () => {
        test("subscriber created translation + link works", async () => {
          const query = appContainer.resolve(ContainerRegistrationKeys.QUERY)
          const { data: variants } = await query.graph({
            entity: "product_variants",
            fields: ["translations.*"],
            filters: { id: product.variants[0].id },
          })

          expect(variants).toHaveLength(1)
          expect(variants[0]).toHaveProperty("translations")
          expect(variants[0].translations).toMatchObject({
            id: product.variants[0].id,
            it: { title: "Test variant" }
          })
        })
      })

      describe("Product option", () => {
        test("subscriber created translation + link works", async () => {
          const query = appContainer.resolve(ContainerRegistrationKeys.QUERY)
          const { data: options } = await query.graph({
            entity: "product_options",
            fields: ["translations.*"],
            filters: { id: product.options[0].id },
          })

          expect(options).toHaveLength(1)
          expect(options[0]).toHaveProperty("translations")
          expect(options[0].translations).toMatchObject({
            id: product.options[0].id,
            it: { title: "Size" }
          })
        })
      })
      describe("Product option values", () => {
        test("subscriber created translation + link works", async () => {
          const query = appContainer.resolve(ContainerRegistrationKeys.QUERY)
          const { data: values } = await query.graph({
            entity: "product_option_values",
            fields: ["translations.*"],
            filters: { id: product.options[0].values[0].id },
          })

          expect(values).toHaveLength(1)
          expect(values[0]).toHaveProperty("translations")
          expect(values[0].translations).toMatchObject({
            id: product.options[0].values[0].id,
            it: { value: "S" }
          })
        })
      })
    })

    describe("Product Category", () => {
      let category: ProductCategoryDTO

      beforeAll(async () => {
        const subscriberExecution = TestEventUtils.waitSubscribersExecution("product-category.created", eventBus)
        category = (
          await api.post(
            `/admin/product-categories`,
            {
              name: "Test category"
            },
            adminHeaders
          )
        ).data.product_category
        await subscriberExecution

      })

      afterAll(async () => {
        const tolgeeService = appContainer.resolve(TOLGEE_MODULE)
        await tolgeeService.deleteTranslation(category.id)
      })

      test("subscriber created translation + link works", async () => {
        const query = appContainer.resolve(ContainerRegistrationKeys.QUERY)
        const { data: categories } = await query.graph({
          entity: "product_categories",
          fields: ["translations.*"],
          filters: { id: category.id },
        })

        expect(categories).toHaveLength(1)
        expect(categories[0]).toHaveProperty("translations")
        expect(categories[0].translations).toMatchObject({
          id: category.id,
          it: { name: "Test category" }
        })

      })
    })

    describe("Product Collection", () => {
      let collection: ProductCollectionDTO

      beforeAll(async () => {
        const subscriberExecution = TestEventUtils.waitSubscribersExecution("product-collection.created", eventBus)
        collection = (
          await api.post(
            `/admin/collections`,
            {
              title: "Test collection"
            },
            adminHeaders
          )
        ).data.collection
        await subscriberExecution

      })

      afterAll(async () => {
        const tolgeeService = appContainer.resolve(TOLGEE_MODULE)
        await tolgeeService.deleteTranslation(collection.id)
      })

      test("subscriber created translation + link works", async () => {
        const query = appContainer.resolve(ContainerRegistrationKeys.QUERY)
        const { data: collections } = await query.graph({
          entity: "product_collections",
          fields: ["translations.*"],
          filters: { id: collection.id },
        })

        expect(collections).toHaveLength(1)
        expect(collections[0]).toHaveProperty("translations")
        expect(collections[0].translations).toMatchObject({
          id: collection.id,
          it: { title: "Test collection" }
        })

      })
    })

    describe("Product Type", () => {
      let type: ProductTypeDTO

      beforeAll(async () => {
        const subscriberExecution = TestEventUtils.waitSubscribersExecution("product-type.created", eventBus)
        type = (
          await api.post(
            `/admin/product-types`,
            {
              value: "Test type"
            },
            adminHeaders
          )
        ).data.product_type
        await subscriberExecution

      })

      afterAll(async () => {
        const tolgeeService = appContainer.resolve(TOLGEE_MODULE)
        await tolgeeService.deleteTranslation(type.id)
      })

      test("subscriber created translation + link works", async () => {
        const query = appContainer.resolve(ContainerRegistrationKeys.QUERY)
        const { data: types } = await query.graph({
          entity: "product_types",
          fields: ["translations.*"],
          filters: { id: type.id },
        })

        expect(types).toHaveLength(1)
        expect(types[0]).toHaveProperty("translations")
        expect(types[0].translations).toMatchObject({
          id: type.id,
          it: { value: "Test type" }
        })

      })
    })

    describe("Product Tag", () => {
      let tag: ProductTagDTO

      beforeAll(async () => {
        const subscriberExecution = TestEventUtils.waitSubscribersExecution("product-tag.created", eventBus)
        tag = (
          await api.post(
            `/admin/product-tags`,
            {
              value: "Test tag"
            },
            adminHeaders
          )
        ).data.product_tag
        await subscriberExecution

      })

      afterAll(async () => {
        const tolgeeService = appContainer.resolve(TOLGEE_MODULE)
        await tolgeeService.deleteTranslation(tag.id)
      })

      test("subscriber created translation + link works", async () => {
        const query = appContainer.resolve(ContainerRegistrationKeys.QUERY)
        const { data: tags } = await query.graph({
          entity: "product_tags",
          fields: ["translations.*"],
          filters: { id: tag.id },
        })

        expect(tags).toHaveLength(1)
        expect(tags[0]).toHaveProperty("translations")
        expect(tags[0].translations).toMatchObject({
          id: tag.id,
          it: { value: "Test tag" }
        })

      })
    })
  },
})

async function getAdminToken(appContainer: MedusaContainer, adminHeaders: { headers: {} }) {
  const authModuleService = appContainer.resolve(Modules.AUTH)
  const userModuleService = appContainer.resolve(Modules.USER)
  const user = await userModuleService.createUsers({ email: "admin@medusa.js" })
  const authIdentity = await authModuleService.createAuthIdentities({
    provider_identities: [
      {
        provider: "emailpass",
        entity_id: "admin@medusa.js",
        provider_metadata: {
          password: "supersecret",
        },
      },
    ],
    app_metadata: {
      user_id: user.id,
    },
  })

  const token = jwt.sign(
    {
      actor_id: user.id,
      actor_type: "user",
      auth_identity_id: authIdentity.id,
    },
    "supersecret",
    {
      expiresIn: "1d",
    }
  )
  adminHeaders.headers["authorization"] = `Bearer ${token}`
}

async function getPublishableKey(appContainer: MedusaContainer, storeHeaders: { headers: {} }) {
  const publishableKey = await appContainer.resolve(Modules.API_KEY).createApiKeys({
    title: "test publishable key",
    type: ApiKeyType.PUBLISHABLE,
    created_by: "test",
  })
  storeHeaders.headers[PUBLISHABLE_KEY_HEADER] = publishableKey.token
}

