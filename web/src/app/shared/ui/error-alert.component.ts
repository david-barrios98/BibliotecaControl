import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-error-alert',
  standalone: true,
  template: `
    @if (message()) {
      <div class="bc-alert bc-alert--error" role="alert">
        <div class="bc-alert__body">
          @if (heading(); as h) {
            <strong class="bc-alert__heading">{{ h }}</strong>
          }
          <p class="bc-alert__text">{{ message() }}</p>
        </div>
        @if (showRetry()) {
          <button type="button" class="bc-alert__retry" (click)="retry.emit()">Reintentar</button>
        }
      </div>
    }
  `,
  styleUrl: './error-alert.component.scss',
})
export class ErrorAlertComponent {
  readonly message = input<string | null>(null);
  /** Si se omite o es null, solo se muestra el texto del mensaje. */
  readonly heading = input<string | null>(null);
  readonly showRetry = input(false);
  readonly retry = output<void>();
}
