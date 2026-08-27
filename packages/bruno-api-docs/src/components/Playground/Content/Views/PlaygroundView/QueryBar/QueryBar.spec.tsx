import React from 'react';
import { describe, it, expect } from 'vitest';
import type { HttpRequest } from '@opencollection/types/requests/http';
import { useRenderToDom } from '@/hooks/useRenderToDom';
import { queryByTestId } from '@/test-utils/dom';
import QueryBar from './QueryBar';

const item: HttpRequest = {
  info: { name: 'Get Customer', type: 'http' },
  http: {
    method: 'get',
    url: '{{baseUrl}}/billing/customers/:customerId',
    headers: [{ name: 'Accept', value: 'application/json' }],
    params: [{ name: 'customerId', value: '42', type: 'path' }]
  }
} as HttpRequest;

const queryBar = <QueryBar item={item} onSendRequest={() => {}} isLoading={false} onItemChange={() => {}} />;

describe('Playground QueryBar — code snippet', () => {
  it('offers the code-snippet control alongside the copy-url action', () => {
    const root = useRenderToDom(queryBar);

    expect(queryByTestId(root, 'query-bar-code-snippet-trigger')).not.toBeNull();
    expect(queryByTestId(root, 'query-bar-copy-url')).not.toBeNull();
  });
});
