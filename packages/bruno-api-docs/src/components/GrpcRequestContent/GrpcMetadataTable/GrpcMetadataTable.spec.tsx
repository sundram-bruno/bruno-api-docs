import React from 'react';
import { describe, it, expect } from 'vitest';
import { useRenderToDom } from '@/hooks/useRenderToDom';

const useMarkup = (element: React.ReactElement): string => useRenderToDom(element).innerHTML;
import type { GrpcMetadata } from '@opencollection/types/requests/grpc';
import { GrpcMetadataTable } from './GrpcMetadataTable';

const rows = (entries: Record<string, unknown>[]) => entries as unknown as GrpcMetadata[];

describe('GrpcMetadataTable', () => {
  it('renders nothing when there is no metadata', () => {
    expect(useMarkup(<GrpcMetadataTable metadata={rows([])} />)).toBe('');
  });

  it('renders a name, value and description for every row', () => {
    const html = useMarkup(
      <GrpcMetadataTable
        metadata={rows([
          { name: 'authorization', value: 'Bearer token', description: 'Auth token' },
          { name: 'x-request-id', value: 'req-001' }
        ])}
      />
    );
    expect(html).toContain('authorization');
    expect(html).toContain('Bearer token');
    expect(html).toContain('Auth token');
    expect(html).toContain('x-request-id');
    expect(html).toContain('req-001');
  });

  it('reads a description given as an object', () => {
    const html = useMarkup(
      <GrpcMetadataTable metadata={rows([{ name: 'x-client', value: 'Bruno', description: { content: 'Client name' } }])} />
    );
    expect(html).toContain('Client name');
  });

  it('marks a disabled row', () => {
    const html = useMarkup(
      <GrpcMetadataTable metadata={rows([{ name: 'x-legacy-flag', value: 'off', disabled: true }])} />
    );
    expect(html).toContain('x-legacy-flag');
    expect(html).toContain('disabled-badge');
  });

  it('highlights a variable in a value', () => {
    const html = useMarkup(
      <GrpcMetadataTable metadata={rows([{ name: 'authorization', value: 'Bearer {{token}}' }])} />
    );
    expect(html).toContain('var-text');
  });
});
