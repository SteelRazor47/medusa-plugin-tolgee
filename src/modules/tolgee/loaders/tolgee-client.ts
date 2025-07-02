import {
  LoaderOptions,
} from "@medusajs/framework/types"
import { MedusaError } from "@medusajs/utils";
import axios from "axios";
import { setupCache } from 'axios-cache-interceptor';
import { TolgeeModuleConfig } from "../service";
import { asValue } from "awilix";
import { setupBatchingAdapter } from "./interceptors/batching-adapter";

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
    // If the result is cached, axios-cache-interceptor simply replaces the adapter with one that resolves immediately
    // We can do the same with the default adapter, which will be called for cache misses.
    const client = axios.create({
      baseURL: `${options.baseURL}/v2/projects/${options.projectId}`,
      headers: {
        Accept: "application/json",
        "X-API-Key": options.apiKey,
      },
      maxBodyLength: Infinity,
    })

    setupBatchingAdapter(client, {
      batchUrl: "/translations",
      batchQueryParam: "filterNamespace",
      batchingDelayMilliseconds: options.batchingDelayMilliseconds ?? 50,
      rateLimit: {
        maxRequests: options.rateLimit?.maxRequests ?? 15,
        perMilliseconds: options.rateLimit?.perMilliseconds ?? 3000
      }
    })
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
