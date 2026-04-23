import { Component, effect, input, signal } from '@angular/core';
import type { AbstractControl } from '@angular/forms';
import { merge } from 'rxjs';
import type { FieldValidationOverrides } from './validation-messages';
import { firstValidationMessage } from './validation-messages';

/** Muestra el primer error de validación cuando el control está `touched`. */
@Component({
  selector: 'app-control-validation-message',
  standalone: true,
  template: `
    @if (message(); as m) {
      <span [class]="cssClass()" role="alert">{{ m }}</span>
    }
  `,
  styleUrl: './control-validation-message.component.scss',
})
export class ControlValidationMessageComponent {
  readonly control = input.required<AbstractControl>();
  readonly overrides = input<FieldValidationOverrides>({});
  readonly cssClass = input('af__hint af__hint--error');

  protected readonly message = signal<string | null>(null);

  constructor() {
    effect((onCleanup) => {
      const c = this.control();
      const overrides = this.overrides();

      const refresh = () => {
        const msg =
          !c.touched || !c.errors ? null : firstValidationMessage(c.errors, overrides);
        this.message.set(msg);
      };

      refresh();
      const sub = merge(c.statusChanges, c.valueChanges).subscribe(() => refresh());
      onCleanup(() => sub.unsubscribe());
    });
  }
}
