import type { Locator, Page } from '@playwright/test';
import { VariableCardComponent } from '../variable-card/variable-card.component';

/** The hover card over playground request fields. Scoped to the playground view so tokens resolve
 *  there and not to the docs page rendered behind the drawer. */
export class PlaygroundVariableComponent extends VariableCardComponent {
  readonly editField = this.card.getByTestId('variable-info-card-edit');
  readonly monacoValid = this.page.locator('.monaco-editor .variable-valid');
  readonly monacoInvalid = this.page.locator('.monaco-editor .variable-invalid');

  constructor(page: Page) {
    super(page, page.getByTestId('playground-view'));
  }

  /** Editor tokens are inline decorations with no test id of their own. */
  monacoToken(name: string): Locator {
    return this.page
      .locator('.monaco-editor .variable-valid, .monaco-editor .variable-invalid')
      .filter({ hasText: `{{${name}}}` })
      .first();
  }

  /** Tokens in an input mirror sit behind a transparent field and editor tokens behind Monaco's
   *  own mouse handling, so both are hovered by coordinate rather than through `hover()`. */
  async hoverInputToken(name: string): Promise<void> {
    await this.movePointerToToken(this.token(name), name);
  }

  async hoverMonacoToken(name: string): Promise<void> {
    await this.movePointerToToken(this.monacoToken(name), name);
  }

  /** True when the card covers the token it is anchored to, which is what a stale content-widget
   *  layout looks like. */
  async overlapsMonacoToken(name: string): Promise<boolean> {
    const card = await this.card.boundingBox();
    const token = await this.monacoToken(name).boundingBox();
    if (!card || !token) throw new Error(`card and token {{${name}}} must both be laid out`);
    return card.y < token.y + token.height && card.y + card.height > token.y;
  }

  async editTo(text: string): Promise<void> {
    await this.value.click();
    await this.editField.fill(text);
    await this.editField.press('Enter');
  }

  private async movePointerToToken(token: Locator, name: string): Promise<void> {
    await token.scrollIntoViewIfNeeded();
    const box = await token.boundingBox();
    if (!box) throw new Error(`variable token {{${name}}} not found`);
    await this.page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await this.card.waitFor({ state: 'visible' });
  }
}
