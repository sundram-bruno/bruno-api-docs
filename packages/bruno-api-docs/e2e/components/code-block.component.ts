import type { Locator, Page } from '@playwright/test';
import { BaseComponent } from './base.component';

export class CodeBlockComponent extends BaseComponent {
  readonly copyButton: Locator;

  constructor(page: Page, container: Locator, base = 'code') {
    super(page, container.getByTestId(base));
    this.copyButton = this.root.getByTestId(`${base}-copy`);
  }
}
