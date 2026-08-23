import { test, expect } from '../../playwright';

const DESKTOP = { width: 1280, height: 900 };

test.describe('playground script execution', () => {
  test.use({ viewport: DESKTOP });

  test('runs collection scripts using the safe-mode libraries on Send', async ({ page, playground }) => {
    await page.route('**/billing/customers', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{ id: 1, name: 'Ada' }])
      })
    );

    await page.goto('/#/?pg=1&dock=bottom');
    await expect(playground.runner).toBeVisible();

    const playgroundSidebar = page.getByTestId('playground-sidebar');
    await playgroundSidebar.getByRole('button', { name: 'billing' }).click();
    await playgroundSidebar.getByRole('button', { name: 'customers' }).click();
    await playgroundSidebar.getByRole('button', { name: 'Get All Customers' }).click();

    await page.getByRole('button', { name: 'Send' }).click();

    await page.getByTestId('response-tabs-more').click();
    await page.getByTestId('response-tabs-more-tests').click();
    await expect(page.getByText('safe-mode libraries work in the playground')).toBeVisible();
    await expect(page.getByText('customers folder scripts ran before the request')).toBeVisible();
  });
});
