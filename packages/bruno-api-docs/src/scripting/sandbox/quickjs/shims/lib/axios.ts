import { cleanJson } from '@/scripting/utils/common';
import { marshallToVm } from '../../utils';

const METHODS = ['get', 'post', 'put', 'delete', 'patch'];
const METHODS_WITH_BODY = new Set(['post', 'put', 'patch']);

interface AxiosShimConfig {
  url?: string;
  method?: string;
  headers?: Record<string, string>;
  params?: Record<string, any>;
  data?: any;
  timeout?: number;
  auth?: { username?: string; password?: string };
}

const normalizeArgs = (method: string | null, args: any[]): AxiosShimConfig => {
  if (method === null) {
    if (typeof args[0] === 'string') {
      return { ...(args[1] || {}), url: args[0], method: (args[1]?.method || 'get') };
    }
    return { method: 'get', ...(args[0] || {}) };
  }

  if (METHODS_WITH_BODY.has(method)) {
    return { ...(args[2] || {}), url: args[0], data: args[1], method };
  }
  return { ...(args[1] || {}), url: args[0], method };
};

const buildRequestUrl = (config: AxiosShimConfig): string => {
  const url = config.url || '';
  if (!config.params || typeof config.params !== 'object') {
    return url;
  }

  const query = new URLSearchParams();
  Object.entries(config.params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      query.append(key, String(value));
    }
  });
  const queryString = query.toString();
  if (!queryString) {
    return url;
  }
  return url + (url.includes('?') ? '&' : '?') + queryString;
};

const buildAxiosError = (partial: Record<string, any>, config: AxiosShimConfig) => {
  return {
    isAxiosError: true,
    ...partial,
    config: {
      url: config.url,
      method: config.method,
      headers: config.headers,
      data: config.data
    }
  };
};

const parseResponseData = async (response: Response) => {
  const contentType = response.headers.get('content-type') || '';
  const text = await response.text();
  if (contentType.includes('json') && text.length) {
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  }
  return text;
};

const performAxiosRequest = async (config: AxiosShimConfig) => {
  if (typeof config.url !== 'string' || config.url.trim() === '') {
    throw buildAxiosError({ message: `Invalid URL: ${String(config.url)}`, code: 'ERR_INVALID_URL' }, config);
  }

  const headers: Record<string, string> = { ...(config.headers || {}) };

  if (config.auth?.username !== undefined) {
    headers['Authorization'] = 'Basic ' + btoa(`${config.auth.username || ''}:${config.auth.password || ''}`);
  }

  let body: string | undefined;
  if (config.data !== undefined && config.data !== null) {
    if (typeof config.data === 'object') {
      body = JSON.stringify(config.data);
      const hasContentType = Object.keys(headers).some((key) => key.toLowerCase() === 'content-type');
      if (!hasContentType) {
        headers['Content-Type'] = 'application/json';
      }
    } else {
      body = String(config.data);
    }
  }

  const fetchOptions: RequestInit = {
    method: (config.method || 'get').toUpperCase(),
    headers,
    ...(body !== undefined && { body }),
    ...(config.timeout && { signal: AbortSignal.timeout(config.timeout) })
  };

  let response: Response;
  try {
    response = await fetch(buildRequestUrl(config), fetchOptions);
  } catch (err: any) {
    if (err?.name === 'TimeoutError') {
      throw buildAxiosError({ message: `timeout of ${config.timeout}ms exceeded`, code: 'ECONNABORTED' }, config);
    }
    throw buildAxiosError(
      {
        message: 'Network Error',
        code: 'ERR_NETWORK',
        hint: 'The browser blocked or failed the request. If the API works in this Bruno app, the server may not allow cross-origin (CORS) requests from this docs site.'
      },
      config
    );
  }

  const responseHeaders: Record<string, string> = {};
  response.headers.forEach((value, key) => {
    responseHeaders[key] = value;
  });
  const data = await parseResponseData(response);

  if (response.status < 200 || response.status >= 300) {
    throw buildAxiosError(
      {
        message: `Request failed with status code ${response.status}`,
        code: response.status >= 500 ? 'ERR_BAD_RESPONSE' : 'ERR_BAD_REQUEST',
        response: {
          status: response.status,
          statusText: response.statusText,
          headers: responseHeaders,
          data
        }
      },
      config
    );
  }

  return { status: response.status, headers: responseHeaders, data };
};

const addAxiosShimToContext = (vm: any) => {
  const registerAxiosFunction = (name: string, method: string | null) => {
    const fnHandle = vm.newFunction(name, (...args: any[]) => {
      const nativeArgs = args.map(vm.dump);
      const config = normalizeArgs(method, nativeArgs);
      const promise = vm.newPromise();
      performAxiosRequest(config)
        .then((response) => {
          promise.resolve(marshallToVm(cleanJson(response), vm));
        })
        .catch((err) => {
          promise.reject(marshallToVm(cleanJson(err), vm));
        });
      promise.settled.then(vm.runtime.executePendingJobs);
      return promise.handle;
    });
    fnHandle.consume((handle: any) => vm.setProp(vm.global, name, handle));
  };

  registerAxiosFunction('__bruno__axios', null);
  METHODS.forEach((method) => registerAxiosFunction(`__bruno__axios__${method}`, method));

  vm.evalCode(`
    globalThis.axios = __bruno__axios;
    ${METHODS.map((method) => `globalThis.axios.${method} = __bruno__axios__${method};`).join('\n')}
    globalThis.requireObject = {
      ...globalThis.requireObject,
      axios: globalThis.axios,
    };
  `);
};

export default addAxiosShimToContext;
