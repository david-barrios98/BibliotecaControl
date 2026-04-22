import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="es" role="status">
      <div class="es__visual" aria-hidden="true">
        <svg class="es__svg" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M12 52h40V24L36 12H12v40z"
            stroke="currentColor"
            stroke-width="2"
            stroke-linejoin="round"
          />
          <path d="M36 12v12h12" stroke="currentColor" stroke-width="2" stroke-linejoin="round" />
          <path d="M22 34h20M22 42h14" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
        </svg>
      </div>
      <h2 class="es__title">{{ title() }}</h2>
      @if (hint(); as h) {
        <p class="es__hint">{{ h }}</p>
      }
      @if (actionLabel() && actionLink()?.length) {
        <div class="es__actions">
          <a [routerLink]="actionLink()!" class="es__btn">{{ actionLabel() }}</a>
        </div>
      }
    </div>
  `,
  styleUrl: './empty-state.component.scss',
})
export class EmptyStateComponent {
  readonly title = input.required<string>();
  readonly hint = input<string>();
  /** Texto del botón / enlace principal (opcional). */
  readonly actionLabel = input<string>();
  /** Ruta para `RouterLink` cuando hay acción (p. ej. `['/autores','nuevo']`). */
  readonly actionLink = input<string[]>();
}
