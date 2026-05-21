import { Component, output } from '@angular/core';

@Component({
  selector: 'app-import-intro-modal',
  standalone: true,
  templateUrl: './import-intro-modal.component.html',
})
export class ImportIntroModalComponent {
  readonly dismissed = output<void>();

  dismiss(): void {
    this.dismissed.emit();
  }
}
