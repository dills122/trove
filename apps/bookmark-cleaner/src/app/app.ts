import { Component, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { WorkspaceStore } from './core/store/workspace.store';

interface WorkflowStep {
  id: number;
  label: string;
  path: string | null;
}

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private readonly workspaceStore = inject(WorkspaceStore);
  private readonly router = inject(Router);

  readonly steps: WorkflowStep[] = [
    { id: 1, label: 'Import', path: '/import' },
    { id: 2, label: 'Review', path: '/dashboard' },
    { id: 3, label: 'Organize', path: '/organize' },
    { id: 4, label: 'Export', path: null },
  ];

  readonly currentStep = signal(1);

  public constructor() {
    void this.workspaceStore.load();
    this.updateCurrentStep(this.router.url);

    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event) => this.updateCurrentStep(event.urlAfterRedirects));
  }

  isStepActive(stepId: number): boolean {
    return this.currentStep() === stepId;
  }

  isStepComplete(stepId: number): boolean {
    return this.currentStep() > stepId;
  }

  private updateCurrentStep(url: string): void {
    if (url.startsWith('/organize')) {
      this.currentStep.set(3);
      return;
    }

    if (url.startsWith('/dashboard')) {
      this.currentStep.set(2);
      return;
    }

    this.currentStep.set(1);
  }
}
