import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, it, expect } from 'vitest';
import TagFilter from './TagFilter';

describe('TagFilter', () => {
  it('renders nothing when the collection has no tags', () => {
    const html = renderToStaticMarkup(
      <TagFilter tags={[]} selected={new Set()} onToggle={() => {}} />
    );
    expect(html).toBe('');
  });

  it('shows the neutral label when nothing is selected', () => {
    const html = renderToStaticMarkup(
      <TagFilter tags={['auth', 'smoke']} selected={new Set()} onToggle={() => {}} />
    );
    expect(html).toContain('Tags');
    expect(html).toContain('data-testid="search-tag-filter"');
    expect(html).toContain('class="dropdown-button"');
  });

  it('shows the tag name when exactly one is selected', () => {
    const html = renderToStaticMarkup(
      <TagFilter tags={['auth', 'smoke']} selected={new Set(['auth'])} onToggle={() => {}} />
    );
    expect(html).toContain('auth');
    expect(html).toContain('class="dropdown-button is-active"');
  });

  it('shows a count when several are selected', () => {
    const html = renderToStaticMarkup(
      <TagFilter tags={['auth', 'smoke', 'bookings']} selected={new Set(['auth', 'smoke'])} onToggle={() => {}} />
    );
    expect(html).toContain('2 tags');
  });
});
