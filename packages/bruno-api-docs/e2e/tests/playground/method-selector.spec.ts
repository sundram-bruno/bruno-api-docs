import { test, expect } from '../../playwright';

const STANDARD_METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD', 'TRACE', 'CONNECT'];

test.describe('Playground method selector', () => {
  test.beforeEach(async ({ playground }) => {
    await playground.open('bottom');
    await playground.openRequest('get users');
  });

  test('offers the nine standard methods in the app order, then "+ Add Custom"', async ({ methodSelector }) => {
    expect(await methodSelector.optionIds()).toEqual([...STANDARD_METHODS, 'add-custom']);
  });

  test('selects TRACE and marks it as the chosen row', async ({ methodSelector }) => {
    await methodSelector.select('TRACE');
    await expect(methodSelector.trigger).toHaveText('TRACE');

    await methodSelector.open();
    await expect(methodSelector.option('TRACE')).toHaveAttribute('aria-selected', 'true');
  });

  test('spells the method out in full, unlike the abbreviated sidebar', async ({ methodSelector, playground }) => {
    await methodSelector.select('DELETE');
    await expect(methodSelector.trigger).toHaveText('DELETE');
    await expect(playground.sidebarItem('get users').locator('.navlink-method')).toHaveText('DEL');

    await methodSelector.select('CONNECT');
    await expect(methodSelector.trigger).toHaveText('CONNECT');
    await expect(playground.sidebarItem('get users').locator('.navlink-method')).toHaveText('CON');
  });

  test('keeps TRACE unabbreviated in the sidebar', async ({ methodSelector, playground }) => {
    await methodSelector.select('TRACE');
    await expect(playground.sidebarItem('get users').locator('.navlink-method')).toHaveText('TRACE');
  });

  test.describe('custom method', () => {
    test('accepts a typed method, upper-casing it, and ticks no row', async ({ methodSelector }) => {
      await methodSelector.enterCustom('purge');
      await expect(methodSelector.trigger).toHaveText('PURGE');

      await methodSelector.open();
      await expect(methodSelector.selectedOption).toHaveCount(0);
    });

    test('opens an empty field so typing replaces the current method', async ({ methodSelector }) => {
      await methodSelector.startCustom('');
      await expect(methodSelector.customInput).toHaveValue('');
    });

    test('discards the entry on Escape', async ({ methodSelector }) => {
      await methodSelector.select('PATCH');
      await methodSelector.startCustom('REPORT');
      await methodSelector.customInput.press('Escape');

      await expect(methodSelector.trigger).toHaveText('PATCH');
    });

    test('keeps the previous method when the field is left empty', async ({ methodSelector, playground }) => {
      await methodSelector.select('PUT');
      await methodSelector.startCustom('');
      await playground.header.click();

      await expect(methodSelector.trigger).toHaveText('PUT');
    });

    test('keeps the previous method when Enter is pressed on an empty field', async ({ methodSelector }) => {
      await methodSelector.select('PUT');
      await methodSelector.startCustom('');
      await methodSelector.customInput.press('Enter');

      await expect(methodSelector.trigger).toHaveText('PUT');
    });

    test('trims a padded method so it stays a valid HTTP method', async ({ methodSelector }) => {
      await methodSelector.enterCustom('  purge  ');

      await expect(methodSelector.trigger).toHaveText('PURGE');
      await expect(methodSelector.trigger).toHaveAttribute('title', 'PURGE');
    });

    test('returns focus to the trigger after committing with Enter', async ({ methodSelector }) => {
      await methodSelector.startCustom('REPORT');
      await methodSelector.customInput.press('Enter');

      await expect(methodSelector.trigger).toBeFocused();
    });

    test('returns focus to the trigger after Escape', async ({ methodSelector }) => {
      await methodSelector.startCustom('REPORT');
      await methodSelector.customInput.press('Escape');

      await expect(methodSelector.trigger).toBeFocused();
    });

    test('shows a long method in full via the title, clipped on screen', async ({ methodSelector }) => {
      await methodSelector.enterCustom('LONG_NOTE_METHOD_NAME');

      await expect(methodSelector.trigger).toHaveAttribute('title', 'LONG_NOTE_METHOD_NAME');
      const clipped = await methodSelector.trigger.evaluate((button) => {
        const badge = button.querySelector('.method-badge') as HTMLElement;
        return badge.scrollWidth > badge.clientWidth;
      });
      expect(clipped).toBe(true);
    });
  });

  // Browsers reject TRACE/CONNECT before any connection is made and say why. That
  // explanation must reach the reader instead of the generic CORS text the runner
  // shows for an opaque network failure.
  test.describe('sending a method the browser forbids', () => {
    for (const method of ['TRACE', 'CONNECT']) {
      test(`surfaces the browser's own explanation for ${method}`, async ({ page, methodSelector }) => {
        await methodSelector.select(method);
        await page.getByRole('button', { name: 'Send' }).click();

        await expect(page.getByTestId('error-banner')).toBeVisible();
        await expect(page.getByTestId('error-message')).toContainText(method);
        await expect(page.getByTestId('error-message')).not.toContainText('CORS');
      });
    }
  });
});
