import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { ApiKeyDTO } from "@medusajs/framework/types"
import { createApiKeysWorkflow, createSalesChannelsWorkflow, linkSalesChannelsToApiKeyWorkflow } from "@medusajs/medusa/core-flows"

medusaIntegrationTestRunner({
  testSuite: ({ api, getContainer }) => {
    describe("Custom endpoints", () => {
      let pak: ApiKeyDTO
      beforeAll(async () => {
        pak = (await createApiKeysWorkflow(getContainer()).run({
          input: {
            api_keys: [
              {
                type: "publishable",
                title: "Test Key",
                created_by: "",
              },
            ],
          },
        })).result[0]
        const sc = (await createSalesChannelsWorkflow(getContainer()).run({
          input: {
            salesChannelsData: [
              {
                name: "default",
                description: "Default sales channel",
                is_disabled: false,
              },
            ],
          }
        })).result[0]
        await linkSalesChannelsToApiKeyWorkflow(getContainer()).run({
          input: {
            id: pak.id,
            add: [sc.id],
          },
        })
      })
      describe("GET /custom", () => {
        it("returns correct message", async () => {
          try {
            const response = await api.get(
              `/store/products`,
              {
                headers: {
                  "x-publishable-api-key": pak.token,
                },
              }
            )

            expect(response.status).toEqual(200)
          }
          catch (error) {
            console.error("Error during API request:", error)
            throw error
          }
        })
      })
    })
  },
})

jest.setTimeout(60 * 1000)