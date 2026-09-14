import { describe, it, expect } from 'vitest';
import type { HttpRequest } from '@opencollection/types/requests/http';
import { enabledHeaderSnapshot, headerNamesWrittenSince } from './script-headers';

const requestWith = (headers: { name: string; value: string; disabled?: boolean }[]) => ({
  name: 'r',
  type: 'http',
  http: { method: 'GET', url: 'https://api.example.com', headers }
} as unknown as HttpRequest);

describe('enabledHeaderSnapshot', () => {
  it('records enabled headers by lower-cased name', () => {
    const snapshot = enabledHeaderSnapshot(requestWith([
      { name: 'Authorization', value: 'Bearer a' },
      { name: 'X-Off', value: 'no', disabled: true }
    ]));

    expect([...snapshot.entries()]).toEqual([['authorization', 'Bearer a']]);
  });

  it('is empty for a request without headers', () => {
    expect(enabledHeaderSnapshot(requestWith([])).size).toBe(0);
  });
});

describe('headerNamesWrittenSince', () => {
  it('returns headers the script added', () => {
    const before = enabledHeaderSnapshot(requestWith([{ name: 'Accept', value: 'json' }]));
    const after = requestWith([{ name: 'Accept', value: 'json' }, { name: 'Authorization', value: 'Bearer s' }]);

    expect(headerNamesWrittenSince(before, after)).toEqual(['authorization']);
  });

  it('returns headers whose value the script changed', () => {
    const before = enabledHeaderSnapshot(requestWith([{ name: 'Authorization', value: 'Bearer tab' }]));
    const after = requestWith([{ name: 'Authorization', value: 'Bearer script' }]);

    expect(headerNamesWrittenSince(before, after)).toEqual(['authorization']);
  });

  it('matches a re-cased header against the snapshot without reporting it', () => {
    const before = enabledHeaderSnapshot(requestWith([{ name: 'Authorization', value: 'Bearer tab' }]));
    const after = requestWith([{ name: 'authorization', value: 'Bearer tab' }]);

    expect(headerNamesWrittenSince(before, after)).toEqual([]);
  });

  it('ignores headers the script left untouched, removed, or disabled', () => {
    const before = enabledHeaderSnapshot(requestWith([
      { name: 'Accept', value: 'json' },
      { name: 'X-Gone', value: '1' },
      { name: 'X-Off', value: '2' }
    ]));
    const after = requestWith([{ name: 'Accept', value: 'json' }, { name: 'X-Off', value: '2', disabled: true }]);

    expect(headerNamesWrittenSince(before, after)).toEqual([]);
  });
});
