const NODE_BUILTIN_MODULES = [
  'assert', 'buffer', 'child_process', 'cluster', 'crypto', 'dgram', 'dns', 'events',
  'fs', 'http', 'http2', 'https', 'net', 'os', 'path', 'perf_hooks', 'process', 'querystring',
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

    if (mod?.startsWith?.('.') || mod?.startsWith?.('/')) {
      throw new Error(
        "Local file require ('" + mod + "') is not available in the docs playground; " +
        'only the built-in safe-mode libraries can be required here.'
      );
    }

    const bareName = mod?.startsWith?.('node:') ? mod.slice(5) : mod;
    const nodeBuiltins = ${JSON.stringify(NODE_BUILTIN_MODULES)};
    if (nodeBuiltins.includes(bareName)) {
      if (globalThis.requireObject[bareName]) {
        return globalThis.requireObject[bareName];
      }
      throw new Error(
        "'" + mod + "' is a Node.js builtin and is not available in the docs playground; " +
        "it requires the Bruno desktop app's developer mode."
      );
    }
    if (${JSON.stringify(DEVELOPER_MODE_LIBRARIES)}.includes(bareName)) {
      const available = Object.keys(globalThis.requireObject).sort().join(', ');
      throw new Error(
        "'" + mod + "' is only available in the Bruno desktop app's developer mode; " +
        "the docs playground supports the safe-mode library set (" + available + ")."
      );
    }
    throw new Error("Cannot find module " + mod);
  }
`;
