import type { Locator } from '@playwright/test';
import { BaseComponent } from '../base.component';

export class VariableCardComponent extends BaseComponent {
  readonly card = this.page.getByTestId('variable-info-card');
  readonly name = this.card.getByTestId('variable-info-card-name');
  readonly scopeBadge = this.card.getByTestId('variable-info-card-scope');
  readonly value = this.card.getByTestId('variable-info-card-value');
  readonly copyButton = this.card.getByTestId('variable-info-card-copy');
  // Both facts of the copied state in one locator, so a test asserts it once
  // rather than racing several assertions against the one-second reset: the
  // button carries data-copied, and its glyph is the checkmark (a polyline).
  readonly copiedTick = this.card.locator('[data-testid="variable-info-card-copy"][data-copied] polyline');
  readonly revealToggle = this.card.getByTestId('variable-info-card-reveal');
  readonly note = this.card.getByTestId('variable-info-card-note');
  readonly warning = this.card.getByTestId('variable-info-card-warning');
  // Read-only guard: the card must contain no editable control. Native inputs and third-party
  // CodeMirror carry no test ids, so this absence check matches them structurally.
  readonly editors = this.card.locator('textarea, input, .CodeMirror');

  token(name: string): Locator {
    return this.root.getByTestId(`variable-token-${name}`).first();
  }

  async hoverToken(name: string): Promise<void> {
    await this.token(name).hover();
  }

  async pinToken(name: string): Promise<void> {
    await this.token(name).click();
  }
}
