import type { HttpRequest } from '@opencollection/types/requests/http';
import { getHttpHeaders } from '@/utils/schemaHelpers';

export type HeaderSnapshot = Set<string>;

const headerPairKey = (name: string, value: string): string => `${name.toLowerCase()}\n${value}`;

export const snapshotEnabledHeaders = (request: HttpRequest): HeaderSnapshot => {
  const snapshot: HeaderSnapshot = new Set();
  getHttpHeaders(request).forEach((header) => {
    if (!header.disabled && header.name) snapshot.add(headerPairKey(header.name, header.value));
  });
  return snapshot;
};

// Lower-cased names of the enabled headers whose name and value pair is not in the snapshot: the
// ones a script added or gave a new value. Pairs, not names, so duplicate rows that all existed
// before the script do not count as written.
export const getHeaderNamesWrittenSince = (before: HeaderSnapshot, request: HttpRequest): string[] => {
  const written = new Set<string>();
  getHttpHeaders(request).forEach((header) => {
    if (header.disabled || !header.name) return;
    if (!before.has(headerPairKey(header.name, header.value))) written.add(header.name.toLowerCase());
  });
  return [...written];
};
