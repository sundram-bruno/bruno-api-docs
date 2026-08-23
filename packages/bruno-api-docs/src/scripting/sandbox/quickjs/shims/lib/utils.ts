const ALLOWED_TYPED_ARRAYS = new Set([
  'Int8Array',
  'Uint8Array',
  'Uint8ClampedArray',
  'Int16Array',
  'Uint16Array',
  'Int32Array',
  'Uint32Array',
  'Float32Array',
  'Float64Array',
  'BigInt64Array',
  'BigUint64Array'
]);

function serializeTypedArray(ta: any) {
  return {
    type: ta.constructor.name,
    array: Array.from(ta),
    length: ta.length
  };
}

function deserializeTypedArray(obj: any) {
  if (!obj || typeof obj !== 'object') {
    throw new TypeError('getRandomValues: Invalid typed array object');
  }

  if (typeof obj.type !== 'string' || !ALLOWED_TYPED_ARRAYS.has(obj.type)) {
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

export { serializeTypedArray, deserializeTypedArray };
