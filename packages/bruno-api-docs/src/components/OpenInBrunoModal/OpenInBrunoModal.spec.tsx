import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { OpenInBrunoModal, BRUNO_DOWNLOAD_URL } from './OpenInBrunoModal';
import { useRenderToDom } from '@/hooks/useRenderToDom';
import { query, getByTestId, queryByTestId } from '@/test-utils/dom';

vi.mock('@/ui/Portal/Portal', () => ({
  Portal: ({ children }: { children: React.ReactNode }) => children
}));

const modal = (open = true) => (
  <OpenInBrunoModal open={open} onClose={() => {}} filename="hotel-booking-api.yml" onDownload={() => {}} testId="oib" />
);

describe('OpenInBrunoModal', () => {
  it('renders nothing while closed', () => {
    expect(queryByTestId(useRenderToDom(modal(false)), 'oib')).toBeNull();
  });

  it('renders the title with the Bruno glyph and a download button', () => {
    const root = useRenderToDom(modal());
    const title = getByTestId(root, 'oib-title');
    expect(title.text).toContain('Open in Bruno');
    expect(title.querySelector('svg')).not.toBeNull();
    const button = getByTestId(root, 'oib-download');
    expect(button.getAttribute('type')).toBe('button');
    expect(button.text).toContain('Download Collection');
  });

  it('lists two import steps and names the downloaded file', () => {
    const root = useRenderToDom(modal());
    const steps = getByTestId(root, 'oib-steps').querySelectorAll('li');
    expect(steps).toHaveLength(2);
    expect(steps[0].text).toContain('Import Collection');
    expect(query(steps[1], 'code').text).toBe('hotel-booking-api.yml');
  });

  it('links to the Bruno downloads page in a new tab', () => {
    const link = getByTestId(useRenderToDom(modal()), 'oib-download-bruno');
    expect(link.getAttribute('href')).toBe(BRUNO_DOWNLOAD_URL);
    expect(link.getAttribute('target')).toBe('_blank');
    expect(link.getAttribute('rel')).toContain('noopener');
  });
});
