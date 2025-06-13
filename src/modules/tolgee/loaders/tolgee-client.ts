import {
  LoaderOptions,
} from "@medusajs/framework/types"
import { MedusaError } from "@medusajs/utils";
import axios from "axios";
import { AxiosCacheInstance, setupCache } from 'axios-cache-interceptor';
import { TolgeeModuleConfig } from "../service";
import { asValue } from "awilix";
import { axiosRateLimit } from "./interceptors/axios-rate-limit";

export default async function tolgeeClientLoader({
  container,
  options,
}: LoaderOptions<TolgeeModuleConfig>) {
  if (!options)
    throw new MedusaError(
      MedusaError.Types.UNEXPECTED_STATE,
      `Failed to load Tolgee module: no options provided`
    );

  let tolgeeClient: AxiosCacheInstance
  try {
    const client = axios.create({
      baseURL: `${options.baseURL}/v2/projects/${options.projectId}`,
      headers: {
        Accept: "application/json",
        "X-API-Key": options.apiKey,
      },
      maxBodyLength: Infinity,
    })
    const rateLimitedClient = axiosRateLimit(client, {
      // Tolgee default rate limit is 400/m per user == 20/3sec
      // Default rate limit is set to 75% (15/3s) to have some margin
      maxRequests: options.rateLimit?.maxRequests ?? 15,
      perMilliseconds: options.rateLimit?.perMilliseconds ?? 3000
    })
    tolgeeClient = setupCache(rateLimitedClient, {
      ttl: options.ttl ?? 1000 * 60 * 5, // default 5min
      methods: ['get'],
      // If the server sends `Cache-Control: no-cache` or `no-store`, this can prevent caching.
      // Set to false for the ttl to always take precedence.
      interpretHeader: false,
    })

    container.register("tolgeeClient", asValue(tolgeeClient))
  } catch (error) {
    throw new MedusaError(
      MedusaError.Types.UNEXPECTED_STATE,
      `Failed to instantiate the axios client for Tolgee: ${error.message}`
    );
  }
}
