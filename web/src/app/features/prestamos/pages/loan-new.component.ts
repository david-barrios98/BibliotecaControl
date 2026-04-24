import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, finalize, forkJoin, from, of, switchMap } from 'rxjs';
import { concatMap, toArray } from 'rxjs/operators';
import { PersonApiService } from '../../personas/services/person-api.service';
import type { PersonResponseDto } from '../../personas/models/person.dto';
import { BookApiService } from '../../libros/services/book-api.service';
import type { BookDetailResponseDto } from '../../libros/models/book.dto';
import { LoanApiService } from '../services/loan-api.service';
import { parseHttpError } from '@core/http/api-response-helpers';
import { dateInputToIsoUtcNoon, formatIsoDateDisplay } from '@core/utils/date-input';
import { LoadingBlockComponent } from '@shared/ui/loading-block.component';
import { AlertService } from '@core/notifications/alert.service';
import { BackLinkComponent } from '@shared/ui/back-link.component';
import { ComboboxSingleComponent, type ComboboxItem } from '@shared/ui/combobox-single.component';
import { CoverThumbComponent } from '@shared/ui/cover-thumb.component';

function localDateInputValue(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function dueDateAfterLoanValidator(group: AbstractControl): ValidationErrors | null {
  const loan = (group.get('loanDate')?.value as string | null | undefined)?.trim();
  const due = (group.get('dueDate')?.value as string | null | undefined)?.trim();
  if (!loan || !due) return null;
  if (loan > due) return { dueBeforeLoan: true };
  return null;
}

@Component({
  selector: 'app-loan-new',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    LoadingBlockComponent,
    BackLinkComponent,
    ComboboxSingleComponent,
    CoverThumbComponent,
  ],
  templateUrl: './loan-new.component.html',
  styleUrl: './loan-new.component.scss',
})
export class LoanNewComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly personApi = inject(PersonApiService);
  private readonly bookApi = inject(BookApiService);
  private readonly loanApi = inject(LoanApiService);
  private readonly router = inject(Router);
  private readonly alerts = inject(AlertService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly catalogLoading = signal(false);
  protected readonly saving = signal(false);
  protected readonly catalogError = signal(false);
  protected readonly bookLoading = signal(false);

  protected readonly persons = signal<PersonResponseDto[]>([]);
  protected readonly books = signal<{ id: number; title: string }[]>([]);
  protected readonly selected = signal<BookDetailResponseDto[]>([]);
  protected readonly personCard = signal<PersonResponseDto | null>(null);

  readonly form = this.fb.group(
    {
      personId: [null as number | null, Validators.required],
      loanDate: ['', Validators.required],
      dueDate: ['', Validators.required],
    },
    { validators: [dueDateAfterLoanValidator] },
  );

  /** Control auxiliar: libro a agregar al “carrito” del préstamo. */
  protected readonly bookPick = this.fb.control<number | null>(null, Validators.required);

  ngOnInit(): void {
    this.setDefaultDates();
    this.loadCatalog();

    this.form.controls.personId.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((id) => {
        if (id == null || id < 1) {
          this.personCard.set(null);
          return;
        }
        const p = this.persons().find((x) => x.id === id) ?? null;
        this.personCard.set(p);
      });
  }

  private setDefaultDates(): void {
    const today = new Date();
    const due = new Date(today);
    due.setDate(due.getDate() + 14);
    this.form.patchValue({
      loanDate: localDateInputValue(today),
      dueDate: localDateInputValue(due),
    });
  }

  protected loadCatalog(): void {
    this.catalogLoading.set(true);
    this.catalogError.set(false);
    forkJoin({
      persons: this.personApi.listAllForLookup(),
      books: this.bookApi.listAllForLookup(),
    }).subscribe({
      next: ({ persons, books }) => {
        this.persons.set(persons);
        this.books.set(books.map((b) => ({ id: b.id, title: b.title })));
        this.catalogLoading.set(false);
      },
      error: (err: unknown) => {
        this.persons.set([]);
        this.books.set([]);
        this.catalogLoading.set(false);
        this.catalogError.set(true);
        void this.alerts.error(parseHttpError(err), 'No se pudo cargar el catálogo');
      },
    });
  }

  protected personFilter(item: ComboboxItem, q: string): boolean {
    const p = item as PersonResponseDto;
    const needle = q.trim().toLowerCase();
    const blob = [p.firstName, p.lastName, p.email, p.phone, p.nationalId]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    return blob.includes(needle);
  }

  protected bookFilter(item: ComboboxItem, q: string): boolean {
    const b = item as { id: number; title: string };
    return b.title.toLowerCase().includes(q.trim().toLowerCase());
  }

  protected readonly labelPersonCombo = (item: ComboboxItem): string =>
    this.personLabel(item as PersonResponseDto);

  protected readonly labelBookCombo = (item: ComboboxItem): string =>
    (item as { id: number; title: string }).title;

  protected personLabel(p: PersonResponseDto): string {
    const fn = (p.firstName ?? '').trim();
    const ln = (p.lastName ?? '').trim();
    const name = [fn, ln].filter(Boolean).join(' ');
    const extra = (p.email ?? '').trim();
    if (name && extra) return `${name} · ${extra}`;
    return name || extra || `Persona #${p.id}`;
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      void this.alerts.info('Completá persona y fechas válidas.', 'Revisá el formulario');
      return;
    }
    const v = this.form.getRawValue();
    const personId = v.personId;
    const loanDate = v.loanDate?.trim();
    const dueDate = v.dueDate?.trim();
    const books = this.selected();
    if (personId == null || !loanDate || !dueDate) return;
    if (books.length === 0) {
      void this.alerts.info('Agregá al menos un libro antes de registrar.', 'Faltan libros');
      return;
    }
    if (this.form.errors?.['dueBeforeLoan']) {
      void this.alerts.info('La fecha de devolución esperada debe ser posterior o igual al inicio del préstamo.', 'Fechas inválidas');
      return;
    }

    this.saving.set(true);
    const payloadBase = {
      personId,
      loanDate: dateInputToIsoUtcNoon(loanDate),
      dueDate: dateInputToIsoUtcNoon(dueDate),
    };

    from(books)
      .pipe(
        concatMap((b) =>
          this.loanApi.create({
            ...payloadBase,
            bookId: b.id,
          }),
        ),
        toArray(),
        finalize(() => this.saving.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: async (created) => {
          await this.alerts.success(`Se registraron ${created.length} préstamo(s).`);
          void this.router.navigate(['/prestamos']);
        },
        error: async (err: unknown) => {
          await this.alerts.error(parseHttpError(err), 'No se pudieron registrar todos los préstamos');
        },
      });
  }

  protected addSelectedBook(): void {
    const bookId = this.bookPick.value;
    if (bookId == null || bookId < 1) return;
    if (this.selected().some((s) => s.id === bookId)) {
      void this.alerts.info('Ese libro ya está agregado. Solo se permite 1 por libro.', 'Duplicado');
      this.bookPick.setValue(null);
      return;
    }

    this.bookLoading.set(true);
    this.bookApi
      .getById(bookId)
      .pipe(
        finalize(() => this.bookLoading.set(false)),
        catchError((err: unknown) => {
          void this.alerts.error(parseHttpError(err), 'No se pudo cargar el libro');
          return of(null);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((b) => {
        if (!b) return;
        const copies = [...(b.copies ?? [])].sort((a, c) => a.copyNumber - c.copyNumber);
        this.selected.update((arr) => [...arr, { ...b, copies }]);
        this.bookPick.setValue(null);
        this.bookPick.markAsPristine();
        this.bookPick.markAsUntouched();
      });
  }

  protected removeSelectedBook(bookId: number): void {
    this.selected.update((arr) => arr.filter((b) => b.id !== bookId));
  }

  protected firstCopyLabel(b: BookDetailResponseDto): string {
    const c = (b.copies ?? [])[0];
    if (!c) return '—';
    const code = (c.copyCode ?? '').trim();
    if (code) return code;
    return c.copyNumber ? `#${c.copyNumber}` : '—';
  }

  protected readonly formatDate = formatIsoDateDisplay;
}
