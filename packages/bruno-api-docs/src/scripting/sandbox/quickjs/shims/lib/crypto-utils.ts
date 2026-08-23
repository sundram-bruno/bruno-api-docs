import { marshallToVm } from '../../utils';
import { serializeTypedArray, deserializeTypedArray } from './utils';

const MAX_RANDOM_BYTES_PER_CALL = 65536;

const addCryptoUtilsShimToContext = (vm: any) => {
  const randomBytesHandle = vm.newFunction('randomBytes', (sizeHandle: any) => {
    try {
      let size = vm.dump(sizeHandle);
      if (typeof size !== 'number') {
        throw new TypeError('The "size" argument must be of type number');
      }

      size = Math.trunc(size);

      if (size < 0) {
        throw new RangeError('The "size" argument must be >= 0');
      }

      if (size > MAX_RANDOM_BYTES_PER_CALL) {
        throw new RangeError('The "size" argument is too large');
      }

      if (size === 0) {
        return marshallToVm([], vm);
      }

      const bytes = new Uint8Array(size);
      globalThis.crypto.getRandomValues(bytes);

      return marshallToVm(Array.from(bytes), vm);
    } catch (error: any) {
      const vmError = vm.newError(error.message);
      vm.setProp(vmError, 'name', vm.newString(error.name));
      throw vmError;
    }
  });

  const getRandomValuesHandle = vm.newFunction('getRandomValues', (arrayHandle: any) => {
    try {
      const serializedArray = vm.dump(arrayHandle);
      const typedArray = deserializeTypedArray(serializedArray);

      if (typedArray.length === 0) {
        return marshallToVm([], vm);
      }

      if (typedArray.length > MAX_RANDOM_BYTES_PER_CALL) {
        throw new Error('getRandomValues: ArrayBufferView byte length exceeds 65536');
      }

      globalThis.crypto.getRandomValues(typedArray);

      return marshallToVm(Array.from(typedArray), vm);
    } catch (error: any) {
      const vmError = vm.newError(error.message);
      vm.setProp(vmError, 'name', vm.newString(error.name));
      throw vmError;
    }
  });

  vm.setProp(vm.global, '__bruno__crypto__randomBytes', randomBytesHandle);
  vm.setProp(vm.global, '__bruno__crypto__getRandomValues', getRandomValuesHandle);
  randomBytesHandle.dispose();
  getRandomValuesHandle.dispose();

  vm.evalCode(`
    ${serializeTypedArray.toString()}

    const cryptoModule = {
      randomBytes: function(size) {
        const byteArray = globalThis.__bruno__crypto__randomBytes(size);
        return Buffer.from(Array.from(byteArray));
      },
      getRandomValues: function(typedArray) {
        const serializedTypedArray = serializeTypedArray(typedArray);
        typedArray.set(globalThis.__bruno__crypto__getRandomValues(serializedTypedArray));
        return typedArray;
      },
    };

    globalThis.crypto = cryptoModule;
    `);
};

export default addCryptoUtilsShimToContext;
