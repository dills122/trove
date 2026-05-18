import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BookmarkWorkerService } from '../../core/services/bookmark-worker.service';
import { WorkspaceStore } from '../../core/store/workspace.store';

@Component({
  selector: 'app-import-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <section class="p-6 max-w-4xl mx-auto space-y-4">
      <h1 class="text-3xl font-bold">Import Bookmarks</h1>
      <p class="text-sm text-slate-300">
        Your source bookmark file is never modified. Trove parses into a working snapshot only.
      </p>

      <input type="file" accept=".html,text/html" (change)="onFileSelected($event)" />

      <div *ngIf="store.isProcessing()" class="text-sm text-cyan-300">Parsing bookmarks...</div>
      <div *ngIf="error()" class="text-sm text-red-300">{{ error() }}</div>

      <div *ngIf="store.snapshot() as snapshot" class="rounded border border-slate-700 p-4 space-y-2">
        <h2 class="text-xl font-semibold">Import Summary</h2>
        <ul class="text-sm space-y-1">
          <li>Total bookmarks: {{ snapshot.analysis.totalBookmarks }}</li>
          <li>Total folders: {{ snapshot.analysis.totalFolders }}</li>
          <li>Unique URLs: {{ snapshot.analysis.uniqueUrls }}</li>
          <li>Warnings: {{ snapshot.analysis.warningCount }}</li>
        </ul>

        <div *ngIf="snapshot.warnings.length" class="pt-2">
          <h3 class="font-semibold">Warnings</h3>
          <ul class="text-xs space-y-1 list-disc pl-5">
            <li *ngFor="let warning of snapshot.warnings.slice(0, 10)">{{ warning.message }}</li>
          </ul>
        </div>

        <a routerLink="/dashboard" class="inline-block mt-2 text-cyan-300 underline">Continue to dashboard</a>
      </div>
    </section>
  `,
})
export class ImportPageComponent {
  readonly store = inject(WorkspaceStore);
  private readonly worker = inject(BookmarkWorkerService);
  readonly error = signal<string | null>(null);

  async onFileSelected(event: Event): Promise<void> {
    this.error.set(null);
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      return;
    }

    try {
      this.store.setProcessing(true);
      const html = await file.text();
      const snapshot = await this.worker.parse(html);
      await this.store.save(snapshot);
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'Unable to parse bookmark file');
    } finally {
      this.store.setProcessing(false);
    }
  }
}
