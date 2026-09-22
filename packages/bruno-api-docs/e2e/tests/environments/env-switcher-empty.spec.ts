import { test, expect } from '../../playwright';

const NO_ENVIRONMENTS = '/?fixture=descriptions';

test.describe('Environment switcher with no environments', () => {
  test('is hidden in the docs header', async ({ page, envSwitcher }) => {
    await page.goto(NO_ENVIRONMENTS);
    await expect(envSwitcher.showVarsToggle).toBeVisible();
    await expect(envSwitcher.root).toHaveCount(0);
  });

  test('still shows its empty state in the playground sidebar', async ({ page, playground }) => {
    await page.goto(`${NO_ENVIRONMENTS}#/?pg=1&dock=bottom`);
    await playground.ensureSidebarOpen();
    await expect(playground.envSwitcher.trigger).toBeVisible();
    await expect(playground.envSwitcher.trigger).toContainText('No environments');
  });

  test('opens no menu in the playground, and shows no caret', async ({ page, playground }) => {
    await page.goto(`${NO_ENVIRONMENTS}#/?pg=1&dock=bottom`);
    await playground.ensureSidebarOpen();
    const { trigger } = playground.envSwitcher;

    await expect(trigger).toHaveAttribute('aria-disabled', 'true');
    await expect(trigger.locator('.env-switcher-chevron')).toHaveCount(0);

    // Forced: Playwright sees it as disabled and would not click it otherwise.
    await trigger.click({ force: true });
    await page.waitForTimeout(300);
    await expect(playground.envSwitcher.menu).toHaveCount(0);
  });
});
