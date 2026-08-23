import CryptoJS from 'crypto-js';

type HmacFn = (message: string, secret: CryptoJS.lib.WordArray | string) => CryptoJS.lib.WordArray;

const SUPPORTED_ALGORITHMS: Record<string, HmacFn> = {
  HS256: (message, secret) => CryptoJS.HmacSHA256(message, secret),
  HS384: (message, secret) => CryptoJS.HmacSHA384(message, secret),
  HS512: (message, secret) => CryptoJS.HmacSHA512(message, secret)
};

const ASYMMETRIC_ALGORITHM_PATTERN = /^(RS|ES|PS)\d{3}$/;

const unsupportedAlgorithmMessage = (algorithm: string) =>
  `${algorithm} is not supported in the docs playground; HS256, HS384 and HS512 are available. `
  + 'Asymmetric algorithms need a private key, which should never be embedded in a published collection script.';

const DURATION_UNIT_MS: Record<string, number> = {
  ms: 1,
  s: 1000,
  m: 60 * 1000,
  h: 60 * 60 * 1000,
  d: 24 * 60 * 60 * 1000,
  w: 7 * 24 * 60 * 60 * 1000,
  y: 365.25 * 24 * 60 * 60 * 1000
};

const DURATION_PATTERN
  = /^(\d+(?:\.\d+)?)\s*(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)?$/i;

const normalizeDurationUnit = (rawUnit: string): string => {
  const unit = rawUnit.toLowerCase();
  if (unit.startsWith('ms') || unit.startsWith('mil')) return 'ms';
  return unit[0];
};

const parseDurationToSeconds = (value: number | string, optionName: string): number => {
  if (typeof value === 'number') {
    return value;
  }
  const match = DURATION_PATTERN.exec(String(value).trim());
  if (!match) {
    throw new Error(`"${optionName}" should be a number of seconds or string representing a timespan`);
  }
  const amount = parseFloat(match[1]);
  const unitKey = normalizeDurationUnit(match[2] || 'ms');
  return Math.floor((amount * DURATION_UNIT_MS[unitKey]) / 1000);
};

const toHmacSecret = (secret: any): CryptoJS.lib.WordArray | string => {
  if (typeof secret === 'string') {
    return secret;
  }
  if (secret && typeof secret === 'object' && typeof secret.length === 'number') {
    const bytes = Array.from(secret as ArrayLike<number>);
    const words: number[] = [];
    for (let i = 0; i < bytes.length; i++) {
      words[i >>> 2] = (words[i >>> 2] || 0) | (bytes[i] << (24 - (i % 4) * 8));
    }
    return CryptoJS.lib.WordArray.create(words, bytes.length);
  }
  return String(secret);
};

const base64UrlFromWordArray = (words: CryptoJS.lib.WordArray): string => {
  return words.toString(CryptoJS.enc.Base64).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

const base64UrlEncodeJson = (value: unknown): string => {
  return base64UrlFromWordArray(CryptoJS.enc.Utf8.parse(JSON.stringify(value)));
};

const base64UrlDecodeToString = (segment: string): string => {
  let base64 = segment.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4 !== 0) {
    base64 += '=';
  }
  return CryptoJS.enc.Base64.parse(base64).toString(CryptoJS.enc.Utf8);
};

const constantTimeEquals = (a: string, b: string): boolean => {
  if (a.length !== b.length) {
    return false;
  }
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
};

const nowInSeconds = () => Math.floor(Date.now() / 1000);

const resolveCallback = (options: any, callback: any) => {
  if (typeof options === 'function') {
    return { resolvedOptions: undefined, resolvedCallback: options };
  }
  return { resolvedOptions: options, resolvedCallback: callback };
};

const withOptionalCallback = <T>(callback: any, run: () => T): T | undefined => {
  if (typeof callback !== 'function') {
    return run();
  }
  try {
    callback(null, run());
  } catch (error) {
    callback(error, undefined);
  }
  return undefined;
};

const matchesAudience = (audienceClaim: any, expected: any): boolean => {
  const claims: any[] = Array.isArray(audienceClaim) ? audienceClaim : [audienceClaim];
  const expectations: any[] = Array.isArray(expected) ? expected : [expected];
  return expectations.some((expectation) =>
    claims.some((claim) =>
      expectation instanceof RegExp ? expectation.test(String(claim)) : expectation === claim
    )
  );
};

const signSync = (payload: any, secret: any, options: any): string => {
  const algorithm = options?.algorithm || 'HS256';
  const hmac = SUPPORTED_ALGORITHMS[algorithm];
  if (!hmac) {
    throw new Error(
      ASYMMETRIC_ALGORITHM_PATTERN.test(algorithm) ? unsupportedAlgorithmMessage(algorithm) : 'invalid algorithm'
    );
  }
  if (secret === undefined || secret === null || secret === '') {
    throw new Error('secretOrPrivateKey must have a value');
  }

  const isObjectPayload = typeof payload === 'object' && payload !== null;
  const claims: any = isObjectPayload && options?.mutatePayload !== true ? { ...payload } : payload;

  if (isObjectPayload) {
    if (options?.noTimestamp !== true && claims.iat === undefined) {
      claims.iat = nowInSeconds();
    }
    if (options?.expiresIn !== undefined) {
      claims.exp = (claims.iat ?? nowInSeconds()) + parseDurationToSeconds(options.expiresIn, 'expiresIn');
    }
    if (options?.notBefore !== undefined) {
      claims.nbf = (claims.iat ?? nowInSeconds()) + parseDurationToSeconds(options.notBefore, 'notBefore');
    }
    if (options?.audience !== undefined) claims.aud = options.audience;
    if (options?.issuer !== undefined) claims.iss = options.issuer;
    if (options?.subject !== undefined) claims.sub = options.subject;
    if (options?.jwtid !== undefined) claims.jti = options.jwtid;
  }

  const header = { alg: algorithm, typ: 'JWT', ...(options?.header || {}) };
  const signingInput = `${base64UrlEncodeJson(header)}.${base64UrlEncodeJson(claims)}`;
  const signature = base64UrlFromWordArray(hmac(signingInput, toHmacSecret(secret)));
  return `${signingInput}.${signature}`;
};

const decode = (token: any, options?: any): any => {
  if (typeof token !== 'string') {
    return null;
  }
  const segments = token.split('.');
  if (segments.length !== 3) {
    return null;
  }
  try {
    const header = JSON.parse(base64UrlDecodeToString(segments[0]));
    const payloadText = base64UrlDecodeToString(segments[1]);
    let payload: any;
    try {
      payload = JSON.parse(payloadText);
    } catch {
      if (options?.json) {
        return null;
      }
      payload = payloadText;
    }
    if (options?.complete) {
      return { header, payload, signature: segments[2] };
    }
    return payload;
  } catch {
    return null;
  }
};

const verifySync = (token: any, secret: any, options: any): any => {
  if (!token) {
    throw new Error('jwt must be provided');
  }
  if (typeof token !== 'string' || token.split('.').length !== 3) {
    throw new Error('jwt malformed');
  }

  const [headerSegment, payloadSegment, signatureSegment] = token.split('.');
  if (signatureSegment === '') {
    throw new Error('jwt signature is required');
  }

  const decoded = decode(token, { complete: true });
  if (!decoded) {
    throw new Error('jwt malformed');
  }

  const algorithm = decoded.header?.alg;
  const hmac = SUPPORTED_ALGORITHMS[algorithm];
  if (!hmac) {
    throw new Error(
      ASYMMETRIC_ALGORITHM_PATTERN.test(String(algorithm)) ? unsupportedAlgorithmMessage(String(algorithm)) : 'invalid algorithm'
    );
  }
  if (options?.algorithms && !options.algorithms.includes(algorithm)) {
    throw new Error('invalid algorithm');
  }

  const expectedSignature = base64UrlFromWordArray(hmac(`${headerSegment}.${payloadSegment}`, toHmacSecret(secret)));
  if (!constantTimeEquals(expectedSignature, signatureSegment)) {
    throw new Error('invalid signature');
  }

  const payload = decoded.payload;
  const clockTimestamp = options?.clockTimestamp ?? nowInSeconds();
  const clockTolerance = options?.clockTolerance ?? 0;

  if (typeof payload === 'object' && payload !== null) {
    const notBeforeApplies = payload.nbf !== undefined && options?.ignoreNotBefore !== true;
    if (notBeforeApplies && payload.nbf > clockTimestamp + clockTolerance) {
      throw new Error('jwt not active');
    }
    const expiryApplies = payload.exp !== undefined && options?.ignoreExpiration !== true;
    if (expiryApplies && payload.exp <= clockTimestamp - clockTolerance) {
      throw new Error('jwt expired');
    }
    if (options?.audience !== undefined) {
      if (payload.aud === undefined || !matchesAudience(payload.aud, options.audience)) {
        throw new Error(`jwt audience invalid. expected: ${[].concat(options.audience).join(' or ')}`);
      }
    }
    if (options?.issuer !== undefined) {
      const issuers = Array.isArray(options.issuer) ? options.issuer : [options.issuer];
      if (!issuers.includes(payload.iss)) {
        throw new Error(`jwt issuer invalid. expected: ${issuers.join(',')}`);
      }
    }
    if (options?.subject !== undefined && payload.sub !== options.subject) {
      throw new Error(`jwt subject invalid. expected: ${options.subject}`);
    }
    if (options?.jwtid !== undefined && payload.jti !== options.jwtid) {
      throw new Error(`jwt jwtid invalid. expected: ${options.jwtid}`);
    }
    if (options?.nonce !== undefined && payload.nonce !== options.nonce) {
      throw new Error('jwt nonce invalid. expected: ' + options.nonce);
    }
    if (options?.maxAge !== undefined) {
      if (payload.iat === undefined) {
        throw new Error('iat required when maxAge is specified');
      }
      const maxAgeSeconds = parseDurationToSeconds(options.maxAge, 'maxAge');
      if (payload.iat + maxAgeSeconds <= clockTimestamp - clockTolerance) {
        throw new Error('maxAge exceeded');
      }
    }
  }

  if (options?.complete) {
    return decoded;
  }
  return payload;
};

const sign = (payload: any, secret: any, options?: any, callback?: any) => {
  const { resolvedOptions, resolvedCallback } = resolveCallback(options, callback);
  return withOptionalCallback(resolvedCallback, () => signSync(payload, secret, resolvedOptions));
};

const verify = (token: any, secret: any, options?: any, callback?: any) => {
  const { resolvedOptions, resolvedCallback } = resolveCallback(options, callback);
  return withOptionalCallback(resolvedCallback, () => verifySync(token, secret, resolvedOptions));
};

export default { sign, verify, decode };
