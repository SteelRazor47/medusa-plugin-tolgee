import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from "axios";
import { InternalCacheRequestConfig } from "axios-cache-interceptor";
import Bottleneck from "bottleneck";
import DataLoader from "dataloader";

interface BatchingOptions {
  batchUrl: string | RegExp
  batchQueryParam: string; // The query parameter used for batching (e.g., 'filterNamespace')

  batchingDelayMilliseconds: number; // How long to wait to collect requests for a batch
  rateLimit: {
    maxRequests: number;
    perMilliseconds: number;
  };
}

export function setupBatchingAdapter(client: AxiosInstance, options: BatchingOptions) {
  const originalAdapter = client.defaults.adapter

  const limiter = new Bottleneck({
    reservoirRefreshAmount: options.rateLimit?.maxRequests ?? 15,
    reservoirRefreshInterval: options.rateLimit?.perMilliseconds ?? 3000,
  });

  const loader = new DataLoader<InternalAxiosRequestConfig, AxiosResponse>(
    async (configs) => {
      const queryValues = configs.map(r => r.params[options.batchQueryParam]).join(',')
      const batchConfig = { ...configs[0], adapter: originalAdapter }
      batchConfig.params = { ...batchConfig.params, [options.batchQueryParam]: queryValues }

      try {
        console.log(`Sending batched request for ${queryValues}`)
        // Schedule the API call through the rate limiter and execute with axios.
        // Note: we use the default axios client with the default adapter here to avoid infinite loops.
        const response = await limiter.schedule(() => axios.request(batchConfig));

        return configs.map(config => {
          const queryValue = config.params[options.batchQueryParam]
          const individualResponseData = {
            ...response.data,
            _embedded: {
              keys: response.data._embedded?.keys?.filter(k => k.keyNamespace == queryValue) ?? []
            }
          }

          return {
            ...response,
            data: individualResponseData,
            // the whole function should take an AxiosCacheInstance, but the type is outdated
            // TODO: remove type cast when type is fixed
            config: { ...response.config, id: (config as InternalCacheRequestConfig).id }
          }
        });
      } catch (error) {
        console.error(`Batch request failed for ${batchConfig.url}:`, error);
        const batchError = error instanceof Error ? error : new Error('Batch request failed');
        return configs.map(() => batchError)
      }
    },
    {
      batchScheduleFn: (callback) => setTimeout(callback, options.batchingDelayMilliseconds),
    }
  );

  client.defaults.adapter = (config) => {
    const queryValue = config?.params?.[options.batchQueryParam]

    if (!queryValue || !config.url?.match(options.batchUrl) || config.method != "get") {
      // fallback to the client's original adapter
      return axios.getAdapter(originalAdapter)(config)
    }

    console.log(`Requesting batch for ${queryValue}`)
    return loader.load(config);
  }
}
