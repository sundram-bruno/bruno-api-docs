import { renderToStaticMarkup } from 'react-dom/server';
import { describe, it, expect } from 'vitest';
import { Tags } from './Tags';

describe('Tags', () => {
  it('renders nothing for an empty tag list', () => {
    expect(renderToStaticMarkup(<Tags tags={[]} />)).toBe('');
  });

  it('renders one chip per tag with the derived test id', () => {
    const html = renderToStaticMarkup(<Tags tags={['auth', 'smoke']} testId="request-tags" />);
    expect(html).toContain('data-testid="request-tags"');
    expect(html).toContain('auth');
    expect(html).toContain('smoke');
    expect(html.match(/data-testid="request-tags-chip"/g)).toHaveLength(2);
  });
});
