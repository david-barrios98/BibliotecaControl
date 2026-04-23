import { Component, computed, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthApiService } from '@core/auth/auth-api.service';
import { AuthSessionService } from '@core/auth/auth-session.service';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.scss',
})
export class ShellComponent {
  private readonly session = inject(AuthSessionService);
  private readonly authApi = inject(AuthApiService);
  private readonly router = inject(Router);

  protected readonly isLoggedIn = computed(() => !!this.session.accessToken());

  protected logout(): void {
    // Si el backend falla, igual limpiamos sesión local.
    this.authApi.logout().subscribe({
      next: () => void this.router.navigate(['/login']),
      error: () => {
        this.session.clear();
        void this.router.navigate(['/login']);
      },
    });
  }
}
