import type { Page } from '@playwright/test';
import { test, expect } from '../../playwright';

const REQUEST = '/?fixture=vars#/customers/variables-demo';

const readClipboard = (page: Page) =>
  expect.poll(() => page.evaluate(() => navigator.clipboard.readText()));

test.describe('Variable-aware code copy', () => {
  test.beforeEach(async ({ page }) => {
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
  });

  test('request body copies raw {{var}} tokens while show-vars is off', async ({ page, requestPage, envSwitcher }) => {
    await requestPage.goto(REQUEST);
    await expect(envSwitcher.showVarsToggle).toHaveAttribute('aria-checked', 'false');

    await requestPage.bodyCode.copyButton.click();

    await readClipboard(page).toContain('"endpoint": "{{host}}/orders"');
  });

  test('request body copies resolved values when show-vars is on, secrets stay masked', async ({
    page,
    requestPage,
    envSwitcher
  }) => {
    await requestPage.goto(REQUEST);
    await envSwitcher.toggle();
    await expect(envSwitcher.showVarsToggle).toHaveAttribute('aria-checked', 'true');

    await requestPage.bodyCode.copyButton.click();

    await readClipboard(page).toContain('"endpoint": "https://api.dev.example.com/orders"');
    await readClipboard(page).toContain('"token": "{{bearer_token}}"');
  });

  test('gRPC message copies resolved values when show-vars is on', async ({ page, grpcRequestPage, envSwitcher }) => {
    await grpcRequestPage.open(['Realtime', 'Order Service']);
    await expect(grpcRequestPage.messages.code(0)).toBeVisible();

    await grpcRequestPage.messages.codeCopy(0).click();
    await readClipboard(page).toContain('"orderId": "{{orderId}}"');

    await envSwitcher.toggle();
    await expect(envSwitcher.showVarsToggle).toHaveAttribute('aria-checked', 'true');

    await grpcRequestPage.messages.codeCopy(0).click();
    await readClipboard(page).toContain('"orderId": "12345"');
  });
});
