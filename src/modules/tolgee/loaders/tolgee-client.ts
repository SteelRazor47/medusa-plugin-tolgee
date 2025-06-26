import {
  LoaderOptions,
} from "@medusajs/framework/types"
import { MedusaError } from "@medusajs/utils";
import axios from "axios";
import { AxiosCacheInstance, setupCache } from 'axios-cache-interceptor';
import { TolgeeModuleConfig } from "../service";
import { asValue } from "awilix";
import { setupBatching } from "./interceptors/axios-batching";
import axiosRateLimit from "axios-rate-limit"

export default async function tolgeeClientLoader({
  container,
  options,
}: LoaderOptions<TolgeeModuleConfig>) {
  if (!options)
    throw new MedusaError(
      MedusaError.Types.UNEXPECTED_STATE,
      `Failed to load Tolgee module: no options provided`
    );

  try {
    // The request is first checked in cache. 
    // If it's a hit, the batching intercetor is skipped and the cache response interceptor handles it.
    // If it isn't cached, the batching interceptor hijacks the adapter, where it creates a single 
    //    batched request using a different axios client(rate limited).
    //    It then resolves all batched promises and fixes their ids, so that they can be handled 
    //    correctly by the cache response interceptor
    // NOTE: axios interceptors are LIFO for request, FIFO for response. Batching needs to be setup before caching
    const client = axios.create({
      baseURL: `${options.baseURL}/v2/projects/${options.projectId}`,
      headers: {
        Accept: "application/json",
        "X-API-Key": options.apiKey,
      },
      maxBodyLength: Infinity,
    })

    // Used internally by the batching interceptor
    const innerClient = axiosRateLimit(client.create(), {
      // Tolgee default rate limit is 400/m per user == 20/3sec
      // Default rate limit is set to 75% (15/3s) to have some margin
      maxRequests: options.rateLimit?.maxRequests ?? 15,
      perMilliseconds: options.rateLimit?.perMilliseconds ?? 3000
    })
    // Required cast, as the client is not yet a cached instance
    setupBatching(client as AxiosCacheInstance, {
      targetUrl: /translations.*/,
      paramToBatch: "filterNamespace",
      innerClient,
      batchingDelayMilliseconds: options.batchingDelayMilliseconds ?? 50
    })
    // TODO: axios-cache-interceptor type mismatch
    const cachedClient = setupCache(client as any, {
      ttl: options.ttl ?? 1000 * 60 * 5, // default 5min
      methods: ['get'],
      // If the server sends `Cache-Control: no-cache` or `no-store`, this can prevent caching.
      // Set to false for the ttl to always take precedence.
      interpretHeader: false,
    })

    container.register("tolgeeClient", asValue(cachedClient))
  } catch (error) {
    throw new MedusaError(
      MedusaError.Types.UNEXPECTED_STATE,
      `Failed to instantiate the axios client for Tolgee: ${error.message}`
    );
  }
}
