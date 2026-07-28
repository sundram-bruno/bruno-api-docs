import { test, expect } from '../../playwright';

const VARS_PLAYGROUND = '/?fixture=vars#/?pg=1&dock=bottom';

test.describe('Playground variables: highlight, hover card and inline edit', () => {
  test.beforeEach(async ({ page, playground, playgroundEnvSwitcher }) => {
    await page.goto(VARS_PLAYGROUND);
    await playground.runner.waitFor({ state: 'visible' });
    await playground.openTreeItem(['Customers', 'Variables Demo']);
    await playground.view.waitFor({ state: 'visible' });
    await playgroundEnvSwitcher.selectEnvironment('Dev');
  });

  test('highlights a resolved variable in the URL bar', async ({ playgroundVariable }) => {
    await expect(playgroundVariable.token('host')).toHaveClass(/variable-valid/);
  });

  test('paints variable tokens in the request body editor', async ({ playground, playgroundVariable }) => {
    await playground.selectTab('body');
    await expect(playgroundVariable.monacoValid.first()).toBeVisible();
  });

  test('hovering a body variable shows its card with scope and resolved value', async ({
    playground,
    playgroundVariable
  }) => {
    await playground.selectTab('body');
    await playgroundVariable.hoverMonacoToken('host');
    await expect(playgroundVariable.name).toHaveText('host');
    await expect(playgroundVariable.scopeBadge).toHaveText('Environment');
    await expect(playgroundVariable.value).toHaveText('https://api.dev.example.com');
  });

  test('the body card stays clear of its token as the edit field grows', async ({
    playground,
    playgroundVariable
  }) => {
    await playground.selectTab('body');
    await playgroundVariable.hoverMonacoToken('host');

    await playgroundVariable.value.click();
    await playgroundVariable.editField.fill('one\ntwo\nthree\nfour\nfive');

    await expect.poll(() => playgroundVariable.overlapsMonacoToken('host')).toBe(false);
  });

  test('hovering a URL variable shows its card with scope and resolved value', async ({ playgroundVariable }) => {
    await playgroundVariable.hoverInputToken('host');
    await expect(playgroundVariable.name).toHaveText('host');
    await expect(playgroundVariable.scopeBadge).toHaveText('Environment');
    await expect(playgroundVariable.value).toHaveText('https://api.dev.example.com');
  });

  test('editing a variable from the card updates its resolved value', async ({ playgroundVariable }) => {
    await playgroundVariable.hoverInputToken('host');
    await playgroundVariable.editTo('https://edited.example.com');
    await expect(playgroundVariable.value).toHaveText('https://edited.example.com');
  });

  test('a read-only scope is not editable', async ({ playground, playgroundVariable }) => {
    await playground.selectTab('headers');
    await playgroundVariable.hoverInputToken('process.env.HOME');
    await expect(playgroundVariable.note).toHaveText('read-only');

    await playgroundVariable.value.click();
    await expect(playgroundVariable.editField).toHaveCount(0);
  });
});
