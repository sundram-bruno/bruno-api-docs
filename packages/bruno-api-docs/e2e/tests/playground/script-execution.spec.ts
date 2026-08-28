import { test, expect } from '../../playwright';
import type { Page } from '@playwright/test';
import type { CodeEditorComponent } from '../../components/code-editor/code-editor.component';

const LIBRARY_TESTS_SCRIPT = `
const moment = require('moment');
const CryptoJS = require('crypto-js');
const { v4, validate } = require('uuid');
const { nanoid } = require('nanoid');
const tv4 = require('tv4');

test('moment formats a date', function () {
  expect(moment('2026-01-02').format('YYYY-MM-DD')).to.equal('2026-01-02');
});

test('crypto-js hashes and uuid validates', function () {
  expect(CryptoJS.SHA256('abc').toString()).to.equal('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  expect(validate(v4())).to.equal(true);
  expect(nanoid(10)).to.have.lengthOf(10);
});

test('tv4 validates against a schema', function () {
  expect(tv4.validate({ a: 1 }, { type: 'object' })).to.equal(true);
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
