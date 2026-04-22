import { Component, input } from '@angular/core';

@Component({
  selector: 'app-loading-block',
  standalone: true,
  template: `
    <div
      class="lb"
      [class.lb--compact]="compact()"
      role="status"
      aria-live="polite"
      [attr.aria-busy]="true"
      [attr.aria-label]="label()"
    >
      <span class="lb__spinner" aria-hidden="true"></span>
      <span class="lb__label">{{ label() }}</span>
    </div>
  `,
  styleUrl: './loading-block.component.scss',
})
export class LoadingBlockComponent {
  /** Texto visible y para lectores de pantalla. */
  readonly label = input('Cargando…');
  /** Variante más baja para cabeceras o bloques pequeños. */
  readonly compact = input(false);
}
