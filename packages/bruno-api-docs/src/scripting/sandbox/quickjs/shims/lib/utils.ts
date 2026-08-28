const SUPPORTED_TYPED_ARRAYS = [
  'Int8Array',
  'Uint8Array',
  'Uint8ClampedArray',
  'Int16Array',
  'Uint16Array',
  'Int32Array',
  'Uint32Array',
  'Float32Array',
  'Float64Array'
];

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

  if (!obj.array || typeof obj.length !== 'number') {
    throw new TypeError('getRandomValues: Invalid typed array properties');
  }

  const TypedArrayConstructor = (globalThis as any)[obj.type];
  if (typeof TypedArrayConstructor !== 'function') {
    throw new TypeError(`getRandomValues: Constructor ${obj.type} is not available`);
  }

  return new TypedArrayConstructor(obj.array, 0, obj.length);
}

export { serializeTypedArray, deserializeTypedArray, SUPPORTED_TYPED_ARRAYS };
