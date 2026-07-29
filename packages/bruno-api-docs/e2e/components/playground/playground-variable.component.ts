import type { Locator, Page } from '@playwright/test';
import { VariableCardComponent } from '../variable-card/variable-card.component';

export class PlaygroundVariableComponent extends VariableCardComponent {
  readonly editField = this.card.getByTestId('variable-info-card-edit');
  // Monaco paints its own tokens, so we can't put a test id on them. Match the class instead.
  readonly monacoValid = this.page.locator('.monaco-editor .variable-valid');
  readonly monacoInvalid = this.page.locator('.monaco-editor .variable-invalid');

  constructor(page: Page) {
    super(page, page.getByTestId('playground-view'));
  }

  monacoToken(name: string): Locator {
    return this.page
      .locator('.monaco-editor .variable-valid, .monaco-editor .variable-invalid')
      .filter({ hasText: `{{${name}}}` })
      .first();
  }

  async hoverInputToken(name: string): Promise<void> {
    await this.movePointerToToken(this.token(name), name);
  }

  async hoverMonacoToken(name: string): Promise<void> {
    await this.movePointerToToken(this.monacoToken(name), name);
  }

  async overlapsMonacoToken(name: string): Promise<boolean> {
    const card = await this.card.boundingBox();
    const token = await this.monacoToken(name).boundingBox();
    if (!card || !token) throw new Error(`card and token {{${name}}} must both be laid out`);
    return card.y < token.y + token.height && card.y + card.height > token.y;
  }

  async editTo(text: string): Promise<void> {
    await this.startEditing(text);
    await this.editField.press('Enter');
  }

  async startEditing(text: string): Promise<void> {
    await this.value.click();
    await this.editField.fill(text);
  }

  private async movePointerToToken(token: Locator, name: string): Promise<void> {
    await token.scrollIntoViewIfNeeded();
    const box = await token.boundingBox();
    if (!box) throw new Error(`variable token {{${name}}} not found`);
    await this.page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await this.card.waitFor({ state: 'visible' });
  }
}
