import { test, expect } from '../../playwright';

const USERS_BODY = '{"data":[{"id":1,"name":"Alice"}]}';

// Changing the dock placement swaps the dock component, which remounts the request and response
// panes; the selected tab in each pane must survive that remount, as it does in the app.
test.describe('Playground tabs across a dock change', () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  test('the selected request tab is kept when the playground moves to another dock', async ({ playground }) => {
    await playground.open('bottom');
    await playground.openRequest('get users');
    await playground.selectTab('headers');
    await expect(playground.tab('headers')).toHaveAttribute('aria-selected', 'true');

    await playground.selectDock('inline');
    await expect(playground.inlinePanel).toBeVisible();
    await expect(playground.tab('headers')).toHaveAttribute('aria-selected', 'true');

    await playground.selectDock('modal');
    await expect(playground.modalPanel).toBeVisible();
    await expect(playground.tab('headers')).toHaveAttribute('aria-selected', 'true');
  });

  test('the selected response tab is kept when the playground moves to another dock', async ({
    playground,
    responsePane
  }) => {
    await responsePane.mockUsersResponse(USERS_BODY);
    await playground.open('bottom');
    await playground.openRequest('get users');
    await responsePane.send();
    await responsePane.switchToTab('headers');

    await playground.selectDock('inline');
    await expect(playground.inlinePanel).toBeVisible();
    await expect(responsePane.tab('headers')).toHaveAttribute('aria-selected', 'true');
  });
});
