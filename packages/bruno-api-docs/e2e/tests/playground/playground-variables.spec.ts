import { test, expect } from '../../playwright';
import { EnvSwitcherComponent } from '../../components/layout/env-switcher.component';
import { PlaygroundVariableComponent } from '../../components/playground/playground-variable.component';

const openVarsPlayground = async (
  page: import('@playwright/test').Page,
  playground: import('../../components/playground.component').PlaygroundComponent
): Promise<void> => {
  await page.goto('/?fixture=vars#/?pg=1&dock=bottom');
  await playground.runner.waitFor({ state: 'visible' });
  await playground.openTreeItem(['Customers', 'Variables Demo']);
  await playground.view.waitFor({ state: 'visible' });
  await new EnvSwitcherComponent(page, 'playground-env-switcher').selectEnvironment('Dev');
};

test.describe('Playground variables: highlight, hover card and inline edit', () => {
  test.beforeEach(async ({ page, playground }) => {
    await openVarsPlayground(page, playground);
  });

  test('highlights a resolved variable in the URL bar', async ({ page }) => {
    const vars = new PlaygroundVariableComponent(page);
    await expect(vars.inputToken('host')).toHaveClass(/variable-valid/);
  });

  test('paints variable tokens in the Monaco request body', async ({ page, playground }) => {
    const vars = new PlaygroundVariableComponent(page);
    await playground.selectTab('body');
    await expect(vars.monacoValid.first()).toBeVisible();
  });

  test('hovering a URL variable shows its card with scope and resolved value', async ({ page }) => {
    const vars = new PlaygroundVariableComponent(page);
    await vars.hoverInputToken('host');
    await expect(vars.name).toHaveText('host');
    await expect(vars.scopeBadge).toHaveText('Environment');
    await expect(vars.value).toHaveText('https://api.dev.example.com');
  });

  test('editing a variable from the card updates its resolved value', async ({ page }) => {
    const vars = new PlaygroundVariableComponent(page);
    await vars.hoverInputToken('host');
    await vars.editTo('https://edited.example.com');
    await expect(vars.value).toHaveText('https://edited.example.com');
  });

  test('a read-only scope (process.env) is not editable', async ({ page, playground }) => {
    const vars = new PlaygroundVariableComponent(page);
    await playground.selectTab('headers');
    await vars.hoverInputToken('process.env.HOME');
    await expect(vars.note).toHaveText('read-only');

    await vars.value.click();
    await expect(vars.editField).toHaveCount(0);
  });
});
