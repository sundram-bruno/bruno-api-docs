import { cleanJson } from '@/scripting/utils/common';
import { marshallToVm } from '../../utils';

const METHODS = ['get', 'post', 'put', 'delete', 'patch'];
const METHODS_WITH_BODY = new Set(['post', 'put', 'patch']);
const UNSUPPORTED_METHODS = ['head', 'options', 'request', 'create', 'all'];

interface AxiosShimConfig {
  url?: string;
  method?: string;
  headers?: Record<string, string>;
  params?: Record<string, any>;
  data?: any;
  timeout?: number;
  auth?: { username?: string; password?: string };
  validateStatus?: ((status: number) => boolean) | null;
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

const encodeAxiosComponent = (value: string): string =>
  encodeURIComponent(value)
    .replace(/%3A/gi, ':')
    .replace(/%24/g, '$')
    .replace(/%2C/gi, ',')
    .replace(/%20/g, '+');

const isPlainObject = (value: any): boolean =>
  Object.prototype.toString.call(value) === '[object Object]';

const isVisitable = (value: any): boolean => isPlainObject(value) || Array.isArray(value);

const isFlatArray = (value: any): boolean => Array.isArray(value) && !value.some(isVisitable);

const removeBrackets = (key: string): string => (key.endsWith('[]') ? key.slice(0, -2) : key);

const renderParamKey = (path: (string | number)[], key: string | number): string => {
  if (path.length === 0) {
    return `${key}`;
  }
  return [...path, key]
    .map((token, index) => {
      const cleaned = typeof token === 'string' ? removeBrackets(token) : token;
      return index ? `[${cleaned}]` : `${cleaned}`;
    })
    .join('');
};

const convertParamValue = (value: any): string => {
  if (value === null) return '';
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'boolean') return value.toString();
  return String(value);
};

const serializeAxiosParams = (params: Record<string, any>): string => {
  const pairs: [string, string][] = [];

  const build = (value: any, path: (string | number)[]) => {
    const entries: [string | number, any][] = Array.isArray(value)
      ? value.map((element, index): [number, any] => [index, element])
      : Object.keys(value).map((objectKey): [string, any] => [objectKey, value[objectKey]]);

    entries.forEach(([key, element]) => {
      if (element === undefined || element === null) {
        return;
      }
      visit(element, typeof key === 'string' ? key.trim() : key, path);
    });
  };

  const visit = (value: any, key: string | number, path: (string | number)[]) => {
    if (path.length === 0 && Array.isArray(value)) {
      const keyIsBracketed = typeof key === 'string' && key.endsWith('[]');
      if (isFlatArray(value) || keyIsBracketed) {
        const baseKey = typeof key === 'string' ? removeBrackets(key) : key;
        value.forEach((element: any) => {
          if (element === undefined || element === null) {
            return;
          }
          pairs.push([`${baseKey}[]`, convertParamValue(element)]);
        });
        return;
      }
    }
    if (isVisitable(value)) {
      build(value, path.length ? [...path, key] : [key]);
      return;
    }
    pairs.push([renderParamKey(path, key), convertParamValue(value)]);
  };

  build(params, []);

  return pairs
    .map(([key, value]) => `${encodeAxiosComponent(key)}=${encodeAxiosComponent(value)}`)
    .join('&');
};

const buildRequestUrl = (config: AxiosShimConfig): string => {
  let url = config.url || '';
  if (!config.params || typeof config.params !== 'object') {
    return url;
  }
  const queryString = serializeAxiosParams(config.params);
  if (!queryString) {
    return url;
  }
  const hashIndex = url.indexOf('#');
  if (hashIndex !== -1) {
    url = url.slice(0, hashIndex);
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
  const text = await response.text();
  if (text.length) {
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  }
  return text;
};

const performAxiosRequest = async (config: AxiosShimConfig) => {
  if (typeof config.url !== 'string' || !/^https?:\/\//i.test(config.url.trim())) {
    throw buildAxiosError(
      { message: `Only absolute http(s) URLs are supported here, received: ${String(config.url)}`, code: 'ERR_INVALID_URL' },
      config
    );
  }

  const headers: Record<string, string> = { ...(config.headers || {}) };

  if (config.auth?.username !== undefined) {
    headers['Authorization'] = 'Basic ' + btoa(`${config.auth.username || ''}:${config.auth.password || ''}`);
  }

  const method = (config.method || 'get').toUpperCase();
  const methodAllowsBody = method !== 'GET' && method !== 'HEAD';

  let body: string | undefined;
  if (methodAllowsBody && config.data !== undefined && config.data !== null) {
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
    method,
    headers,
    // 'omit' so a published script can never use the reader's cookies to call the docs site itself
    credentials: 'omit',
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
        cause: `${err?.name || 'Error'}: ${err?.message || String(err)}`,
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

  const acceptStatus = (status: number): boolean => {
    if (typeof config.validateStatus === 'function') {
      return config.validateStatus(status);
    }
    if (config.validateStatus === null) {
      return true;
    }
    return status >= 200 && status < 300;
  };

  if (!acceptStatus(response.status)) {
    throw buildAxiosError(
      {
        message: `Request failed with status code ${response.status}`,
        code: response.status >= 400 && response.status < 500 ? 'ERR_BAD_REQUEST' : 'ERR_BAD_RESPONSE',
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

  return {
    status: response.status,
    statusText: response.statusText,
    headers: responseHeaders,
    data,
    config: { url: config.url, method: config.method, headers: config.headers, data: config.data }
  };
};

const configArgIndex = (method: string | null, nativeArgs: any[]): number => {
  if (method === null) {
    return typeof nativeArgs[0] === 'string' ? 1 : 0;
  }
  return METHODS_WITH_BODY.has(method) ? 2 : 1;
};

const addAxiosShimToContext = (vm: any) => {
  const bridgeValidateStatus = (config: AxiosShimConfig, configHandle: any, nativeConfig: any): any => {
    if (!configHandle || !nativeConfig || typeof nativeConfig !== 'object') {
      return null;
    }
    const propHandle = vm.getProp(configHandle, 'validateStatus');
    if (vm.typeof(propHandle) !== 'function') {
      propHandle.dispose();
      return null;
    }
    config.validateStatus = (status: number): boolean => {
      const statusHandle = vm.newNumber(status);
      const callResult = vm.callFunction(propHandle, vm.undefined, statusHandle);
      statusHandle.dispose();
      if (callResult.error) {
        const error = vm.dump(callResult.error);
        callResult.error.dispose();
        throw error;
      }
      const accepted = vm.dump(callResult.value);
      callResult.value.dispose();
      return Boolean(accepted);
    };
    return propHandle;
  };

  const registerAxiosFunction = (name: string, method: string | null) => {
    const fnHandle = vm.newFunction(name, (...args: any[]) => {
      const nativeArgs = args.map(vm.dump);
      const config = normalizeArgs(method, nativeArgs);
      const configIndex = configArgIndex(method, nativeArgs);
      const validateStatusHandle = bridgeValidateStatus(config, args[configIndex], nativeArgs[configIndex]);
      const promise = vm.newPromise();
      performAxiosRequest(config)
        .then((response) => {
          promise.resolve(marshallToVm(cleanJson(response), vm));
        })
        .catch((err) => {
          promise.reject(marshallToVm(cleanJson(err), vm));
        })
        .finally(() => {
          if (validateStatusHandle) {
            validateStatusHandle.dispose();
          }
        });
      promise.settled.then(vm.runtime.executePendingJobs);
      return promise.handle;
    });
    fnHandle.consume((handle: any) => vm.setProp(vm.global, name, handle));
  };

  registerAxiosFunction('__bruno__axios', null);
  METHODS.forEach((method) => registerAxiosFunction(`__bruno__axios__${method}`, method));

  const bootResult = vm.evalCode(`
    globalThis.axios = __bruno__axios;
    ${METHODS.map((method) => `globalThis.axios.${method} = __bruno__axios__${method};`).join('\n')}
    ${UNSUPPORTED_METHODS.map((method) => `globalThis.axios.${method} = () => {
      throw new Error("axios.${method} is not supported in the docs playground; use axios(config) or axios.get/post/put/patch/delete.");
    };`).join('\n')}
    globalThis.requireObject = {
      ...globalThis.requireObject,
      axios: globalThis.axios,
    };
  `);
  if (bootResult.error) {
    const error = vm.dump(bootResult.error);
    bootResult.error.dispose();
    throw new Error(`Failed to install axios shim: ${error?.message || String(error)}`);
  }
  bootResult.value.dispose();
};

export default addAxiosShimToContext;
export { serializeAxiosParams, performAxiosRequest };
