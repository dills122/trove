import type { Routes } from '@angular/router';
import { DashboardPageComponent } from './features/dashboard/dashboard-page.component';
import { ImportPageComponent } from './features/import/import-page.component';
import { OrganizePageComponent } from './features/organize/organize-page.component';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'import' },
  { path: 'import', component: ImportPageComponent },
  { path: 'dashboard', component: DashboardPageComponent },
  { path: 'organize', component: OrganizePageComponent },
];
