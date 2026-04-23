import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { BackLinkComponent } from '@shared/ui/back-link.component';
import { LoadingBlockComponent } from '@shared/ui/loading-block.component';
import { AlertService } from '@core/notifications/alert.service';
import { parseHttpError } from '@core/http/api-response-helpers';
import { dateInputToIsoUtcNoon, isoToDateInputValue } from '@core/utils/date-input';
import { BookApiService, type BookUpsertPayload } from '../services/book-api.service';
import type { BookCopyDto, UpdateBookCopyRequestDto } from '../models/book.dto';
import { AuthorApiService } from '@features/autores/services/author-api.service';
import type { AuthorResponseDto } from '@features/autores/models/author.dto';
import { GenderApiService, type GenderLookupDto } from '../services/gender-api.service';
import { CoverMediaService } from '@core/media/cover-media.service';

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
  private readonly coverMedia = inject(CoverMediaService);
  private readonly destroyRef = inject(DestroyRef);

  /** Evita aplicar una respuesta antigua si el usuario navega rápido. */
  private serverCoverLoadSeq = 0;
  private serverCoverBlobRevoke: string | null = null;

  protected readonly isEdit = signal(false);
  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  protected readonly addingCopy = signal(false);
  protected readonly updatingCopyId = signal<number | null>(null);
  protected readonly deletingCopyId = signal<number | null>(null);
  protected readonly loadFailed = signal(false);

  protected readonly coverFile = signal<File | null>(null);
  /** Portada actual en servidor (para restaurar si el usuario quita un archivo nuevo). */
  protected readonly serverCoverUrl = signal<string | null>(null);
  protected readonly coverPreviewUrl = signal<string | null>(null);

  protected readonly copies = signal<BookCopyDto[]>([]);
  /** Texto del input por `copy.id` (sincronizado al cargar / refrescar detalle). */
  protected readonly copyCodeDrafts = signal<Record<number, string>>({});
  protected readonly newCopyCode = signal('');

  protected readonly bookId = signal<number | null>(null);
  protected readonly title = computed(() => (this.isEdit() ? 'Editar libro' : 'Nuevo libro'));

  protected readonly authors = signal<AuthorResponseDto[]>([]);
  protected readonly genders = signal<GenderLookupDto[]>([]);
  protected readonly loadingAuthors = signal(false);
  protected readonly loadingGenders = signal(false);

  /** Solo géneros con `id` numérico (multipart `GenderId`). */
  protected readonly gendersWithId = computed(() =>
    this.genders().filter((g): g is GenderLookupDto & { id: number } => typeof g.id === 'number'),
  );

  readonly form = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.minLength(1), Validators.maxLength(200)]],
    authorId: [0, [Validators.required, Validators.min(1)]],
    genderId: [0, [Validators.required, Validators.min(1)]],
    numberOfPages: [1, [Validators.required, Validators.min(1), Validators.max(20000)]],
    publishedDate: ['', Validators.required],
  });

  ngOnInit(): void {
    this.destroyRef.onDestroy(() => this.revokeServerCoverBlob());
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

  private loadBook(id: number): void {
    this.loading.set(true);
    this.loadFailed.set(false);
    this.api.getById(id).subscribe({
      next: (b) => {
        this.form.patchValue({
          title: b.title ?? '',
          authorId: b.authorId ?? 0,
          genderId: b.genderId ?? 0,
          numberOfPages: b.numberOfPages ?? 1,
          publishedDate: isoToDateInputValue(b.publishedDate),
        });
        this.coverFile.set(null);
        this.applyServerCoverFromApi(b.coverUrl);
        this.applyCopies(b.copies);
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
    this.coverPreviewUrl.set(file ? URL.createObjectURL(file) : this.serverCoverUrl());
  }

  protected clearCover(): void {
    this.coverFile.set(null);
    const prev = this.coverPreviewUrl();
    if (prev && prev.startsWith('blob:')) URL.revokeObjectURL(prev);
    this.coverPreviewUrl.set(this.serverCoverUrl());
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
      genderId: v.genderId,
      numberOfPages: v.numberOfPages,
      publishedDate: dateInputToIsoUtcNoon(v.publishedDate),
      coverImage: this.coverFile(),
    };

    this.saving.set(true);
    if (this.isEdit() && this.bookId() != null) {
      this.api.update(this.bookId()!, payload).subscribe({
        next: () => {
          this.alerts.toastSuccess('Libro actualizado');
          void this.reloadDetail(this.bookId()!);
        },
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

  /** Tras guardar o agregar ejemplar: refresca detalle (incl. `copies` y portada). */
  private reloadDetail(id: number): void {
    this.api.getById(id).subscribe({
      next: (b) => {
        this.applyServerCoverFromApi(b.coverUrl);
        this.applyCopies(b.copies);
      },
      error: () => {
        /* ya hay toast en otros flujos */
      },
    });
  }

  private revokeServerCoverBlob(): void {
    if (this.serverCoverBlobRevoke) {
      URL.revokeObjectURL(this.serverCoverBlobRevoke);
      this.serverCoverBlobRevoke = null;
    }
  }

  private applyServerCoverFromApi(apiUrl: string | null | undefined): void {
    this.revokeServerCoverBlob();
    const seq = ++this.serverCoverLoadSeq;
    this.coverMedia
      .coverDisplayUrl(apiUrl ?? null)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
      next: (display) => {
        if (seq !== this.serverCoverLoadSeq) return;
        if (display?.startsWith('blob:')) {
          this.serverCoverBlobRevoke = display;
        }
        this.serverCoverUrl.set(display);
        if (!this.coverFile()) {
          this.coverPreviewUrl.set(display);
        }
      },
      error: () => {
        if (seq !== this.serverCoverLoadSeq) return;
        this.serverCoverUrl.set(null);
        if (!this.coverFile()) {
          this.coverPreviewUrl.set(null);
        }
      },
    });
  }

  private applyCopies(items: BookCopyDto[] | null | undefined): void {
    const sorted = [...(items ?? [])].sort((a, c) => a.copyNumber - c.copyNumber);
    this.copies.set(sorted);
    const drafts: Record<number, string> = {};
    for (const c of sorted) {
      drafts[c.id] = c.copyCode ?? '';
    }
    this.copyCodeDrafts.set(drafts);
  }

  protected addCopy(): void {
    const id = this.bookId();
    if (id == null) return;

    const raw = this.newCopyCode().trim();
    this.addingCopy.set(true);
    this.api.addCopy(id, raw ? { copyCode: raw } : {}).subscribe({
      next: () => {
        this.newCopyCode.set('');
        this.alerts.toastSuccess('Ejemplar agregado');
        this.reloadDetail(id);
      },
      error: (err: unknown) => {
        this.addingCopy.set(false);
        void this.alerts.error(parseHttpError(err), 'No se pudo agregar el ejemplar');
      },
      complete: () => this.addingCopy.set(false),
    });
  }

  protected onNewCopyInput(event: Event): void {
    this.newCopyCode.set((event.target as HTMLInputElement).value);
  }

  protected copyDraft(copyId: number): string {
    return this.copyCodeDrafts()[copyId] ?? '';
  }

  protected onCopyDraftInput(copyId: number, event: Event): void {
    const v = (event.target as HTMLInputElement).value;
    this.copyCodeDrafts.update((m) => ({ ...m, [copyId]: v }));
  }

  /** Compara borrador vs servidor (trim) para habilitar «Guardar». */
  protected copyCodeChanged(c: BookCopyDto): boolean {
    const draft = (this.copyCodeDrafts()[c.id] ?? '').trim();
    const server = (c.copyCode ?? '').trim();
    return draft !== server;
  }

  protected saveCopyCode(copyId: number): void {
    const bookId = this.bookId();
    if (bookId == null) return;
    const raw = (this.copyCodeDrafts()[copyId] ?? '').trim();
    const body: UpdateBookCopyRequestDto = raw === '' ? { copyCode: null } : { copyCode: raw };
    this.updatingCopyId.set(copyId);
    this.api.updateCopy(bookId, copyId, body).subscribe({
      next: () => {
        this.alerts.toastSuccess('Ejemplar actualizado');
        this.reloadDetail(bookId);
      },
      error: (err: unknown) => {
        this.updatingCopyId.set(null);
        void this.alerts.error(parseHttpError(err), 'No se pudo actualizar el ejemplar');
      },
      complete: () => this.updatingCopyId.set(null),
    });
  }

  protected async removeCopy(copyId: number): Promise<void> {
    const bookId = this.bookId();
    if (bookId == null) return;
    const ok = await this.alerts.confirmDanger({
      title: '¿Dar de baja este ejemplar?',
      text: 'Es una baja lógica. No podrás eliminarlo si es el único ejemplar activo o si tiene un préstamo sin devolver.',
      confirmText: 'Eliminar',
    });
    if (!ok) return;
    this.deletingCopyId.set(copyId);
    this.api.deleteCopy(bookId, copyId).subscribe({
      next: () => {
        this.alerts.toastSuccess('Ejemplar eliminado');
        this.reloadDetail(bookId);
      },
      error: (err: unknown) => {
        this.deletingCopyId.set(null);
        void this.alerts.error(parseHttpError(err), 'No se pudo eliminar el ejemplar');
      },
      complete: () => this.deletingCopyId.set(null),
    });
  }

  protected rowCopyBusy(copyId: number): boolean {
    return this.updatingCopyId() === copyId || this.deletingCopyId() === copyId;
  }

  protected canManageCopies(): boolean {
    return this.bookId() != null && !this.loadFailed();
  }
}
