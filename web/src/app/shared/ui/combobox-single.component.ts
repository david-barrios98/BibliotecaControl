import {
  Component,
  Input,
  forwardRef,
  signal,
  computed,
  inject,
  ElementRef,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

/** Opción mínima: identificador numérico. */
export type ComboboxItem = { id: number };

@Component({
  selector: 'app-combobox-single',
  standalone: true,
  templateUrl: './combobox-single.component.html',
  styleUrl: './combobox-single.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ComboboxSingleComponent),
      multi: true,
    },
  ],
})
export class ComboboxSingleComponent implements ControlValueAccessor, OnChanges {
  private readonly host = inject(ElementRef<HTMLElement>);

  /** Catálogo mostrado y filtrado. */
  @Input({ required: true }) items: ComboboxItem[] = [];

  /** Texto mostrado por ítem. */
  @Input({ required: true }) labelFn!: (item: ComboboxItem) => string;

  /** Filtro opcional (p. ej. buscar en varios campos). Si no se define, se filtra por `labelFn`. */
  @Input() filterFn?: (item: ComboboxItem, query: string) => boolean;

  @Input() placeholder = '';
  @Input() label = '';
  @Input() requiredMark = false;
  /** `id` estable para accesibilidad (label + listbox). */
  @Input() controlId = `combo-${Math.random().toString(36).slice(2, 9)}`;

  protected readonly filterText = signal('');
  protected readonly open = signal(false);
  protected readonly highlighted = signal(0);
  protected readonly valueId = signal<number | null>(null);

  protected readonly disabled = signal(false);

  private onChange: (v: number | null) => void = () => {};
  private onTouched: () => void = () => {};

  protected readonly filtered = computed(() => {
    const q = this.filterText().trim().toLowerCase();
    const list = this.items ?? [];
    if (!q) return list;
    if (this.filterFn) {
      return list.filter((i) => this.filterFn!(i, q));
    }
    return list.filter((i) => this.labelFn(i).toLowerCase().includes(q));
  });

  protected readonly listboxId = computed(() => `${this.controlId}-listbox`);

  /** `aria-activedescendant` acotado al índice válido en la lista filtrada. */
  protected readonly activeDescendantId = computed(() => {
    if (!this.open()) return null;
    const rows = this.filtered();
    if (rows.length === 0) return null;
    const hi = Math.min(Math.max(this.highlighted(), 0), rows.length - 1);
    return `${this.controlId}-opt-${hi}`;
  });

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['items']) {
      this.syncTextFromValue();
    }
  }

  writeValue(v: number | null): void {
    this.valueId.set(v);
    this.syncTextFromValue();
  }

  registerOnChange(fn: (v: number | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }

  private syncTextFromValue(): void {
    const id = this.valueId();
    if (id == null) {
      this.filterText.set('');
      return;
    }
    const item = this.items?.find((i) => i.id === id);
    this.filterText.set(item ? this.labelFn(item) : '');
  }

  protected onInput(ev: Event): void {
    const text = (ev.target as HTMLInputElement).value;
    this.filterText.set(text);
    this.open.set(true);
    this.highlighted.set(0);

    const current = this.valueId();
    if (current != null) {
      const prev = this.items?.find((i) => i.id === current);
      const prevLabel = prev ? this.labelFn(prev) : '';
      if (prevLabel !== text) {
        this.valueId.set(null);
        this.onChange(null);
      }
    }

    const rows = this.filtered();
    if (rows.length === 1 && text.trim() !== '') {
      const only = rows[0];
      const lbl = this.labelFn(only);
      if (lbl.toLowerCase() === text.trim().toLowerCase()) {
        this.pick(only);
      }
    }
  }

  protected onFocus(): void {
    if (this.disabled()) return;
    this.open.set(true);
    this.highlighted.set(0);
    this.onTouched();
  }

  protected onBlur(): void {
    setTimeout(() => {
      if (!this.host.nativeElement.contains(document.activeElement)) {
        this.closeAndNormalize();
      }
    }, 0);
  }

  private closeAndNormalize(): void {
    this.open.set(false);
    const id = this.valueId();
    if (id != null) {
      const item = this.items?.find((i) => i.id === id);
      if (item) this.filterText.set(this.labelFn(item));
      return;
    }
    const q = this.filterText().trim().toLowerCase();
    const rows = this.filtered();
    if (rows.length === 1) {
      this.pick(rows[0]);
      return;
    }
    const exact = this.items?.find((i) => this.labelFn(i).trim().toLowerCase() === q);
    if (exact) {
      this.pick(exact);
      return;
    }
  }

  protected toggleOpen(ev: Event): void {
    ev.preventDefault();
    ev.stopPropagation();
    if (this.disabled()) return;
    this.open.update((o) => !o);
    if (this.open()) this.highlighted.set(0);
  }

  protected pick(item: ComboboxItem, ev?: Event): void {
    ev?.preventDefault();
    ev?.stopPropagation();
    this.valueId.set(item.id);
    this.filterText.set(this.labelFn(item));
    this.open.set(false);
    this.onChange(item.id);
    this.onTouched();
  }

  protected onKeydown(ev: KeyboardEvent): void {
    if (this.disabled()) return;
    const rows = this.filtered();
    let hi = this.highlighted();

    switch (ev.key) {
      case 'ArrowDown':
        ev.preventDefault();
        if (!this.open()) this.open.set(true);
        hi = Math.min(hi + 1, Math.max(0, rows.length - 1));
        this.highlighted.set(hi);
        break;
      case 'ArrowUp':
        ev.preventDefault();
        if (!this.open()) this.open.set(true);
        hi = Math.max(hi - 1, 0);
        this.highlighted.set(hi);
        break;
      case 'Enter':
        ev.preventDefault();
        if (this.open() && rows.length > 0 && hi >= 0 && hi < rows.length) {
          this.pick(rows[hi]);
        }
        break;
      case 'Escape':
        ev.preventDefault();
        this.open.set(false);
        this.syncTextFromValue();
        break;
      case 'Tab':
        this.open.set(false);
        break;
      default:
        break;
    }
  }

  protected optionId(index: number): string {
    return `${this.controlId}-opt-${index}`;
  }
}
