import { test, expect } from '../../playwright';

const DESKTOP = { width: 1280, height: 900 };

test.describe('Playground query bar — code snippet', () => {
  test.use({ viewport: DESKTOP });

  test.beforeEach(async ({ playground }) => {
    await playground.open('bottom');
  });

  test('the query bar offers an icon-only snippet control that opens the snippet modal', async ({ playground }) => {
    await playground.openRequest('get users');

    const { codeSnippet } = playground;
    await expect(codeSnippet.iconTrigger).toBeVisible();
    await expect(codeSnippet.iconTrigger).toHaveAttribute('aria-label', 'Generate Code');
    // Icon only — the code box lives in the modal.
    await expect(codeSnippet.code).toHaveCount(0);

    await codeSnippet.openFromIcon();
    await expect(codeSnippet.modalCode).toContainText('curl');
  });

  test('switches languages inside the modal', async ({ playground }) => {
    await playground.openRequest('get users');
    await playground.codeSnippet.openFromIcon();

    await playground.codeSnippet.selectModalLanguage('python');
    await expect(playground.codeSnippet.modalLanguageTab('python')).toHaveAttribute('aria-selected', 'true');
    await expect(playground.codeSnippet.modalCode).toContainText('requests');
  });

  test('the snippet url substitutes filled path params and keeps unfilled placeholders', async ({
    page,
    playground
  }) => {
    await playground.openRequest('Jokes');
    await playground.codeSnippet.openFromIcon();
    await expect(playground.codeSnippet.modalCode).toContainText('/posts/1');
    await page.keyboard.press('Escape');

    // A fresh `:commentId` segment is a path param with no value yet.
    await playground.urlInput.click();
    await page.keyboard.press('End');
    await page.keyboard.type('/:commentId');

    await playground.codeSnippet.openFromIcon();
    // Empty path params keep their placeholder instead of collapsing.
    await expect(playground.codeSnippet.modalCode).toContainText('/posts/1/:commentId');
  });
});
