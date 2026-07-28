import type { Locator } from '@playwright/test';
import { BaseComponent } from '../base.component';

// The playground variable hover card. Tokens live in HighlightedInput mirrors (URL / value cells)
// and Monaco decorations (body); the mirror is behind a transparent input, so hover via mouse-move.
export class PlaygroundVariableComponent extends BaseComponent {
  readonly card = this.page.getByTestId('variable-info-card');
  readonly name = this.card.getByTestId('variable-info-card-name');
  readonly scopeBadge = this.card.getByTestId('variable-info-card-scope');
  readonly value = this.card.getByTestId('variable-info-card-value');
  readonly editField = this.card.getByTestId('variable-info-card-edit');
  readonly note = this.card.getByTestId('variable-info-card-note');

  readonly monacoValid = this.page.locator('.monaco-editor .variable-valid');
  readonly monacoInvalid = this.page.locator('.monaco-editor .variable-invalid');

  inputToken(name: string): Locator {
    return this.page
      .locator('.highlight-input-mirror .variable-valid, .highlight-input-mirror .variable-invalid')
      .filter({ hasText: `{{${name}}}` })
      .first();
  }

  async hoverInputToken(name: string): Promise<void> {
    const token = this.inputToken(name);
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
