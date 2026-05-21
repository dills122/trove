import { CommonModule } from '@angular/common';
import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-pwa-status-banners',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pwa-status-banners.component.html',
})
export class PwaStatusBannersComponent {
  readonly isOnline = input(true);
  readonly updateAvailable = input(false);
  readonly unrecoverableReason = input<string | null>(null);
  readonly manualInstallHint = input<string | null>(null);
  readonly updateStatusMessage = input<string | null>(null);

  readonly dismissUpdate = output<void>();
  readonly reloadForUpdate = output<void>();
  readonly dismissUpdateStatus = output<void>();
}
