import type { Page } from '@playwright/test';
import { BaseComponent } from '../base.component';

export class OpenInBrunoModalComponent extends BaseComponent {
  constructor(page: Page) {
    super(page, page.getByRole('dialog', { name: 'Open in Bruno' }));
  }

  readonly title = this.root.getByTestId('open-in-bruno-modal-title');
  readonly downloadCollection = this.root.getByTestId('open-in-bruno-modal-download');
  readonly steps = this.root.getByTestId('open-in-bruno-modal-steps').getByRole('listitem');
  readonly downloadBruno = this.root.getByTestId('open-in-bruno-modal-download-bruno');
  readonly closeButton = this.root.getByRole('button', { name: 'Close' });
}
