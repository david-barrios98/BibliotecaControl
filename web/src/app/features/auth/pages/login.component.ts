import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthApiService } from '@core/auth/auth-api.service';
import { AlertService } from '@core/notifications/alert.service';
import { parseHttpError } from '@core/http/api-response-helpers';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(AuthApiService);
  private readonly alerts = inject(AlertService);
  private readonly router = inject(Router);

  protected readonly submitting = signal(false);

  readonly form = this.fb.nonNullable.group({
    username: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(60)]],
    password: ['', [Validators.required, Validators.minLength(4), Validators.maxLength(200)]],
  });

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      void this.alerts.info('Completa los campos obligatorios para continuar.', 'Revisa el formulario');
      return;
    }
    const v = this.form.getRawValue();
    this.submitting.set(true);
    this.api.login({ username: v.username.trim(), password: v.password }).subscribe({
      next: () => {
        this.alerts.toastSuccess('Sesión iniciada');
        void this.router.navigate(['/']);
      },
      error: (err: unknown) => {
        this.submitting.set(false);
        void this.alerts.error(parseHttpError(err), 'No se pudo iniciar sesión');
      },
      complete: () => this.submitting.set(false),
    });
  }
}

