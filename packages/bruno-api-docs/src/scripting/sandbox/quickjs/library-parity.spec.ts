import { describe, it, expect, beforeAll } from 'vitest';
import { newQuickJSWASMModule } from 'quickjs-emscripten';
import addCryptoUtilsShimToContext from './shims/lib/crypto-utils';
import addAxiosShimToContext from './shims/lib/axios';
import addLocalModuleShimToContext from './shims/local-module';
import { getRequireCode } from './shims/require';
import { getBundledCode } from './bundled-libraries.iife.js';

const DESKTOP_SAFE_MODE_MODULES = [
  'ajv', 'ajv-formats', 'atob', 'axios', 'btoa', 'buffer', 'chai', 'crypto-js',
  'jsonwebtoken', 'moment', 'nanoid', 'path', 'tv4', 'uuid'
];

let vm: any;

const inVm = (expression: string) => {
  const result = vm.evalCode(expression);
  if (result.error) {
    const error = vm.dump(result.error);
    result.error.dispose();
    throw new Error(error.message);
  }
  const value = vm.dump(result.value);
  result.value.dispose();
  return value;
};

const errorMessageOf = (expression: string) =>
  inVm(`(() => { try { ${expression}; return 'NO-THROW'; } catch (e) { return e.message; } })()`);

describe('sandbox library parity with desktop safe mode', () => {
  beforeAll(async () => {
    const module = await newQuickJSWASMModule();
    vm = module.newContext();
    addCryptoUtilsShimToContext(vm);
    addLocalModuleShimToContext(vm);
    const boot = vm.evalCode(
      `(${getBundledCode.toString()})(); ${getRequireCode()}; `
      + `globalThis.bru = { cwd: () => '' }; `
      + `globalThis.console = { log() {}, debug() {}, info() {}, warn() {}, error() {} };`
    );
    expect(boot.error).toBeUndefined();
    boot.value.dispose();
    addAxiosShimToContext(vm);
  });

  it('exposes exactly the 14 desktop safe-mode modules', () => {
    expect(inVm('Object.keys(globalThis.requireObject).sort()')).toEqual(DESKTOP_SAFE_MODE_MODULES);
  });

  it('exposes the desktop safe-mode globals', () => {
    const globals = ['expect', 'assert', 'moment', 'btoa', 'atob', 'Buffer', 'tv4', 'Ajv', 'addFormats', 'crypto', 'axios', 'jwt', 'path', 'require'];
    for (const name of globals) {
      expect(inVm(`typeof globalThis['${name}']`), name).not.toBe('undefined');
    }
  });

  it('every module does real work inside the VM', () => {
    expect(inVm(`require('moment')('2026-08-20T10:00:00Z').utc().format('YYYY-MM-DD')`)).toBe('2026-08-20');
    expect(inVm(`require('crypto-js').SHA256('abc').toString()`)).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
    expect(inVm(`require('uuid').validate(require('uuid').v4())`)).toBe(true);
    expect(inVm(`require('nanoid').nanoid(10).length`)).toBe(10);
    expect(inVm(`require('buffer').Buffer.from('hello').toString('base64')`)).toBe('aGVsbG8=');
    expect(inVm(`require('btoa')('hello')`)).toBe('aGVsbG8=');
    expect(inVm(`require('atob')('aGVsbG8=')`)).toBe('hello');
    expect(inVm(`require('tv4').validate({ a: 1 }, { type: 'object' })`)).toBe(true);
    expect(inVm(`new (require('ajv'))().compile({ type: 'number' })(5)`)).toBe(true);
    expect(inVm(`(() => { const Ajv = require('ajv'); const ajv = new Ajv(); require('ajv-formats')(ajv); return ajv.compile({ type: 'string', format: 'email' })('a@b.co'); })()`)).toBe(true);
    expect(inVm(`require('path').resolve('/a/b', '../c')`)).toBe('/a/c');
    expect(inVm(`(() => { const { expect } = require('chai'); expect(1).to.eql(1); return 'ok'; })()`)).toBe('ok');
    expect(inVm(`(() => { const jwtLib = require('jsonwebtoken'); return jwtLib.verify(jwtLib.sign({ u: 1 }, 's', { noTimestamp: true }), 's').u; })()`)).toBe(1);
    expect(inVm(`typeof require('axios').get`)).toBe('function');
  });

  it('gives explanatory errors for developer-mode-only and node builtin modules', () => {
    expect(errorMessageOf(`require('lodash')`)).toContain('only available in the Bruno desktop app\'s developer mode');
    expect(errorMessageOf(`require('fs')`)).toContain('is a Node.js builtin');
    expect(errorMessageOf(`require('node:fs')`)).toContain('is a Node.js builtin');
    expect(errorMessageOf(`require('./helper.js')`)).toContain('Local file require is not available in the docs playground');
    expect(errorMessageOf(`require('left-pad-9000')`)).toBe('Cannot find module left-pad-9000');
  });
});
