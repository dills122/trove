import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { WorkspaceStore } from '../../core/store/workspace.store';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <section class="p-6 max-w-4xl mx-auto space-y-4">
      <h1 class="text-3xl font-bold">Dashboard</h1>

      <div *ngIf="!store.snapshot()" class="text-sm text-slate-300">
        No workspace loaded yet.
        <a routerLink="/import" class="text-cyan-300 underline">Import bookmarks</a>
      </div>

      <div *ngIf="store.snapshot() as snapshot" class="grid grid-cols-1 md:grid-cols-2 gap-3">
        <article class="rounded border border-slate-700 p-4">
          <h2 class="font-semibold">Bookmark Stats</h2>
          <ul class="text-sm mt-2 space-y-1">
            <li>Total bookmarks: {{ snapshot.analysis.totalBookmarks }}</li>
            <li>Total folders: {{ snapshot.analysis.totalFolders }}</li>
            <li>Unique URLs: {{ snapshot.analysis.uniqueUrls }}</li>
          </ul>
        </article>

        <article class="rounded border border-slate-700 p-4">
          <h2 class="font-semibold">Data Quality</h2>
          <ul class="text-sm mt-2 space-y-1">
            <li>Warnings: {{ snapshot.analysis.warningCount }}</li>
            <li>Malformed entries: {{ snapshot.analysis.malformedEntries }}</li>
          </ul>
        </article>
      </div>
    </section>
  `,
})
export class DashboardPageComponent {
  readonly store = inject(WorkspaceStore);
}
