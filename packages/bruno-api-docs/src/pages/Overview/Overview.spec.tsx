import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, it, expect } from 'vitest';
import type { OpenCollection } from '@opencollection/types';
import { useRenderToDom } from '@/hooks/useRenderToDom';
import { query } from '@/test-utils/dom';
import { Overview } from './Overview';

/** Every Overview section shares one test id, so find a section by its text. */
const sectionNamed = (root: ReturnType<typeof useRenderToDom>, name: string) => {
  const match = root
    .querySelectorAll('[data-testid="overview-section-label"]')
    .find((section) => section.text.includes(name));
  if (!match) throw new Error(`No section named ${name}`);
  return match;
};

describe('Overview', () => {
  it('renders the headline, stats, docs and configuration', () => {
    const collection: OpenCollection = {
      info: { name: 'Hotel Booking API', version: '1.0.0' },
      config: { environments: [{ name: 'Development', variables: [{ name: 'baseUrl', value: 'x' }] }] },
      request: { headers: [{ name: 'Accept', value: 'application/json' }] },
      docs: '# Getting started\nUse this API.'
    };

    const html = renderToStaticMarkup(<Overview collection={collection} />);

    expect(html).toContain('Hotel Booking API');
    expect(html).toContain('Version : 1.0.0');
    expect(html).toContain('Accept');
    expect(html).toContain('application/json');
    expect(html).toContain('Getting started'); // collection docs rendered
    expect(html).toContain('Collection Configuration');
  });

  it('renders an empty-state placeholder for each section when the collection is bare', () => {
    const collection: OpenCollection = {
      info: { name: 'Empty API', version: '1.0.0' }
    };

    const html = renderToStaticMarkup(<Overview collection={collection} />);

    expect(html).toContain('No overview content yet');
    expect(html).toContain('No configuration set');
  });
});

describe('Overview execution context section', () => {
  it('splits collection configuration from the execution context', () => {
    const collection: OpenCollection = {
      info: { name: 'Hotel Booking API' },
      request: {
        headers: [{ name: 'Accept', value: 'application/json' }],
        scripts: [{ type: 'before-request', code: 'pre()' }]
      }
    } as unknown as OpenCollection;

    const html = renderToStaticMarkup(<Overview collection={collection} />);

    expect(html).toContain('Collection Configuration');
    expect(html).toContain('Execution Context');
  });

  it('omits the Execution Context heading when the collection has no vars, scripts or tests', () => {
    const collection: OpenCollection = {
      info: { name: 'Hotel Booking API' },
      request: { headers: [{ name: 'Accept', value: 'application/json' }] }
    } as unknown as OpenCollection;

    const html = renderToStaticMarkup(<Overview collection={collection} />);

    expect(html).toContain('Collection Configuration');
    expect(html).not.toContain('Execution Context');
  });
});

describe('Overview execution context accordion', () => {
  it('renders the Execution Context section as an expanded accordion', () => {
    const collection: OpenCollection = {
      info: { name: 'Hotel Booking API' },
      request: {
        headers: [{ name: 'Accept', value: 'application/json' }],
        scripts: [{ type: 'before-request', code: 'pre()' }]
      }
    } as unknown as OpenCollection;

    const root = useRenderToDom(<Overview collection={collection} />);
    const toggle = query(sectionNamed(root, 'Execution Context'), 'button');
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
  });
});
