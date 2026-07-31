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

  test('Escape discards an edit', async ({ playground }) => {
    await playground.variable.hoverInputToken('host');
    await playground.variable.startEditing('https://discarded.example.com');
    await playground.variable.editField.press('Escape');

    await expect(playground.variable.value).toHaveText('https://api.dev.example.com');
  });

  test('clicking away saves the edit', async ({ page, playground }) => {
    await playground.variable.hoverInputToken('host');
    await playground.variable.startEditing('https://blurred.example.com');
    await page.keyboard.press('Tab');

    await expect(playground.variable.value).toHaveText('https://blurred.example.com');
  });

  test('Shift-Enter adds a newline instead of saving', async ({ playground }) => {
    await playground.variable.hoverInputToken('host');
    await playground.variable.startEditing('first');
    await playground.variable.editField.press('Shift+Enter');
    await playground.variable.editField.press('s');

    await expect(playground.variable.editField).toHaveValue('first\ns');
  });

  test('a read-only scope is not editable', async ({ playground }) => {
    await playground.selectTab('headers');
    await playground.variable.hoverInputToken('process.env.HOME');
    await expect(playground.variable.note).toHaveText('read-only');

    await playground.variable.value.click();
    await expect(playground.variable.editField).toHaveCount(0);
  });

  test('clicking the value puts the caret at the end, not the start', async ({ playground }) => {
    await playground.variable.hoverInputToken('host');
    await playground.variable.value.click();

    const caret = await playground.variable.editField.evaluate(
      (el: HTMLTextAreaElement) => ({ start: el.selectionStart, end: el.selectionEnd, length: el.value.length })
    );

    expect(caret.length).toBeGreaterThan(0);
    expect(caret.start).toBe(caret.length);
    expect(caret.end).toBe(caret.length);
  });

  test('the copy control stays available while the value is being edited', async ({ playground }) => {
    await playground.variable.hoverInputToken('host');
    await expect(playground.variable.copyButton).toHaveCount(1);

    await playground.variable.startEditing('https://edited.example.com');

    await expect(playground.variable.editField).toBeVisible();
    await expect(playground.variable.copyButton).toHaveCount(1);
  });

  test('an unset secret starts blank with a reveal control and takes a typed value', async ({ playground }) => {
    await playground.variable.hoverInputToken('unsetSecret');

    await expect(playground.variable.value).toHaveText('');
    await expect(playground.variable.revealToggle).toHaveCount(1);

    await playground.variable.editTo('typed-secret');

    await expect(playground.variable.value).toHaveText('*'.repeat('typed-secret'.length));

    await playground.variable.revealToggle.click();
    await expect(playground.variable.value).toHaveText('typed-secret');
  });

  test('an external secret is editable and keeps its Secret scope', async ({ playground }) => {
    await playground.variable.hoverInputToken('vaultKey');

    await expect(playground.variable.scopeBadge).toHaveText('Secret');
    await expect(playground.variable.value).toHaveText('');

    await playground.variable.editTo('vault-value');

    await expect(playground.variable.value).toHaveText('*'.repeat('vault-value'.length));
  });

  test('a typed secret stays masked in the card until revealed', async ({ playground }) => {
    await playground.variable.hoverInputToken('unsetSecret');
    await playground.variable.editTo('typed-secret');

    await expect(playground.variable.card).not.toContainText('typed-secret');

    await playground.variable.revealToggle.click();

    await expect(playground.variable.card).toContainText('typed-secret');
  });
});
