import { test, expect } from '../../playwright';
import type { Page } from '@playwright/test';
import type { CodeEditorComponent } from '../../components/code-editor/code-editor.component';

const LIBRARY_TESTS_SCRIPT = `
const moment = require('moment');
const CryptoJS = require('crypto-js');
const { v4, validate } = require('uuid');
const { nanoid } = require('nanoid');
const jwt = require('jsonwebtoken');

test('moment formats a date', function () {
  expect(moment('2026-01-02').format('YYYY-MM-DD')).to.equal('2026-01-02');
});

test('crypto-js hashes and uuid validates', function () {
  expect(CryptoJS.SHA256('abc').toString()).to.have.lengthOf(64);
  expect(validate(v4())).to.equal(true);
  expect(nanoid(10)).to.have.lengthOf(10);
});

test('jsonwebtoken round-trips a signed token', function () {
  const token = jwt.sign({ userId: 7 }, 'secret', { expiresIn: '1h' });
  expect(jwt.verify(token, 'secret').userId).to.equal(7);
});
`;

const setEditorScript = async (page: Page, editor: CodeEditorComponent, script: string): Promise<void> => {
  await editor.focus();
  await page.keyboard.press('ControlOrMeta+a');
  await page.keyboard.insertText(script);
};

test.describe('playground script execution', () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  test('runs a tests script using the safe-mode libraries on Send', async ({ page, playground, responsePane }) => {
    await page.route('**/api/users**', (route) =>
      route.fulfill({
        status: 200,
        headers: { 'content-type': 'application/json', 'access-control-allow-origin': '*' },
        body: JSON.stringify({ users: [{ id: 1, name: 'Ada' }] })
      })
    );

    await page.goto('/#/?pg=1&dock=bottom');
    await playground.openSidebarItem('get users');

    await playground.selectTab('tests');
    await setEditorScript(page, playground.testsEditor, LIBRARY_TESTS_SCRIPT);

    await responsePane.send();
    await responsePane.switchToTab('tests');

    await expect(page.getByText(/Passed: [1-9]\d*, Failed: 0/).first()).toBeVisible();
    await expect(page.getByText(/Failed: [1-9]/)).toHaveCount(0);
  });
});
