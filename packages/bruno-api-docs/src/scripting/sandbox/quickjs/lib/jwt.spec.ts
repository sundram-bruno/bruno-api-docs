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
    let result: any;
    jwt.sign({ b: 2 }, SECRET, { noTimestamp: true }, (signError: any, token: string) => {
      expect(signError).toBeNull();
      jwt.verify(token, SECRET, (verifyError: any, decoded: any) => {
        expect(verifyError).toBeNull();
        result = decoded;
      });
    });
    expect(result).toEqual({ b: 2 });
  });

  it('rejects the alg=none attack token and asymmetric algorithms', () => {
    const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
    const payload = Buffer.from(JSON.stringify({ a: 1 })).toString('base64url');
    expect(() => jwt.verify(`${header}.${payload}.`, SECRET)).toThrowError('jwt signature is required');
    expect(() => jwt.sign({ a: 1 }, 'key', { algorithm: 'RS256' }))
      .toThrowError(/RS256 is not supported in the docs playground/);
  });
});
