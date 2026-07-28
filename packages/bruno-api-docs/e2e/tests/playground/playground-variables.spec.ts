import { test, expect } from '../../playwright';

const VARS_PLAYGROUND = '/?fixture=vars#/?pg=1&dock=bottom';

test.describe('Playground variables: highlight, hover card and inline edit', () => {
  test.beforeEach(async ({ page, playground }) => {
    await page.goto(VARS_PLAYGROUND);
    await playground.runner.waitFor({ state: 'visible' });
    await playground.openTreeItem(['Customers', 'Variables Demo']);
    await playground.view.waitFor({ state: 'visible' });
    await playground.envSwitcher.selectEnvironment('Dev');
  });

  test('highlights a resolved variable in the URL bar', async ({ playground }) => {
    await expect(playground.variable.token('host')).toHaveClass(/variable-valid/);
  });

  test('paints variable tokens in the request body editor', async ({ playground }) => {
    await playground.selectTab('body');
    await expect(playground.variable.monacoValid.first()).toBeVisible();
  });

  test('hovering a body variable shows its card with scope and resolved value', async ({ playground }) => {
    await playground.selectTab('body');
    await playground.variable.hoverMonacoToken('host');
    await expect(playground.variable.name).toHaveText('host');
    await expect(playground.variable.scopeBadge).toHaveText('Environment');
    await expect(playground.variable.value).toHaveText('https://api.dev.example.com');
  });

  test('the body card stays clear of its token as the edit field grows', async ({ playground }) => {
    await playground.selectTab('body');
    await playground.variable.hoverMonacoToken('host');

    await playground.variable.value.click();
    await playground.variable.editField.fill('one\ntwo\nthree\nfour\nfive');

    await expect.poll(() => playground.variable.overlapsMonacoToken('host')).toBe(false);
  });

  test('hovering a URL variable shows its card with scope and resolved value', async ({ playground }) => {
    await playground.variable.hoverInputToken('host');
    await expect(playground.variable.name).toHaveText('host');
    await expect(playground.variable.scopeBadge).toHaveText('Environment');
    await expect(playground.variable.value).toHaveText('https://api.dev.example.com');
  });

  test('editing a variable from the card updates its resolved value', async ({ playground }) => {
    await playground.variable.hoverInputToken('host');
    await playground.variable.editTo('https://edited.example.com');
    await expect(playground.variable.value).toHaveText('https://edited.example.com');
  });

  test('a read-only scope is not editable', async ({ playground }) => {
    await playground.selectTab('headers');
    await playground.variable.hoverInputToken('process.env.HOME');
    await expect(playground.variable.note).toHaveText('read-only');

    await playground.variable.value.click();
    await expect(playground.variable.editField).toHaveCount(0);
  });
});
