import { DOCUMENT } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { RouterOutlet } from '@angular/router';
import { ExampleComponent } from './components/example/example.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, MatSlideToggleModule, ExampleComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly title = signal('angular-mat-tailwind-starter');
  private readonly document = inject(DOCUMENT);

  protected scrollToExample(): void {
    const target = this.document.getElementById('example');
    const viewport = this.document.defaultView;

    if (!target || !viewport) {
      return;
    }

    const top = target.getBoundingClientRect().top + viewport.scrollY - 12;
    viewport.scrollTo({ top: Math.max(top, 0), behavior: 'smooth' });
  }
}
