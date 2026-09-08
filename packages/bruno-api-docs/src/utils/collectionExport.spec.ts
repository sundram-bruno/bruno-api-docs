import { describe, it, expect } from 'vitest';
import { load } from 'js-yaml';
import type { OpenCollection } from '@opencollection/types';
import type { Folder } from '@opencollection/types/collection/item';
import { getItemName } from './schemaHelpers';
import { stripHydration, serializeCollectionYaml, collectionFilename, resolveDownloadYaml } from './collectionExport';

const hydrated = {
  opencollection: '1.0.0',
  info: { name: 'Hotel Booking API' },
  items: [
    {
      info: { name: 'Rooms', type: 'folder' },
      uuid: 'f-1',
      isCollapsed: true,
      items: [
        { info: { name: 'List rooms', type: 'http' }, uuid: 'r-1', http: { method: 'GET', url: '{{host}}/rooms' } }
      ]
    },
    { info: { name: 'Ping', type: 'http' }, uuid: 'r-2', http: { method: 'GET', url: '{{host}}/ping' } }
  ]
} as unknown as OpenCollection;

describe('stripHydration', () => {
  it('removes uuid and isCollapsed at every depth', () => {
    const text = JSON.stringify(stripHydration(hydrated));
    expect(text).not.toContain('uuid');
    expect(text).not.toContain('isCollapsed');
  });

  it('keeps every other field and the item order', () => {
    const result = stripHydration(hydrated);
    expect(result.opencollection).toBe('1.0.0');
    expect(result.info?.name).toBe('Hotel Booking API');
    expect(result.items?.map(getItemName)).toEqual(['Rooms', 'Ping']);
    expect(getItemName((result.items?.[0] as Folder).items?.[0])).toBe('List rooms');
  });

  it('does not mutate the input', () => {
    stripHydration(hydrated);
    expect((hydrated.items?.[0] as { uuid?: string }).uuid).toBe('f-1');
  });
});

describe('serializeCollectionYaml', () => {
  it('produces YAML that parses back with the opencollection marker intact', () => {
    const yaml = serializeCollectionYaml(stripHydration(hydrated));
    const parsed = load(yaml) as { opencollection: string; items: unknown[] };
    expect(parsed.opencollection).toBe('1.0.0');
    expect(parsed.items).toHaveLength(2);
    expect(yaml).not.toContain('uuid');
  });
});

describe('collectionFilename', () => {
  it('slugifies the collection name and adds .yml', () => {
    expect(collectionFilename(hydrated)).toBe('hotel-booking-api.yml');
  });

  it('falls back to collection.yml when there is no name', () => {
    expect(collectionFilename({ items: [] } as unknown as OpenCollection)).toBe('collection.yml');
    expect(collectionFilename(null)).toBe('collection.yml');
  });
});

describe('resolveDownloadYaml', () => {
  it('returns the original YAML text untouched when available', () => {
    const source = 'opencollection: "1.0.0"\ninfo:\n  name: Hotel Booking API # keep me\n';
    expect(resolveDownloadYaml(source, hydrated)).toBe(source);
  });

  it('rebuilds from the collection when the source text is JSON', () => {
    const yaml = resolveDownloadYaml('{"opencollection":"1.0.0","items":[]}', hydrated);
    expect(yaml.startsWith('{')).toBe(false);
    expect((load(yaml) as { info: { name: string } }).info.name).toBe('Hotel Booking API');
    expect(yaml).not.toContain('uuid');
  });

  it('rebuilds from the collection when there is no source text', () => {
    const yaml = resolveDownloadYaml(null, hydrated);
    expect((load(yaml) as { opencollection: string }).opencollection).toBe('1.0.0');
    expect(yaml).not.toContain('uuid');
  });
});
