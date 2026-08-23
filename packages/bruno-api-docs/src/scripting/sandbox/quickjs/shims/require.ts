const NODE_BUILTIN_MODULES = [
  'assert', 'buffer', 'child_process', 'cluster', 'crypto', 'dgram', 'dns', 'events',
  'fs', 'http', 'http2', 'https', 'net', 'os', 'perf_hooks', 'process', 'querystring',
  'readline', 'stream', 'string_decoder', 'timers', 'tls', 'url', 'util', 'v8', 'vm',
  'worker_threads', 'zlib'
];

const DEVELOPER_MODE_LIBRARIES = [
  'lodash', 'cheerio', 'xml2js', 'node-fetch', 'yaml', 'json-query',
  'xml-formatter', 'chai-string', 'handlebars'
];

export const getRequireCode = () => `
  globalThis.require = (mod) => {
    const lib = globalThis.requireObject[mod];
    if (lib) {
      return lib;
    }

    const collectionCwd = bru.cwd();
    const isModuleAPath = (module) => (module?.startsWith('.') || (!!collectionCwd && module?.startsWith?.(collectionCwd)));
    if (isModuleAPath(mod)) {
      const localModuleCode = globalThis.__brunoLoadLocalModule(mod);
      (function () {
        const initModuleExportsCode = "const module = { exports: {} };";
        const copyModuleExportsCode = "\\n;globalThis.requireObject[mod] = module.exports;";
        const patchedRequire =
          "\\n;" +
          "let require = (subModule) => isModuleAPath(subModule) ? globalThis.require(path.resolve(bru.cwd(), mod, '..', subModule)) : globalThis.require(subModule)" +
          "\\n;";
        eval(initModuleExportsCode + patchedRequire + localModuleCode + copyModuleExportsCode);
      })();
      return globalThis.requireObject[mod];
    }

    const bareName = mod?.startsWith?.('node:') ? mod.slice(5) : mod;
    if (${JSON.stringify(NODE_BUILTIN_MODULES)}.includes(bareName)) {
      throw new Error(
        "'" + mod + "' is a Node.js builtin and is not available in the docs playground; " +
        "it requires the Bruno desktop app's developer mode."
      );
    }
    if (${JSON.stringify(DEVELOPER_MODE_LIBRARIES)}.includes(bareName)) {
      throw new Error(
        "'" + mod + "' is only available in the Bruno desktop app's developer mode; " +
        "the docs playground supports the safe-mode library set (chai, moment, uuid, nanoid, axios, " +
        "crypto-js, jsonwebtoken, tv4, ajv, ajv-formats, path, buffer, btoa, atob)."
      );
    }
    throw new Error("Cannot find module " + mod);
  }
`;
