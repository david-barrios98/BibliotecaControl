import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-back-link',
  standalone: true,
  imports: [RouterLink],
  template: `
    <a [routerLink]="link()" class="back-link" [attr.aria-label]="ariaLabel() ?? 'Volver — ' + label()">
      <svg class="back-link__icon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
      </svg>
      <span class="back-link__text">{{ label() }}</span>
    </a>
  `,
  styleUrl: './back-link.component.scss',
})
export class BackLinkComponent {
  readonly link = input.required<string[]>();
  readonly label = input('Volver');
  /** Por defecto combina el texto visible con “volver” para accesibilidad. */
  readonly ariaLabel = input<string | undefined>(undefined);
}
