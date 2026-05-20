import { CommonModule } from '@angular/common';
import { Component, input, output } from '@angular/core';
import type { BrowserOption } from '../../../core/store/ui-preferences.store';
import type { ShortcutDisplay } from '../../../core/utils/platform-shortcuts';

@Component({
  selector: 'app-import-export-guide',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './import-export-guide.component.html',
})
export class ImportExportGuideComponent {
  readonly browser = input.required<BrowserOption>();
  readonly shortcut = input.required<ShortcutDisplay>();
  readonly browserChanged = output<BrowserOption>();

  setBrowser(browser: BrowserOption): void {
    this.browserChanged.emit(browser);
  }
}
