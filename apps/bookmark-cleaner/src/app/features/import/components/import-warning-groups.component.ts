import { CommonModule } from '@angular/common';
import { Component, input } from '@angular/core';

export interface ImportWarningGroupView {
  key: string;
  label: string;
  count: number;
  messages: string[];
}

@Component({
  selector: 'app-import-warning-groups',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './import-warning-groups.component.html',
})
export class ImportWarningGroupsComponent {
  readonly groups = input.required<ImportWarningGroupView[]>();
}
