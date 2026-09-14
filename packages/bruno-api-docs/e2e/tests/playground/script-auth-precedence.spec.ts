import { test, expect } from '../../playwright';
import type { Page } from '@playwright/test';
import type { CodeEditorComponent } from '../../components/code-editor/code-editor.component';

const SCRIPT_AUTHORIZATION = 'Bearer script-token';
const CONFIG_TOKEN = 'config-token';

const SET_AUTHORIZATION_SCRIPT = `req.setHeader('authorization', '${SCRIPT_AUTHORIZATION}');`;

const setEditorScript = async (page: Page, editor: CodeEditorComponent, script: string): Promise<void> => {
  await editor.focus();
  await page.keyboard.press('ControlOrMeta+a');
  await page.keyboard.insertText(script);
};

test.describe('auth header precedence between the Auth tab and a pre-request script', () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  test.beforeEach(async ({ playground, responsePane }) => {
    await responsePane.mockUsersResponse(JSON.stringify({ users: [] }));
    await playground.open('bottom');
    await playground.openRequest('get users');
    await playground.selectTab('auth');
    await playground.auth.selectMode('bearer');
    await playground.auth.field('token').fill(CONFIG_TOKEN);
  });

  test('a pre-request script that sets Authorization sends the script value instead of the configured bearer token', async ({ page, playground, responsePane }) => {
    await playground.selectTab('scripts');
    await setEditorScript(page, playground.preRequestScriptEditor, SET_AUTHORIZATION_SCRIPT);

    const sent = page.waitForRequest('**/api/users**');
    await responsePane.send();
    const request = await sent;

    expect(request.headers()['authorization']).toBe(SCRIPT_AUTHORIZATION);
    await expect(responsePane.status).toContainText('200');
  });

  test('without a competing header the configured bearer token is sent', async ({ page, responsePane }) => {
    const sent = page.waitForRequest('**/api/users**');
    await responsePane.send();
    const request = await sent;

    expect(request.headers()['authorization']).toBe(`Bearer ${CONFIG_TOKEN}`);
    await expect(responsePane.status).toContainText('200');
  });
});
