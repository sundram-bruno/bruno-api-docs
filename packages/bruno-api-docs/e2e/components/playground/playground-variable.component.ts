import type { Page } from '@playwright/test';
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

  /** Tokens painted in a `HighlightedInput` mirror sit behind a transparent input, so the
   *  pointer is moved by coordinate instead of through `hover()`. */
  async hoverInputToken(name: string): Promise<void> {
    const token = this.token(name);
    await token.scrollIntoViewIfNeeded();
    const box = await token.boundingBox();
    if (!box) throw new Error(`variable token {{${name}}} not found`);
    await this.page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await this.card.waitFor({ state: 'visible' });
  }

  async editTo(text: string): Promise<void> {
    await this.value.click();
    await this.editField.fill(text);
    await this.editField.press('Enter');
  }
}
