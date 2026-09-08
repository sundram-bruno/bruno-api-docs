import { readFile } from 'node:fs/promises';
import { load } from 'js-yaml';
import { test, expect } from '../../playwright';

test.use({ colorScheme: 'light' });

const DESKTOP = { width: 1280, height: 900 };
const MOBILE = { width: 390, height: 800 };

test.describe('Open in Bruno — non-git collection', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await page.goto('/?nogit=1');
  });

  test('CTA renders as a button without a Fetch-in-Bruno link', async ({ pageHeader }) => {
    await expect(pageHeader.openInBruno).toBeVisible();
    await expect(pageHeader.openInBruno).not.toHaveAttribute('href', /.*/);
    await expect(pageHeader.openInBruno).toHaveAttribute('type', 'button');
  });

  test('clicking the CTA opens the dialog with the import steps and the Download Bruno link', async ({ pageHeader, openInBrunoModal }) => {
    await pageHeader.openInBruno.click();

    await expect(openInBrunoModal.root).toBeVisible();
    await expect(openInBrunoModal.title).toContainText('Open in Bruno');
    await expect(openInBrunoModal.downloadCollection).toBeVisible();

    await expect(openInBrunoModal.steps).toHaveCount(2);
    await expect(openInBrunoModal.steps.nth(0)).toContainText('Import Collection');
    await expect(openInBrunoModal.steps.nth(1)).toContainText('bruno-testbench.yml');

    await expect(openInBrunoModal.downloadBruno).toHaveAttribute('href', 'https://www.usebruno.com/downloads');
    await expect(openInBrunoModal.downloadBruno).toHaveAttribute('target', '_blank');
    await expect(openInBrunoModal.downloadBruno).toHaveAttribute('rel', /noopener/);
  });

  test('Download Collection saves the original OpenCollection YAML', async ({ page, pageHeader, openInBrunoModal }) => {
    await pageHeader.openInBruno.click();

    const downloadPromise = page.waitForEvent('download');
    await openInBrunoModal.downloadCollection.click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toBe('bruno-testbench.yml');

    const path = await download.path();
    const text = await readFile(path, 'utf8');

    expect(text).toContain('opencollection: "1.0.0"');
    expect(text).not.toContain('isCollapsed');

    const parsed = load(text) as { opencollection: string; info: { name: string }; items: unknown[] };
    expect(parsed.opencollection).toBe('1.0.0');
    expect(parsed.info.name).toBe('Bruno Testbench');
    expect(parsed.items.length).toBeGreaterThan(0);
  });

  test('Escape and the close button both dismiss the dialog', async ({ page, pageHeader, openInBrunoModal }) => {
    await pageHeader.openInBruno.click();
    await expect(openInBrunoModal.root).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(openInBrunoModal.root).toHaveCount(0);

    await pageHeader.openInBruno.click();
    await expect(openInBrunoModal.root).toBeVisible();
    await openInBrunoModal.closeButton.click();
    await expect(openInBrunoModal.root).toHaveCount(0);
  });

  test('mobile glyph CTA still opens the dialog', async ({ page, pageHeader, openInBrunoModal }) => {
    await page.setViewportSize(MOBILE);
    await expect(pageHeader.openInBruno).toHaveClass(/is-icon/);

    await pageHeader.openInBruno.click();
    await expect(openInBrunoModal.root).toBeVisible();
  });
});
