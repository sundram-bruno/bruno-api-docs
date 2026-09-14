import type { HttpRequest } from '@opencollection/types/requests/http';
import { getHttpHeaders } from '@/utils/schemaHelpers';

export type HeaderSnapshot = Map<string, string>;

export const enabledHeaderSnapshot = (request: HttpRequest): HeaderSnapshot => {
  const snapshot: HeaderSnapshot = new Map();
  getHttpHeaders(request).forEach((header) => {
    if (!header.disabled && header.name) {
      snapshot.set(header.name.toLowerCase(), header.value);
    }
  });
  return snapshot;
};

export const headerNamesWrittenSince = (before: HeaderSnapshot, request: HttpRequest): string[] => {
  const written = new Set<string>();
  getHttpHeaders(request).forEach((header) => {
    if (header.disabled || !header.name) return;
    const name = header.name.toLowerCase();
    if (before.get(name) !== header.value) written.add(name);
  });
  return [...written];
};
