import React from 'react';
import { describe, it, expect } from 'vitest';
import { useRenderToDom } from '@/hooks/useRenderToDom';

const useMarkup = (element: React.ReactElement): string => useRenderToDom(element).innerHTML;
import { SnippetTabs, type Snippet } from './SnippetTabs';

const snippets: Snippet[] = [
  { id: 'grpcurl', label: 'grpcURL', language: 'bash', code: 'grpcurl -plaintext {{host}} pkg.Svc/Do' },
  { id: 'javascript', label: 'JavaScript', language: 'javascript', code: 'const grpc = require(\'@grpc/grpc-js\');' }
];

describe('SnippetTabs', () => {
  it('renders a tab per snippet and shows the first one', () => {
    const html = useMarkup(<SnippetTabs snippets={snippets} />);

    expect(html).toContain('grpcURL');
    expect(html).toContain('JavaScript');
    expect(html).toContain('pkg.Svc/Do');
    expect(html).not.toContain('@grpc/grpc-js');
  });

  it('renders nothing when there are no snippets', () => {
    expect(useMarkup(<SnippetTabs snippets={[]} />)).toBe('');
  });

  it('derives every child test id from the testId it is given', () => {
    const html = useMarkup(<SnippetTabs snippets={snippets} testId="grpc-request-code-snippet" />);

    expect(html).toContain('data-testid="grpc-request-code-snippet"');
    expect(html).toContain('data-testid="grpc-request-code-snippet-tab-grpcurl"');
    expect(html).toContain('data-testid="grpc-request-code-snippet-tab-javascript"');
    expect(html).toContain('data-testid="grpc-request-code-snippet-expand"');
    expect(html).toContain('data-testid="grpc-request-code-snippet-code"');
  });

  it('falls back to the request base when no testId is given', () => {
    const html = useMarkup(<SnippetTabs snippets={snippets} />);
    expect(html).toContain('data-testid="request-code-snippet-tab-grpcurl"');
  });

  it('marks the active tab as selected', () => {
    const html = useMarkup(<SnippetTabs snippets={snippets} />);

    expect(html).toContain('aria-selected="true"');
    expect(html).toContain('aria-selected="false"');
  });

  it('collapses to a trigger instead of the code box when embedded', () => {
    const html = useMarkup(
      <SnippetTabs snippets={snippets} variant="embedded" testId="example-code-snippet" />
    );

    expect(html).toContain('data-testid="example-code-snippet-trigger"');
    expect(html).toContain('Code Snippet');
    expect(html).not.toContain('pkg.Svc/Do');
    expect(html).not.toContain('data-testid="example-code-snippet-expand"');
  });

  it('renders variables in the code as hover tokens', () => {
    const html = useMarkup(<SnippetTabs snippets={snippets} />);

    expect(html).toContain('data-var-name="host"');
    expect(html).toContain('{{host}}');
  });

  it('passes the snippet language through to the highlighter', () => {
    const html = useMarkup(
      <SnippetTabs snippets={[{ id: 'json', label: 'JSON', language: 'json', code: '{"a":1}' }]} />
    );

    expect(html).toContain('language-json');
  });
});
