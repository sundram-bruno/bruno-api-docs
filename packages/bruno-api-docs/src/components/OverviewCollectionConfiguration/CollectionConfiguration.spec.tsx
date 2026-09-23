import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, it, expect } from 'vitest';
import type { HttpRequestHeader } from '@opencollection/types/requests/http';
import { CollectionConfiguration } from './CollectionConfiguration';
import type { Auth } from '@opencollection/types/common/auth';
import { AUTH_MODE_LABELS } from '@/constants';
import { useRenderToDom } from '@/hooks/useRenderToDom';
import { getByTestId, queryByTestId } from '@/test-utils/dom';
import type { PreRequestVarRow } from '@/utils/request';

describe('CollectionConfiguration', () => {
  it('renders nothing when there is no configuration', () => {
    const html = renderToStaticMarkup(<CollectionConfiguration />);
    expect(html).toBe('');
  });

  it('renders enabled headers, masks secret auth values and shows script/test code', () => {
    const headers: HttpRequestHeader[] = [
      { name: 'Accept', value: 'application/json' },
      { name: 'X-Disabled', value: 'nope', disabled: true }
    ];

    const html = renderToStaticMarkup(
      <CollectionConfiguration
        headers={headers}
        auth={{ type: 'basic', username: 'user@example.com', password: 's3cr3t' }}
        scripts={{ preRequest: 'console.log("pre")', tests: 'test("ok", () => {})' }}
        authModeLabels={AUTH_MODE_LABELS}
      />
    );

    expect(html).toContain('Accept');
    expect(html).toContain('application/json');
    expect(html).toContain('X-Disabled');
    expect(html).toContain('disabled-badge');

    // Auth mode resolved via the supplied labels; username shown, password masked
    expect(html).toContain('Basic Auth');
    expect(html).toContain('user@example.com');
    expect(html).not.toContain('s3cr3t');

    // Script and test sections render
    expect(html).toContain('Pre-Request');
    expect(html).toContain('Tests');
  });

  it('renders collection variables (pre-request + post-response) and header descriptions', () => {
    const html = renderToStaticMarkup(
      <CollectionConfiguration
        headers={[{ name: 'Accept', value: 'application/json', description: 'content negotiation' } as HttpRequestHeader]}
        preVars={[{ name: 'baseUrl', value: 'https://api.example.com' }]}
        postVars={[{ name: 'token', expression: 'res.body.token' }]}
      />
    );
    expect(html).toContain('Variables');
    expect(html).toContain('baseUrl');
    expect(html).toContain('https://api.example.com');
    expect(html).toContain('token');
    expect(html).toContain('res.body.token');
    expect(html).toContain('content negotiation');
  });

  it('falls back to the raw auth type when no label is supplied', () => {
    const html = renderToStaticMarkup(<CollectionConfiguration auth={{ type: 'bearer', token: 't' }} />);
    expect(html).toContain('bearer');
  });

  it('omits the subsections that have no content', () => {
    const html = renderToStaticMarkup(<CollectionConfiguration auth={{ type: 'bearer', token: 't' }} />);
    expect(html).toContain('Auth');
    expect(html).not.toContain('Headers');
    expect(html).not.toContain('Script');
    expect(html).not.toContain('Tests');
  });
});

describe('CollectionConfiguration sectionType', () => {
  const props = {
    headers: [{ name: 'Accept', value: 'application/json' }] as HttpRequestHeader[],
    auth: { type: 'bearer', token: 't' } as Auth,
    scripts: { preRequest: 'console.log("pre")', tests: 'test("ok", () => {})' },
    preVars: [{ name: 'v', value: '1' }] as PreRequestVarRow[]
  };

  it('renders only headers and auth for the request section', () => {
    const root = useRenderToDom(<CollectionConfiguration {...props} sectionType="request" />);
    expect(getByTestId(root, 'collection-config-headers-subheading').text.trim()).toBe('Headers');
    expect(getByTestId(root, 'collection-config-auth-subheading').text.trim()).toBe('Auth');
    expect(queryByTestId(root, 'collection-config-vars-subheading')).toBeNull();
    expect(queryByTestId(root, 'collection-config-script-subheading')).toBeNull();
    expect(queryByTestId(root, 'collection-config-tests-subheading')).toBeNull();
  });

  it('renders only variables, script and tests for the execution section', () => {
    const root = useRenderToDom(<CollectionConfiguration {...props} sectionType="execution" />);
    expect(getByTestId(root, 'collection-config-vars-subheading').text.trim()).toBe('Variables');
    expect(getByTestId(root, 'collection-config-script-subheading').text.trim()).toBe('Script');
    expect(getByTestId(root, 'collection-config-tests-subheading').text.trim()).toBe('Tests');
    expect(queryByTestId(root, 'collection-config-headers-subheading')).toBeNull();
    expect(queryByTestId(root, 'collection-config-auth-subheading')).toBeNull();
  });
});
