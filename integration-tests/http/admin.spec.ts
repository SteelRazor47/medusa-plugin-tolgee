import { IEventBusModuleService, ProductCategoryDTO } from "@medusajs/framework/types"
import { MedusaContainer } from "@medusajs/medusa"
import { ContainerRegistrationKeys, Modules } from "@medusajs/utils"
import { medusaIntegrationTestRunnerManual } from "../utils/medusa-test-runner"
import { getPublishableKey, getAdminToken } from "../utils/tokens"
import { TestEventUtils } from "@medusajs/test-utils"
import { TOLGEE_MODULE } from "medusa-plugin-tolgee/.medusa/server/src/modules/tolgee"

jest.setTimeout(60000)

medusaIntegrationTestRunnerManual({
  testSuite: ({ getContainer, api }) => {
    let appContainer: MedusaContainer, eventBus: IEventBusModuleService
    const storeHeaders = { headers: {} }
    const adminHeaders = { headers: {} }

    let category: ProductCategoryDTO, category1: ProductCategoryDTO

    beforeAll(async () => {
      appContainer = getContainer()
      eventBus = appContainer.resolve(Modules.EVENT_BUS)

      await Promise.all([
        getPublishableKey(appContainer, storeHeaders),
        getAdminToken(appContainer, adminHeaders)
      ])

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
      await tolgeeService.deleteTranslation(category1.id)
    })

    it("GET /admin/tolgee/translation/:slug/:id", async () => {
      const response = await api.get(`/admin/tolgee/translation/product_category/${category.id}`, adminHeaders)

      expect(response.status).toEqual(200)
      expect(response.data).toMatchObject({
        keyNames: [
          `${category.id}.name`,
          `${category.id}.description`
        ]
      })
    })

    it("POST /admin/tolgee/translation/:slug", async () => {
      const subscriberExecution = TestEventUtils.waitSubscribersExecution("product-category.created", eventBus)

      category1 = await api.post(
        `/admin/product-categories`,
        {
          name: "Test category 1"
        },
        adminHeaders
      ).then((res) => res.data.product_category)

      await subscriberExecution

      await api.delete(`/admin/tolgee/translation/product_category/${category.id}`, adminHeaders)
      await api.delete(`/admin/tolgee/translation/product_category/${category1.id}`, adminHeaders)

      await api.post(`/admin/tolgee/translation/product_category`, {}, adminHeaders)
      for (const cat of [category, category1]) {
        const response = await api.get(`/admin/tolgee/translation/product_category/${cat.id}`, adminHeaders)

        expect(response.status).toEqual(200)
        expect(response.data).toMatchObject({
          keyNames: [
            `${cat.id}.name`,
            `${cat.id}.description`
          ]
        })
      }
    })

    it("POST /admin/tolgee/translation/:slug/:id", async () => {
      await api.delete(`/admin/tolgee/translation/product_category/${category.id}`, adminHeaders)

      await api.post(`/admin/tolgee/translation/product_category/${category.id}`, {}, adminHeaders)

      const response = await api.get(`/admin/tolgee/translation/product_category/${category.id}`, adminHeaders)

      expect(response.status).toEqual(200)
      expect(response.data).toMatchObject({
        keyNames: [
          `${category.id}.name`,
          `${category.id}.description`
        ]
      })

    })

    it("DELETE /admin/tolgee/translation/:slug/:id", async () => {
      await api.delete(`/admin/tolgee/translation/product_category/${category.id}`, adminHeaders)

      const response = await api.get(`/admin/tolgee/translation/product_category/${category.id}`, adminHeaders)

      expect(response.status).toEqual(200)
      expect(response.data).toMatchObject({ keyNames: [] })
    })

  }
})

