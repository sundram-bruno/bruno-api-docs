import { describe, it, expect, beforeAll } from 'vitest';
import { newQuickJSWASMModule } from 'quickjs-emscripten';
import { marshallToVm } from './index';

let vm: any;

const dump = (handle: any) => {
  const value = vm.dump(handle);
  handle.dispose();
  return value;
};

describe('marshallToVm', () => {
  beforeAll(async () => {
    const module = await newQuickJSWASMModule();
    vm = module.newContext();
  });

  it('marshals primitives, arrays and nested objects', () => {
    expect(dump(marshallToVm('x', vm))).toBe('x');
    expect(dump(marshallToVm(42, vm))).toBe(42);
    expect(dump(marshallToVm(true, vm))).toBe(true);
    expect(dump(marshallToVm([1, 'a', { b: 2 }], vm))).toEqual([1, 'a', { b: 2 }]);
  });

  it('does not carry a hostile __proto__ key onto the sandbox object', () => {
    const hostile = JSON.parse('{"__proto__": {"polluted": true}, "safe": 1}');
    const handle = marshallToVm(hostile, vm);
    vm.setProp(vm.global, 'marshalled', handle);
    handle.dispose();

    expect(dump(vm.evalCode('marshalled.safe').value)).toBe(1);
    expect(dump(vm.evalCode('marshalled.polluted').value)).toBeUndefined();
    expect(dump(vm.evalCode('({}).polluted').value)).toBeUndefined();
  });

  it('throws on unsupported value types instead of returning undefined', () => {
    expect(() => marshallToVm(10n, vm)).toThrowError('marshallToVm: unsupported value of type bigint');
    expect(() => marshallToVm(Symbol('x'), vm)).toThrowError('marshallToVm: unsupported value of type symbol');
  });
});
