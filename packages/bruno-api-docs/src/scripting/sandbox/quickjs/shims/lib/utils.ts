const SUPPORTED_TYPED_ARRAYS = [
  'Int8Array',
  'Uint8Array',
  'Uint8ClampedArray',
  'Int16Array',
  'Uint16Array',
  'Int32Array',
  'Uint32Array'
];

const MAX_TYPED_ARRAY_LENGTH = 65536;

function serializeTypedArray(typedArray: any) {
  return {
    type: typedArray.constructor.name,
    array: Array.from(typedArray),
    length: typedArray.length
  };
}

function deserializeTypedArray(obj: any) {
  if (!obj || typeof obj !== 'object') {
    throw new TypeError('getRandomValues: Invalid typed array object');
  }

  if (typeof obj.type !== 'string' || !SUPPORTED_TYPED_ARRAYS.includes(obj.type)) {
    throw new TypeError(`getRandomValues: Invalid or unsupported typed array type: ${obj.type}`);
  }

  // Validate everything BEFORE constructing: a sandbox script can hand the raw host
  // function a tiny object faking a huge length, which would make the host allocate
  // that much memory here, ahead of any size cap.
  if (!Array.isArray(obj.array) || !Number.isInteger(obj.length) || obj.length < 0 || obj.length > obj.array.length) {
    throw new TypeError('getRandomValues: Invalid typed array properties');
  }

  if (obj.array.length > MAX_TYPED_ARRAY_LENGTH) {
    throw new Error('getRandomValues: ArrayBufferView byte length exceeds 65536');
  }

  const TypedArrayConstructor = (globalThis as any)[obj.type];
  if (typeof TypedArrayConstructor !== 'function') {
    throw new TypeError(`getRandomValues: Constructor ${obj.type} is not available`);
  }

  return new TypedArrayConstructor(obj.array, 0, obj.length);
}

export { serializeTypedArray, deserializeTypedArray, SUPPORTED_TYPED_ARRAYS };
