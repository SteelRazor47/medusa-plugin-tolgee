import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { ApiKeyType, Modules, PUBLISHABLE_KEY_HEADER } from "@medusajs/utils"
import jwt from "jsonwebtoken"
import { TOLGEE_MODULE } from "medusa-plugin-tolgee"

jest.setTimeout(60000)

const env = { MEDUSA_FF_MEDUSA_V2: true }
const adminHeaders = { headers: {} }// "x-medusa-access-token": "test_token" } }

medusaIntegrationTestRunner({
  env,
  testSuite: ({ dbConnection, getContainer, api }) => {
    describe("Store: Shipping Option API", () => {
      let salesChannel
      let region
      let product
      let stockLocation
      let shippingProfile
      let fulfillmentSet
      let cart
      let shippingOption
      let storeHeaders

      beforeAll(async () => {
        const publishableKey = await getContainer().resolve(Modules.API_KEY).createApiKeys({
          title: "test publishable key",
          type: ApiKeyType.PUBLISHABLE,
          created_by: "test",
        })
        storeHeaders = {
          headers: {
            [PUBLISHABLE_KEY_HEADER]: publishableKey.token,
          },
        }

        const container = getContainer()

        const authModuleService = container.resolve("auth")
        const userModuleService = container.resolve("user")

        const user = await userModuleService.createUsers({
          email: "admin@medusa.js",

        })
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

        region = (
          await api.post(
            "/admin/regions",
            { name: "US", currency_code: "usd", countries: ["US"] },
            adminHeaders
          )
        ).data.region

        shippingProfile = (
          await api.post(
            `/admin/shipping-profiles`,
            { name: "Test", type: "default" },
            adminHeaders
          )
        ).data.shipping_profile

        salesChannel = (
          await api.post(
            "/admin/sales-channels",
            { name: "first channel", description: "channel" },
            adminHeaders
          )
        ).data.sales_channel

        product = (
          await api.post(
            "/admin/products",
            {
              title: "Test fixture",
              options: [
                { title: "size", values: ["large", "small"] },
                { title: "color", values: ["green"] },
              ],
              shipping_profile_id: shippingProfile.id,
              variants: [
                {
                  title: "Test variant",
                  manage_inventory: false,
                  prices: [
                    {
                      currency_code: "usd",
                      amount: 100,
                    },
                    {
                      currency_code: "dkk",
                      amount: 100,
                    },
                  ],
                  options: {
                    size: "large",
                    color: "green",
                  },
                },
              ],
            },
            adminHeaders
          )
        ).data.product

        stockLocation = (
          await api.post(
            `/admin/stock-locations`,
            { name: "test location" },
            adminHeaders
          )
        ).data.stock_location

        await api.post(
          `/admin/stock-locations/${stockLocation.id}/sales-channels`,
          { add: [salesChannel.id] },
          adminHeaders
        )

        const fulfillmentSets = (
          await api.post(
            `/admin/stock-locations/${stockLocation.id}/fulfillment-sets?fields=*fulfillment_sets`,
            {
              name: "Test",
              type: "test-type",
            },
            adminHeaders
          )
        ).data.stock_location.fulfillment_sets

        fulfillmentSet = (
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

        await api.post(
          `/admin/stock-locations/${stockLocation.id}/fulfillment-providers`,
          { add: ["manual_manual"] },
          adminHeaders
        )

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
      })

      afterAll(async () => {
        const tolgeeService = getContainer().resolve(TOLGEE_MODULE)
        await Promise.all([
          tolgeeService.deleteTranslation(shippingOption.id),
          tolgeeService.deleteTranslation(product.id),
          tolgeeService.deleteTranslation(product.variants[0].id)
        ])
      })

      describe("GET /store/shipping-options?cart_id=", () => {
        it("should get shipping options for a cart successfully", async () => {
          cart = (
            await api.post(
              `/store/carts`,
              {
                region_id: region.id,
                sales_channel_id: salesChannel.id,
                currency_code: "usd",
                email: "test@admin.com",
                items: [
                  {
                    variant_id: product.variants[0].id,
                    quantity: 1,
                  },
                ],
              },
              storeHeaders
            )
          ).data.cart

          const resp = await api.get(
            `/store/shipping-options/tolgee?cart_id=${cart.id}`,
            storeHeaders
          )

          const shippingOptions = resp.data.shipping_options

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
  },
})

