import { test, expect } from '../../playwright';

test.describe('Folder page', () => {
  test('displays the folder name and how many requests it contains', async ({ folderPage }) => {
    await folderPage.open(['Realtime']);
    await expect(folderPage.title).toHaveText('Realtime');
    await expect(folderPage.requestCount).toHaveText('10 requests');
  });

  test('shows config inherited from the collection even when the folder has no own config', async ({ folderPage }) => {
    await folderPage.open(['Realtime']);
    await expect(folderPage.configuration.root).toBeVisible();
    await expect(folderPage.emptyState).toBeHidden();

    await test.step('inherited headers are shown with a count chip and a goto-source link', async () => {
      await expect(folderPage.configuration.headers).toBeVisible();
      await expect(folderPage.configuration.headers).toContainText('collection-header');
      await expect(folderPage.configuration.headers).toContainText('header inherited');
      await expect(folderPage.configuration.headers.getByTestId('inherited-source').first()).toBeVisible();
    });

    await test.step('inherited variables are shown, excluding disabled ones', async () => {
      await expect(folderPage.configuration.vars).toBeVisible();
      await expect(folderPage.configuration.vars).toContainText('collection_pre_var');
      await expect(folderPage.configuration.vars).toContainText('1 var inherited');
      await expect(folderPage.configuration.vars).not.toContainText('collection-var-value');
    });
  });

  test('renders the configuration with inherited auth and folder-level scripts', async ({ folderPage }) => {
    await folderPage.open(['billing']);

    await test.step('the configuration is shown instead of the empty state', async () => {
      await expect(folderPage.configuration.root).toBeVisible();
      await expect(folderPage.emptyState).toBeHidden();
    });

    await test.step('the auth group shows the inherited-from-collection badge', async () => {
      await expect(folderPage.configuration.auth).toBeVisible();
      await expect(folderPage.configuration.auth).toContainText('Inherited from collection');
    });

    await test.step('the script group is shown', async () => {
      await expect(folderPage.configuration.script).toBeVisible();
    });
  });

  test('shows the Tests group when the folder defines folder-scoped tests', async ({ folderPage }) => {
    await folderPage.open(['billing', 'customers']);
    await expect(folderPage.title).toHaveText('customers');
    await expect(folderPage.configuration.tests).toBeVisible();
  });

  test('renders the folder docs as markdown and collapses long content behind a "View more" toggle', async ({
    folderPage
  }) => {
    await folderPage.open(['billing']);

    await test.step('the markdown is rendered with formatting', async () => {
      await expect(folderPage.folderMarkdownDocs).toBeVisible();
      await expect(folderPage.folderMarkdownDocs).toContainText('Endpoints for managing');
      await expect(folderPage.folderMarkdownDocs.locator('strong').first()).toHaveText('customers');
    });

    await test.step('long docs collapse to a preview with a "View more" toggle', async () => {
      await expect(folderPage.folderMarkdownDocsToggle).toHaveText('View more');
      await folderPage.folderMarkdownDocsToggle.click();
      await expect(folderPage.folderMarkdownDocsToggle).toHaveText('View less');
    });
  });
});

test.describe('Folder page sections', () => {
  test('separates headers and auth from the execution context', async ({ folderPage }) => {
    await folderPage.open(['Realtime']);

    await expect(folderPage.configurationSection).toBeVisible();
    await expect(folderPage.configurationSection).toContainText('Folder Configuration');
    await expect(folderPage.executionContextSection).toBeVisible();
    await expect(folderPage.executionContextSection).toContainText('Execution Context');

    await test.step('headers stay under Folder Configuration', async () => {
      await expect(folderPage.configurationSection.getByTestId('folder-config-headers')).toBeVisible();
      await expect(folderPage.executionContextSection.getByTestId('folder-config-headers')).toHaveCount(0);
    });

    await test.step('variables move under Execution Context', async () => {
      await expect(folderPage.executionContextSection.getByTestId('folder-config-vars')).toBeVisible();
      await expect(folderPage.configurationSection.getByTestId('folder-config-vars')).toHaveCount(0);
    });
  });
});

test.describe('Folder variable phases', () => {
  test('shows both Pre-Request and Post-Response, marking the empty one "None."', async ({ folderPage }) => {
    await folderPage.open(['Realtime']);
    await expect(folderPage.configuration.vars).toContainText('Pre-Request');
    await expect(folderPage.configuration.vars).toContainText('Post-Response');
    await expect(folderPage.configuration.vars).toContainText('None.');
  });
});

test.describe('Folder empty variable phase', () => {
  test('frames the empty Post-Response table like the populated one beside it', async ({ folderPage }) => {
    await folderPage.open(['Realtime']);
    const empty = folderPage.configuration.vars.getByTestId('property-table-empty');
    await expect(empty).toBeVisible();
    await expect(empty).toHaveText('None.');
    const framing = await empty.evaluate((el) => getComputedStyle(el).boxShadow);
    expect(framing).not.toBe('none');
  });
});

test.describe('Folder execution context accordion', () => {
  test('collapses the Execution Context section and remembers it across a reload', async ({ folderPage, page }) => {
    await folderPage.open(['Realtime']);
    const toggle = folderPage.executionContextSection.getByRole('button', { name: /Execution Context/i });

    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await expect(folderPage.configuration.vars).toBeVisible();

    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(folderPage.configuration.vars).toBeHidden();

    await page.reload();
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  });
});
