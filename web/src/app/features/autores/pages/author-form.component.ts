import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthorApiService } from '../services/author-api.service';
import type { AuthorRequestDto } from '../models/author.dto';
import { parseHttpError } from '@core/http/api-response-helpers';
import { LoadingBlockComponent } from '@shared/ui/loading-block.component';
import { ErrorAlertComponent } from '@shared/ui/error-alert.component';
import { ControlValidationMessageComponent } from '@shared/validation/control-validation-message.component';
import { authorFieldMessages } from './author-form.validation';
import { dateInputToIsoUtcNoon, isoToDateInputValue } from '@core/utils/date-input';
import { BackLinkComponent } from '@shared/ui/back-link.component';

@Component({
  selector: 'app-author-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    LoadingBlockComponent,
    ErrorAlertComponent,
    ControlValidationMessageComponent,
    BackLinkComponent,
  ],
  templateUrl: './author-form.component.html',
  styleUrl: './author-form.component.scss',
})
export class AuthorFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(AuthorApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  /** Error al cargar el autor en modo edición. */
  protected readonly loadError = signal<string | null>(null);
  /** Error al crear o actualizar. */
  protected readonly submitError = signal<string | null>(null);
  protected readonly isEdit = signal(false);

  /** Overrides de mensajes por campo (registro/edición autor). */
  protected readonly authorFieldMessages = authorFieldMessages;

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(1), Validators.maxLength(100)]],
    lastName: ['', [Validators.required, Validators.minLength(1), Validators.maxLength(100)]],
    birthDate: ['', Validators.required],
    country: ['', [Validators.required, Validators.minLength(1), Validators.maxLength(50)]],
    biography: ['', Validators.maxLength(500)],
  });

  private authorId: number | null = null;

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.authorId = +idParam;
      this.isEdit.set(true);
      this.loadAuthor(this.authorId);
    }
  }

  private loadAuthor(id: number): void {
    this.loading.set(true);
    this.loadError.set(null);
    this.api.getById(id).subscribe({
      next: (a) => {
        this.form.patchValue({
          name: a.name ?? '',
          lastName: a.lastName ?? '',
          birthDate: isoToDateInputValue(a.birthDate),
          country: a.country ?? '',
          biography: a.biography ?? '',
        });
        this.loading.set(false);
      },
      error: (err: unknown) => {
        this.loading.set(false);
        this.loadError.set(parseHttpError(err));
      },
    });
  }

  /** Reintenta la carga inicial solo en modo edición. */
  protected retryInitialLoad(): void {
    if (this.authorId != null) {
      this.loadAuthor(this.authorId);
    }
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const payload: AuthorRequestDto = {
      name: v.name.trim(),
      lastName: v.lastName.trim(),
      birthDate: dateInputToIsoUtcNoon(v.birthDate),
      country: v.country.trim(),
      biography: v.biography.trim() ? v.biography.trim() : null,
    };

    this.saving.set(true);
    this.submitError.set(null);

    if (this.isEdit() && this.authorId != null) {
      this.api.update(this.authorId, payload).subscribe({
        next: () => void this.router.navigate(['/autores', this.authorId]),
        error: (err: unknown) => {
          this.saving.set(false);
          this.submitError.set(parseHttpError(err));
        },
        complete: () => this.saving.set(false),
      });
    } else {
      this.api.create(payload).subscribe({
        next: (created) => void this.router.navigate(['/autores', created.id]),
        error: (err: unknown) => {
          this.saving.set(false);
          this.submitError.set(parseHttpError(err));
        },
        complete: () => this.saving.set(false),
      });
    }
  }

  /** Destino del enlace «volver»: lista o ficha si está editando. */
  protected backLink(): string[] {
    if (this.isEdit() && this.authorId != null) {
      return ['/autores', String(this.authorId)];
    }
    return ['/autores'];
  }

  protected backLabel(): string {
    return this.isEdit() ? 'Ficha del autor' : 'Lista de autores';
  }
}
