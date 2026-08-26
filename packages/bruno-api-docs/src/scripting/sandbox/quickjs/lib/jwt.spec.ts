import { describe, it, expect } from 'vitest';
import jwt from './jwt';

const SECRET = 'test-secret';

describe('jwt (sandbox jsonwebtoken replacement)', () => {
  it('signs and verifies a payload with each HS algorithm', () => {
    for (const algorithm of ['HS256', 'HS384', 'HS512']) {
      const token = jwt.sign({ userId: 42 }, SECRET, { algorithm, noTimestamp: true });
      expect(jwt.verify(token, SECRET)).toEqual({ userId: 42 });
    }
  });

  it('produces the exact token bytes for a fixed payload', () => {
    const token = jwt.sign({ userId: 1, iat: 1700000000 }, 'shared-secret');
    expect(token).toBe(
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTcwMDAwMDAwMH0.sFf3AhH_8eWxHEXov2j3nvjgg4XgTSD4Mc4Ao3saMhs'
    );
  });

  it('rejects a tampered token with the real library message', () => {
    const token = jwt.sign({ a: 1 }, SECRET, { noTimestamp: true });
    const tampered = token.slice(0, -4) + 'AAAA';
    expect(() => jwt.verify(tampered, SECRET)).toThrowError('invalid signature');
  });

  it('expires tokens and honours clockTimestamp', () => {
    const token = jwt.sign({ a: 1, iat: 1700000000 }, SECRET, { expiresIn: '1h' });
    expect(jwt.verify(token, SECRET, { clockTimestamp: 1700000000 + 3599 }).a).toBe(1);
    expect(() => jwt.verify(token, SECRET, { clockTimestamp: 1700000000 + 3601 })).toThrowError('jwt expired');
  });

  it('honours notBefore with the real library message', () => {
    const token = jwt.sign({ a: 1, iat: 1700000000 }, SECRET, { notBefore: '10m' });
    expect(() => jwt.verify(token, SECRET, { clockTimestamp: 1700000000 + 60 })).toThrowError('jwt not active');
    expect(jwt.verify(token, SECRET, { clockTimestamp: 1700000000 + 601 }).a).toBe(1);
  });

  it('parses expiresIn duration strings like the ms grammar', () => {
    const token = jwt.sign({ a: 1, iat: 1700000000 }, SECRET, { expiresIn: '2 days' });
    expect((jwt.decode(token) as any).exp).toBe(1700000000 + 2 * 24 * 60 * 60);
  });

  it('validates audience, issuer and maxAge with real library messages', () => {
    const token = jwt.sign({ a: 1, aud: ['web', 'mobile'], iss: 'bruno', iat: 1700000000 }, SECRET);
    expect(jwt.verify(token, SECRET, { audience: 'mobile', clockTimestamp: 1700000000 }).iss).toBe('bruno');
    expect(() => jwt.verify(token, SECRET, { audience: 'desktop', clockTimestamp: 1700000000 }))
      .toThrowError('jwt audience invalid. expected: desktop');
    expect(() => jwt.verify(token, SECRET, { issuer: 'other', clockTimestamp: 1700000000 }))
      .toThrowError('jwt issuer invalid. expected: other');
    expect(() => jwt.verify(token, SECRET, { maxAge: '30m', clockTimestamp: 1700000000 + 3600 }))
      .toThrowError('maxAge exceeded');
  });

  it('decodes without verification, including complete mode and malformed input', () => {
    const token = jwt.sign({ a: 1 }, SECRET, { noTimestamp: true });
    expect(jwt.decode(token)).toEqual({ a: 1 });
    expect((jwt.decode(token, { complete: true }) as any).header).toEqual({ alg: 'HS256', typ: 'JWT' });
    expect(jwt.decode('not-a-token')).toBeNull();
  });

  it('supports non-string secrets via byte arrays', () => {
    const secretBytes = [112, 97, 115, 115];
    const token = jwt.sign({ a: 1 }, secretBytes, { noTimestamp: true });
    expect(jwt.verify(token, 'pass')).toEqual({ a: 1 });
  });

  it('supports the node callback form', () => {
    let signError: any = 'not-called';
    let signedToken: string | undefined;
    jwt.sign({ b: 2 }, SECRET, { noTimestamp: true }, (error: any, token: string) => {
      signError = error;
      signedToken = token;
    });
    expect(signError).toBeNull();
    expect(typeof signedToken).toBe('string');

    let verifyError: any = 'not-called';
    let decodedPayload: any;
    jwt.verify(signedToken as string, SECRET, (error: any, decoded: any) => {
      verifyError = error;
      decodedPayload = decoded;
    });
    expect(verifyError).toBeNull();
    expect(decodedPayload).toEqual({ b: 2 });
  });

  it('rejects the alg=none attack token and asymmetric algorithms', () => {
    const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
    const payload = Buffer.from(JSON.stringify({ a: 1 })).toString('base64url');
    expect(() => jwt.verify(`${header}.${payload}.`, SECRET)).toThrowError('jwt signature is required');
    expect(() => jwt.sign({ a: 1 }, 'key', { algorithm: 'RS256' }))
      .toThrowError(/RS256 is not supported in the docs playground/);
  });

  it('throws when verify is called without a secret', () => {
    const token = jwt.sign({ a: 1 }, SECRET, { noTimestamp: true });
    expect(() => jwt.verify(token, undefined as any)).toThrowError('secret or public key must be provided');
  });

  it('rejects an asymmetric key handed to an HMAC algorithm (RS/HS confusion)', () => {
    const pem = '-----BEGIN PUBLIC KEY-----\nMFkw\n-----END PUBLIC KEY-----';
    expect(() => jwt.sign({ a: 1 }, pem)).toThrowError('an asymmetric key was provided for an HMAC (HS) algorithm');
    const token = jwt.sign({ a: 1 }, SECRET, { noTimestamp: true });
    expect(() => jwt.verify(token, pem)).toThrowError('an asymmetric key was provided for an HMAC (HS) algorithm');
  });

  it('signs a string payload verbatim (no JSON quoting)', () => {
    const token = jwt.sign('hello', SECRET);
    expect(jwt.decode(token)).toBe('hello');
    expect(jwt.verify(token, SECRET)).toBe('hello');
  });

  it('omits typ for a string payload and keeps it for an object payload', () => {
    const stringHeader = jwt.decode(jwt.sign('hello', SECRET), { complete: true }).header;
    expect(stringHeader.typ).toBeUndefined();
    expect(stringHeader.alg).toBe('HS256');

    const objectHeader = jwt.decode(jwt.sign({ a: 1 }, SECRET), { complete: true }).header;
    expect(objectHeader.typ).toBe('JWT');
  });

  it('rejects claim options for a string payload with the real library messages', () => {
    for (const option of ['expiresIn', 'notBefore', 'noTimestamp', 'audience', 'issuer', 'subject', 'jwtid']) {
      expect(() => jwt.sign('hello', SECRET, { [option]: option === 'noTimestamp' ? true : '1h' }))
        .toThrowError(`invalid ${option} option for string payload`);
    }
  });

  it('invokes a throwing callback at most once', () => {
    let calls = 0;
    const throwingCallback = () => {
      calls += 1;
      throw new Error('callback boom');
    };
    expect(() => jwt.sign({ a: 1 }, SECRET, { noTimestamp: true }, throwingCallback)).toThrowError('callback boom');
    expect(calls).toBe(1);
  });

  it('produces HS256/384/512 signatures matching node crypto (interop)', async () => {
    const { createHmac } = await import('node:crypto');
    const algs: Array<['HS256' | 'HS384' | 'HS512', string]> = [
      ['HS256', 'sha256'], ['HS384', 'sha384'], ['HS512', 'sha512']
    ];
    for (const [alg, nodeAlg] of algs) {
      const token = jwt.sign({ userId: 7 }, SECRET, { algorithm: alg, noTimestamp: true });
      const [header, payload, signature] = token.split('.');
      const reference = createHmac(nodeAlg, SECRET).update(`${header}.${payload}`).digest('base64url');
      expect(signature).toBe(reference);
    }
  });

  it('signs a string-payload token a strict jws verifier accepts (interop)', async () => {
    const { createHmac } = await import('node:crypto');
    const token = jwt.sign('raw-string', SECRET);
    const [header, payload, signature] = token.split('.');
    const reference = createHmac('sha256', SECRET).update(`${header}.${payload}`).digest('base64url');
    expect(signature).toBe(reference);
    expect(JSON.parse(Buffer.from(header, 'base64url').toString()).typ).toBeUndefined();
    expect(Buffer.from(payload, 'base64url').toString()).toBe('raw-string');
  });
});
