import { CommonModule } from '@angular/common';
import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { BookmarkWorkspaceSnapshot } from '../../../core/models/bookmark.models';
import { ImportWarningGroupsComponent, type ImportWarningGroupView } from './import-warning-groups.component';

@Component({
  selector: 'app-import-summary',
  standalone: true,
  imports: [CommonModule, RouterLink, ImportWarningGroupsComponent],
  templateUrl: './import-summary.component.html',
})
export class ImportSummaryComponent {
  readonly snapshot = input.required<BookmarkWorkspaceSnapshot>();
  readonly warningGroups = input.required<ImportWarningGroupView[]>();
}
