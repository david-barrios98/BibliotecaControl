import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { BackLinkComponent } from '@shared/ui/back-link.component';
import { LoadingBlockComponent } from '@shared/ui/loading-block.component';
import { AlertService } from '@core/notifications/alert.service';
import { parseHttpError } from '@core/http/api-response-helpers';
import { UserApiService } from '../services/user-api.service';
import type { CreateUserRequestDto, UpdateUserRequestDto } from '../models/user.dto';

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, BackLinkComponent, LoadingBlockComponent],
  templateUrl: './user-form.component.html',
  styleUrl: './user-form.component.scss',
})
export class UserFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(UserApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly alerts = inject(AlertService);

  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  protected readonly loadFailed = signal(false);
  protected readonly isEdit = signal(false);

  private userId: number | null = null;

  readonly form = this.fb.nonNullable.group({
    username: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(60)]],
    email: ['', [Validators.email, Validators.maxLength(120)]],
    role: ['User', [Validators.required, Validators.maxLength(40)]],
    password: [''],
  });

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      const id = +idParam;
      if (!Number.isNaN(id) && id > 0) {
        this.userId = id;
        this.isEdit.set(true);
        this.loadUser(id);
      } else {
        this.loadFailed.set(true);
      }
    }
  }

  private loadUser(id: number): void {
    this.loading.set(true);
    this.loadFailed.set(false);
    this.api.getById(id).subscribe({
      next: (u) => {
        this.form.patchValue({
          username: (u.username ?? '').trim(),
          email: (u.email ?? '').trim(),
          role: (u.role ?? 'User').trim() || 'User',
          password: '',
        });
        this.loading.set(false);
      },
      error: async (err: unknown) => {
        this.loading.set(false);
        this.loadFailed.set(true);
        await this.alerts.error(parseHttpError(err), 'No se pudo cargar el usuario');
      },
    });
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      void this.alerts.info('Completa los campos obligatorios.', 'Revisa el formulario');
      return;
    }
    const v = this.form.getRawValue();
    const username = v.username.trim();
    const role = v.role.trim();
    const email = v.email.trim() || null;
    const password = v.password.trim();

    if (!username || !role) return;

    this.saving.set(true);

    if (!this.isEdit()) {
      if (!password) {
        this.saving.set(false);
        void this.alerts.info('La contraseña es obligatoria al crear el usuario.', 'Falta contraseña');
        return;
      }
      const body: CreateUserRequestDto = { username, role, password, email };
      this.api.create(body).subscribe({
        next: async () => {
          this.saving.set(false);
          await this.alerts.success('Usuario creado.');
          void this.router.navigate(['/usuarios']);
        },
        error: async (err: unknown) => {
          this.saving.set(false);
          await this.alerts.error(parseHttpError(err), 'No se pudo crear el usuario');
        },
      });
      return;
    }

    const id = this.userId;
    if (id == null) return;
    const body: UpdateUserRequestDto = {
      username,
      role,
      email,
      ...(password ? { password } : {}),
    };
    this.api.update(id, body).subscribe({
      next: async () => {
        this.saving.set(false);
        await this.alerts.success('Usuario actualizado.');
        void this.router.navigate(['/usuarios']);
      },
      error: async (err: unknown) => {
        this.saving.set(false);
        await this.alerts.error(parseHttpError(err), 'No se pudo actualizar');
      },
    });
  }
}

