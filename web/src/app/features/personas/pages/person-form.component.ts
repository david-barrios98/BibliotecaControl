import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { PersonApiService } from '../services/person-api.service';
import type { CreatePersonRequestDto, UpdatePersonRequestDto } from '../models/person.dto';
import { parseHttpError } from '@core/http/api-response-helpers';
import { LoadingBlockComponent } from '@shared/ui/loading-block.component';
import { AlertService } from '@core/notifications/alert.service';
import { ControlValidationMessageComponent } from '@shared/validation/control-validation-message.component';
import { personFieldMessages } from './person-form.validation';
import { BackLinkComponent } from '@shared/ui/back-link.component';

@Component({
  selector: 'app-person-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    LoadingBlockComponent,
    ControlValidationMessageComponent,
    BackLinkComponent,
  ],
  templateUrl: './person-form.component.html',
  styleUrl: './person-form.component.scss',
})
export class PersonFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(PersonApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly alerts = inject(AlertService);

  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  protected readonly editLoadFailed = signal(false);
  protected readonly isEdit = signal(false);

  protected readonly personFieldMessages = personFieldMessages;

  readonly form = this.fb.nonNullable.group({
    firstName: ['', [Validators.required, Validators.minLength(1), Validators.maxLength(100)]],
    lastName: ['', [Validators.required, Validators.minLength(1), Validators.maxLength(100)]],
    nationalId: ['', Validators.maxLength(40)],
    email: ['', [Validators.email, Validators.maxLength(120)]],
    phone: ['', Validators.maxLength(40)],
    address: ['', Validators.maxLength(500)],
  });

  private personId: number | null = null;

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.personId = +idParam;
      this.isEdit.set(true);
      this.loadPerson(this.personId);
    }
  }

  private loadPerson(id: number): void {
    this.loading.set(true);
    this.editLoadFailed.set(false);
    this.api.getById(id).subscribe({
      next: (p) => {
        this.form.patchValue({
          firstName: p.firstName ?? '',
          lastName: p.lastName ?? '',
          nationalId: p.nationalId ?? '',
          email: p.email ?? '',
          phone: p.phone ?? '',
          address: p.address ?? '',
        });
        this.loading.set(false);
      },
      error: (err: unknown) => {
        this.loading.set(false);
        void this.handleLoadError(id, parseHttpError(err));
      },
    });
  }

  private async handleLoadError(id: number, message: string): Promise<void> {
    const retry = await this.alerts.errorWithRetry(message, 'No se pudieron cargar los datos');
    if (retry) {
      this.loadPerson(id);
    } else {
      this.editLoadFailed.set(true);
    }
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      void this.alerts.info('Completa los campos obligatorios antes de guardar.', 'Revisa el formulario');
      return;
    }
    const v = this.form.getRawValue();
    const upsert = {
      firstName: v.firstName.trim(),
      lastName: v.lastName.trim(),
      nationalId: v.nationalId.trim() ? v.nationalId.trim() : null,
      email: v.email.trim() ? v.email.trim() : null,
      phone: v.phone.trim() ? v.phone.trim() : null,
      address: v.address.trim() ? v.address.trim() : null,
    };

    this.saving.set(true);

    if (this.isEdit() && this.personId != null) {
      const payload: UpdatePersonRequestDto = upsert;
      this.api.update(this.personId, payload).subscribe({
        next: () => void this.router.navigate(['/personas', this.personId]),
        error: (err: unknown) => {
          this.saving.set(false);
          void this.alerts.error(parseHttpError(err), 'No se pudo guardar');
        },
        complete: () => this.saving.set(false),
      });
    } else {
      const payload: CreatePersonRequestDto = upsert;
      this.api.create(payload).subscribe({
        next: (created) => void this.router.navigate(['/personas', created.id]),
        error: (err: unknown) => {
          this.saving.set(false);
          void this.alerts.error(parseHttpError(err), 'No se pudo guardar');
        },
        complete: () => this.saving.set(false),
      });
    }
  }

  protected backLink(): string[] {
    if (this.isEdit() && this.personId != null) {
      return ['/personas', String(this.personId)];
    }
    return ['/personas'];
  }

  protected backLabel(): string {
    return this.isEdit() ? 'Ficha de la persona' : 'Lista de personas';
  }
}
