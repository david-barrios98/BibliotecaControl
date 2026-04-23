import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { BackLinkComponent } from '@shared/ui/back-link.component';
import { LoadingBlockComponent } from '@shared/ui/loading-block.component';
import { AlertService } from '@core/notifications/alert.service';
import { parseHttpError } from '@core/http/api-response-helpers';
import { dateInputToIsoUtcNoon, isoToDateInputValue } from '@core/utils/date-input';
import { BookApiService, type BookUpsertPayload } from '../services/book-api.service';
import { AuthorApiService } from '@features/autores/services/author-api.service';
import type { AuthorResponseDto } from '@features/autores/models/author.dto';
import { GenderApiService, type GenderLookupDto } from '../services/gender-api.service';

type LocalCopy = { id: string; code: string; status: 'Available' | 'Loaned' | 'Disabled' };

@Component({
  selector: 'app-book-form',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, BackLinkComponent, LoadingBlockComponent],
  templateUrl: './book-form.component.html',
  styleUrl: './book-form.component.scss',
})
export class BookFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(BookApiService);
  private readonly authorApi = inject(AuthorApiService);
  private readonly genderApi = inject(GenderApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly alerts = inject(AlertService);

  protected readonly isEdit = signal(false);
  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  protected readonly loadFailed = signal(false);

  protected readonly coverFile = signal<File | null>(null);
  protected readonly coverPreviewUrl = signal<string | null>(null);

  protected readonly copies = signal<LocalCopy[]>([]);
  protected readonly newCopyCode = signal('');

  protected readonly bookId = signal<number | null>(null);
  protected readonly title = computed(() => (this.isEdit() ? 'Editar libro' : 'Nuevo libro'));

  protected readonly authors = signal<AuthorResponseDto[]>([]);
  protected readonly genders = signal<GenderLookupDto[]>([]);
  protected readonly loadingAuthors = signal(false);
  protected readonly loadingGenders = signal(false);

  readonly form = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.minLength(1), Validators.maxLength(200)]],
    authorId: [0, [Validators.required, Validators.min(1)]],
    gender: ['', [Validators.required, Validators.minLength(1), Validators.maxLength(80)]],
    numberOfPages: [1, [Validators.required, Validators.min(1), Validators.max(20000)]],
    publishedDate: ['', Validators.required], // date input value
  });

  ngOnInit(): void {
    this.loadLookups();
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      const id = +idParam;
      if (!Number.isNaN(id) && id > 0) {
        this.isEdit.set(true);
        this.bookId.set(id);
        this.loadBook(id);
      } else {
        this.loadFailed.set(true);
        void this.alerts.error('Identificador no válido.', 'Error');
      }
    }
  }

  private loadLookups(): void {
    this.loadingAuthors.set(true);
    this.authorApi.listAllForLookup().subscribe({
      next: (items) => {
        const sorted = [...items].sort((a, b) =>
          this.authorDisplayName(a).localeCompare(this.authorDisplayName(b), 'es', { sensitivity: 'base' }),
        );
        this.authors.set(sorted);
      },
      error: () => this.authors.set([]),
      complete: () => this.loadingAuthors.set(false),
    });

    this.loadingGenders.set(true);
    this.genderApi.list().subscribe({
      next: (items) => {
        const sorted = [...items].sort((a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }));
        this.genders.set(sorted);
      },
      error: () => this.genders.set([]),
      complete: () => this.loadingGenders.set(false),
    });
  }

  protected authorDisplayName(a: AuthorResponseDto): string {
    return [a.name, a.lastName].filter(Boolean).join(' ').trim() || `(id ${a.id})`;
  }

  protected genderOptionValue(g: GenderLookupDto): string {
    return g.name;
  }

  private loadBook(id: number): void {
    this.loading.set(true);
    this.loadFailed.set(false);
    this.api.getById(id).subscribe({
      next: (b) => {
        this.form.patchValue({
          title: b.title ?? '',
          authorId: b.authorId ?? 0,
          gender: b.gender ?? '',
          numberOfPages: b.numberOfPages ?? 1,
          publishedDate: isoToDateInputValue(b.publishedDate),
        });
        this.coverPreviewUrl.set(b.coverUrl ?? null);
        this.loading.set(false);
      },
      error: (err: unknown) => {
        this.loading.set(false);
        this.loadFailed.set(true);
        void this.alerts.error(parseHttpError(err), 'No se pudo cargar el libro');
      },
    });
  }

  protected onCoverSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0] ?? null;
    this.coverFile.set(file);
    const prev = this.coverPreviewUrl();
    if (prev && prev.startsWith('blob:')) URL.revokeObjectURL(prev);
    this.coverPreviewUrl.set(file ? URL.createObjectURL(file) : prev);
  }

  protected clearCover(): void {
    this.coverFile.set(null);
    const prev = this.coverPreviewUrl();
    if (prev && prev.startsWith('blob:')) URL.revokeObjectURL(prev);
    this.coverPreviewUrl.set(null);
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      void this.alerts.info('Completa los campos obligatorios antes de guardar.', 'Revisa el formulario');
      return;
    }

    const v = this.form.getRawValue();
    const payload: BookUpsertPayload = {
      title: v.title.trim(),
      authorId: v.authorId,
      gender: v.gender.trim(),
      numberOfPages: v.numberOfPages,
      publishedDate: dateInputToIsoUtcNoon(v.publishedDate),
      coverImage: this.coverFile(),
    };

    this.saving.set(true);
    if (this.isEdit() && this.bookId() != null) {
      this.api.update(this.bookId()!, payload).subscribe({
        next: () => this.alerts.toastSuccess('Libro actualizado'),
        error: (err: unknown) => {
          this.saving.set(false);
          void this.alerts.error(parseHttpError(err), 'No se pudo guardar');
        },
        complete: () => this.saving.set(false),
      });
    } else {
      this.api.create(payload).subscribe({
        next: (created) => {
          this.alerts.toastSuccess('Libro creado');
          void this.router.navigate(['/libros', created.id, 'editar']);
        },
        error: (err: unknown) => {
          this.saving.set(false);
          void this.alerts.error(parseHttpError(err), 'No se pudo guardar');
        },
        complete: () => this.saving.set(false),
      });
    }
  }

  protected addCopy(): void {
    const code = this.newCopyCode().trim();
    if (!code) return;
    if (this.copies().some((c) => c.code.toLowerCase() === code.toLowerCase())) {
      void this.alerts.info('Ya existe un ejemplar con ese código.', 'Duplicado');
      return;
    }
    this.copies.update((arr) => [...arr, { id: crypto.randomUUID(), code, status: 'Available' }]);
    this.newCopyCode.set('');
  }

  protected onNewCopyInput(event: Event): void {
    this.newCopyCode.set((event.target as HTMLInputElement).value);
  }

  protected removeCopy(id: string): void {
    this.copies.update((arr) => arr.filter((c) => c.id !== id));
  }

  protected canManageCopies(): boolean {
    return this.isEdit() && this.bookId() != null;
  }
}

