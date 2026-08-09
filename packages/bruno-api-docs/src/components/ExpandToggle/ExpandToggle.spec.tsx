import React from 'react';
import { describe, it, expect } from 'vitest';
import { useRenderToDom } from '../../hooks/useRenderToDom';
import { query } from '../../test-utils/dom';
import { ExpandToggle } from './ExpandToggle';

const noop = () => {};

describe('ExpandToggle', () => {
  it('shows the more label while collapsed', () => {
    const root = useRenderToDom(
      <ExpandToggle expanded={false} moreLabel="Show more" lessLabel="Show less" onToggle={noop} testId="t" />
    );

    const button = query(root, '[data-testid="t"]');
    expect(button.text).toContain('Show more');
    expect(button.text).not.toContain('Show less');
    expect(button.attributes['aria-expanded']).toBe('false');
  });

  it('swaps to the less label while expanded', () => {
    const root = useRenderToDom(
      <ExpandToggle expanded moreLabel="Show more" lessLabel="Show less" onToggle={noop} testId="t" />
    );

    const button = query(root, '[data-testid="t"]');
    expect(button.text).toContain('Show less');
    expect(button.attributes['aria-expanded']).toBe('true');
  });

  it('is a button so it is reachable by keyboard', () => {
    const root = useRenderToDom(
      <ExpandToggle expanded={false} moreLabel="More" lessLabel="Less" onToggle={noop} testId="t" />
    );

    const button = query(root, '[data-testid="t"]');
    expect(button.tagName.toLowerCase()).toBe('button');
    expect(button.attributes.type).toBe('button');
  });

  it('points at the region it controls when given one', () => {
    const root = useRenderToDom(
      <ExpandToggle expanded={false} moreLabel="More" lessLabel="Less" onToggle={noop} controls="panel-1" testId="t" />
    );

    expect(query(root, '[data-testid="t"]').attributes['aria-controls']).toBe('panel-1');
  });

  it('omits aria-controls when there is no region to name', () => {
    const root = useRenderToDom(
      <ExpandToggle expanded={false} moreLabel="More" lessLabel="Less" onToggle={noop} testId="t" />
    );

    expect(query(root, '[data-testid="t"]').attributes['aria-controls']).toBeUndefined();
  });

  it('hides the chevron from assistive tech and keeps the caller class', () => {
    const root = useRenderToDom(
      <ExpandToggle
        expanded={false}
        moreLabel="More"
        lessLabel="Less"
        onToggle={noop}
        className="grpc-messages-show-toggle"
        testId="t"
      />
    );

    const button = query(root, '[data-testid="t"]');
    expect(button.attributes.class).toContain('expand-toggle');
    expect(button.attributes.class).toContain('grpc-messages-show-toggle');
    expect(query(root, '.expand-toggle-chevron').attributes['aria-hidden']).toBe('true');
  });
});
