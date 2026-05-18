import type { Routes } from '@angular/router';
import { DashboardPageComponent } from './features/dashboard/dashboard-page.component';
import { ImportPageComponent } from './features/import/import-page.component';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'import' },
  { path: 'import', component: ImportPageComponent },
  { path: 'dashboard', component: DashboardPageComponent },
];
