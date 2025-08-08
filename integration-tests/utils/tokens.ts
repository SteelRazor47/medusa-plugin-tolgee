import { MedusaContainer } from "@medusajs/medusa";
import { Modules, ApiKeyType, PUBLISHABLE_KEY_HEADER } from "@medusajs/utils";
import jwt from "jsonwebtoken";


export async function getAdminToken(appContainer: MedusaContainer, adminHeaders: { headers: {} }) {
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
export async function getPublishableKey(appContainer: MedusaContainer, storeHeaders: { headers: {} }) {
    const publishableKey = await appContainer.resolve(Modules.API_KEY).createApiKeys({
        title: "test publishable key",
        type: ApiKeyType.PUBLISHABLE,
        created_by: "test",
    })
    storeHeaders.headers[PUBLISHABLE_KEY_HEADER] = publishableKey.token
}
