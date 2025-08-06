import { MedusaContainer } from "@medusajs/medusa"
import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { ApiKeyType, ContainerRegistrationKeys, Modules, PUBLISHABLE_KEY_HEADER } from "@medusajs/utils"
import jwt from "jsonwebtoken"
import { TOLGEE_MODULE } from "medusa-plugin-tolgee"

jest.setTimeout(60000)

medusaIntegrationTestRunner({
  testSuite: ({ getContainer, api }) => {
    describe("Shipping Option", () => {
      let salesChannel
      let region
      let shippingOption

      let appContainer: MedusaContainer
      const storeHeaders = { headers: {} }
      const adminHeaders = { headers: {} }

      beforeAll(async () => {
        appContainer = getContainer()
      })

      beforeEach(async () => {
        const authModuleService = appContainer.resolve("auth")
        const userModuleService = appContainer.resolve("user")

        await Promise.all([
          getPublishableKey(appContainer, storeHeaders),
          getAdminToken(userModuleService, authModuleService, adminHeaders)
        ])

        let shippingProfile
        let stockLocation
        [region, shippingProfile, salesChannel, stockLocation] = await Promise.all([
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

        const [fulfillmentSets] = await Promise.all([
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

      afterEach(async () => {
        const tolgeeService = appContainer.resolve(TOLGEE_MODULE)
        await tolgeeService.deleteTranslation(shippingOption.id)
      })

      describe("Subscribers", () => {
        test("shipping option has translations", async () => {
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
      })

      describe("GET /store/shipping-options?cart_id=", () => {
        it("should get translated shipping options for a cart successfully", async () => {
          const cart = (await api.post(
            `/store/carts`,
            {
              region_id: region.id,
              sales_channel_id: salesChannel.id,
              currency_code: "usd",
              email: "test@admin.com",
              items: [],
            },
            storeHeaders
          )).data.cart

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
  },
})

async function getAdminToken(userModuleService, authModuleService, adminHeaders: { headers: {} }) {
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

