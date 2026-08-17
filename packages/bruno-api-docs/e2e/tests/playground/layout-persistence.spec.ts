import { test, expect } from '../../playwright';

const DESKTOP = { width: 1280, height: 900 };
const openAt = (dock: string): string => `/#/?pg=1&dock=${dock}`;
const REQUEST_PATH = ['billing', 'customers', 'Get Customers - Filter by Date Range'];

test.describe('playground layout persistence (desktop)', () => {
  test.use({ viewport: DESKTOP });

  test('restores the bottom sheet height across a reload', async ({ page, playground }) => {
    await playground.open('bottom');
    await expect(playground.bottomPanel).toBeVisible();

    await playground.grabBottomResizer();
    await playground.movePointerToY(300);
    await playground.releasePointer();
    const resized = await playground.bottomPanelHeight();
    expect(resized).toBeGreaterThan(560);

    await page.reload();
    await expect(playground.bottomPanel).toBeVisible();
    expect(Math.abs((await playground.bottomPanelHeight()) - resized)).toBeLessThan(5);
  });

  test('restores the inline panel width across a reload', async ({ page, playground }) => {
    await playground.open('inline');
    await expect(playground.inlinePanel).toBeVisible();

    await playground.grabInlineResizer();
    await playground.movePointerToX(500);
    await playground.releasePointer();
    const resized = await playground.inlinePanelWidth();
    expect(resized).toBeGreaterThan(700);

    await page.reload();
    await expect(playground.inlinePanel).toBeVisible();
    expect(Math.abs((await playground.inlinePanelWidth()) - resized)).toBeLessThan(5);
  });

  test('reopens in the last-used dock after closing (fresh open, no dock in URL)', async ({
    requestPage,
    playground
  }) => {
    await requestPage.open(REQUEST_PATH);
    await requestPage.urlBar.tryButton.click();
    await expect(playground.bottomPanel).toBeVisible();

    await playground.selectDock('inline');
    await expect(playground.inlinePanel).toBeVisible();

    await playground.close();
    await expect(playground.header).toHaveCount(0);

    await requestPage.urlBar.tryButton.click();
    await expect(playground.inlinePanel).toBeVisible();
    await expect(playground.bottomPanel).toHaveCount(0);
  });

  test('a dock in the URL wins over the stored dock', async ({ page, playground }) => {
    await page.addInitScript(() => {
      sessionStorage.setItem('oc-docs:playgroundDock', 'inline');
    });

    await page.goto(openAt('modal'));
    await expect(playground.modalPanel).toBeVisible();
    await expect(playground.inlinePanel).toHaveCount(0);
  });

  test('an invalid stored dock falls back to the default on a fresh open', async ({
    page,
    requestPage,
    playground
  }) => {
    await page.addInitScript(() => {
      sessionStorage.setItem('oc-docs:playgroundDock', 'sideways');
    });

    await requestPage.open(REQUEST_PATH);
    await requestPage.urlBar.tryButton.click();
    await expect(playground.bottomPanel).toBeVisible();
  });

  test('a collapsed bottom sheet reopens expanded after a reload', async ({ page, playground }) => {
    await playground.open('bottom');
    await expect(playground.bottomPanel).toBeVisible();
    const expanded = await playground.bottomPanelHeight();

    await playground.grabBottomResizer();
    await playground.movePointerToY(890);
    await playground.releasePointer();
    expect(await playground.bottomPanelHeight()).toBeLessThan(100);

    await page.reload();
    await expect(playground.bottomPanel).toBeVisible();
    expect(Math.abs((await playground.bottomPanelHeight()) - expanded)).toBeLessThan(5);
  });
});
