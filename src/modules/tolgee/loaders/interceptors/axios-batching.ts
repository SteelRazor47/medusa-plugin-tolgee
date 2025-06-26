import { AxiosInstance } from "axios";
import { AxiosCacheInstance } from "axios-cache-interceptor";

type BatchingOptions = {
  innerClient: AxiosInstance,
  targetUrl: string | RegExp
  paramToBatch: string
  batchingDelayMilliseconds: number
}

export function setupBatching(client: AxiosCacheInstance, options: BatchingOptions) {
  const interceptor = batchingRequestInterceptor(client, options)
  client.interceptors.request.use(interceptor)
}

function batchingRequestInterceptor(client: AxiosCacheInstance, {
  targetUrl,
  paramToBatch,
  batchingDelayMilliseconds,
  innerClient
}: BatchingOptions) {
  // This will store pending requests, keyed by the endpoint URL.
  // Structure: { [url]: { timer: Timeout, requests: [...] } }
  const requestQueue = new Map();

  // TODO: config, typing, mismatch with axios-cache-interceptor
  return async function (config) {
    let cache = await client.storage.get(config.id, config);
    if (cache.state === "cached")
      return config

    const urlMatches = (typeof targetUrl === 'string' && config.url === targetUrl) ||
      (targetUrl instanceof RegExp && targetUrl.test(config.url));
    const paramValue = config.params?.[paramToBatch];

    // If the URL doesn't match, or it's not a GET request, or the param is missing,
    // let the request proceed as normal.
    if (!urlMatches || config.method !== 'get' || !config.params || !paramValue) {
      return config;
    }

    const endpointUrl = config.url;

    // This is the core of the interceptor: instead of letting the request
    // go through, we return a new Promise. We will resolve or reject this
    // promise later when the batched request completes.
    config.adapter = function batchedAdapter() {
      return new Promise((resolve, reject) => {
        // If no batch is currently scheduled for this endpoint, create one.
        if (!requestQueue.has(endpointUrl)) {
          requestQueue.set(endpointUrl, {
            timer: null,
            requests: [],
            originalConfigs: []
          });

          const batch = requestQueue.get(endpointUrl);

          // Set a timer. When it fires, we'll send the batched request.
          batch.timer = setTimeout(async () => {
            // Reset the queue for this endpoint
            const { requests: batchedRequests, originalConfigs } = requestQueue.get(endpointUrl);
            requestQueue.delete(endpointUrl);

            if (batchedRequests.length === 0) return;

            try {
              // Use the config of the first request as a template.
              const baseConfig = originalConfigs[0];

              // Collect all the parameter values from the queued requests.
              const allParamValues = batchedRequests.map(req => req.paramValue);

              // Create a new config for the batched request.
              const batchedConfig = {
                ...baseConfig,
                params: {
                  ...baseConfig.params,
                  // Concatenate the values with a comma.
                  [paramToBatch]: allParamValues.join(','),
                },
                adapter: undefined,
              };

              // IMPORTANT: We need to use a clean Axios instance or temporarily
              // remove the interceptor to avoid an infinite loop of batching.
              // The simplest way is to create a new instance on the fly.
              const response = await innerClient(batchedConfig);

              // --- Response Handling ---
              // The API is expected to return a result that can be mapped back
              // to the original requests. We assume an object where keys are the
              // parameter values.
              // e.g., for ids 1,2,3, response.data = { "1": {...}, "2": {...}, "3": {...} }
              const results = response.data;

              batchedRequests.forEach(req => {
                const resultForReq = JSON.parse(JSON.stringify(results))
                if (!resultForReq._embedded)
                  resultForReq._embedded = {}
                resultForReq._embedded.keys = resultForReq?._embedded?.keys?.filter(k => k.keyNamespace == req.paramValue) ?? []
                const config = {
                  ...response.config,
                  params: {
                    ...response.config.params,
                    [paramToBatch]: req.paramValue
                  }
                } as any
                delete config.id
                const id = client.generateKey(config)
                config.id = id
                if (resultForReq) {
                  // Resolve each original promise with its corresponding data.
                  // We create a new response object to avoid mutation issues.
                  req.resolve({
                    ...response,
                    id,
                    config,
                    data: resultForReq,
                  });
                } else {
                  // If a specific result is missing, reject that promise.
                  req.reject(new Error(`No data returned for ${paramToBatch}: ${req.paramValue}`));
                }
              });

            } catch (error) {
              console.error("Tolgee batched request failed:", error);
              // If the whole batch fails, reject all original promises.
              batchedRequests.forEach(req => req.reject(error));
            }
          }, batchingDelayMilliseconds);
        }

        // Add the current request's details to the queue for its endpoint.
        const batch = requestQueue.get(endpointUrl);
        batch.requests.push({
          paramValue,
          resolve,
          reject,
        });
        // Store the original config to use as a template for the batched call.
        batch.originalConfigs.push(config);
      });
    }

    return config
  };
}
