import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthorApiService } from '../services/author-api.service';
import type { AuthorResponseDto } from '../models/author.dto';
import { parseHttpError } from '@core/http/api-response-helpers';
import { LoadingBlockComponent } from '@shared/ui/loading-block.component';
import { AlertService } from '@core/notifications/alert.service';
import { BackLinkComponent } from '@shared/ui/back-link.component';
import { formatIsoDateDisplay } from '@core/utils/date-input';

@Component({
  selector: 'app-author-detail',
  standalone: true,
  imports: [RouterLink, LoadingBlockComponent, BackLinkComponent],
  templateUrl: './author-detail.component.html',
  styleUrl: './author-detail.component.scss',
})
export class AuthorDetailComponent implements OnInit {
  private readonly api = inject(AuthorApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly alerts = inject(AlertService);

  protected readonly loading = signal(true);
  /** Tras fallo de carga con diálogo cerrado sin reintentar. */
  protected readonly loadFailed = signal(false);
  /** URL sin id numérico válido: sin reintento de carga. */
  protected readonly invalidId = signal(false);
  protected readonly author = signal<AuthorResponseDto | null>(null);

  private id = 0;

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (!idParam) {
      this.loading.set(false);
      this.invalidId.set(true);
      void this.alerts.error('El identificador del autor no es válido.', 'Error');
      return;
    }
    this.id = +idParam;
    if (Number.isNaN(this.id)) {
      this.loading.set(false);
      this.invalidId.set(true);
      void this.alerts.error('El identificador del autor no es válido.', 'Error');
      return;
    }
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    this.loadFailed.set(false);
    this.api.getById(this.id).subscribe({
      next: (a) => {
        this.author.set(a);
        this.loading.set(false);
      },
      error: (err: unknown) => {
        this.loading.set(false);
        this.author.set(null);
        void this.afterLoadError(parseHttpError(err));
      },
    });
  }

  private async afterLoadError(message: string): Promise<void> {
    if (this.invalidId()) return;
    const retry = await this.alerts.errorWithRetry(message, 'No se pudo cargar el autor');
    if (retry) {
      this.load();
    } else {
      this.loadFailed.set(true);
    }
  }

  protected retryLoad(): void {
    if (!this.invalidId()) {
      this.load();
    }
  }

  protected displayName(a: AuthorResponseDto): string {
    return [a.name, a.lastName].filter(Boolean).join(' ') || '(sin nombre)';
  }

  protected formatBirthDate(iso: string | null | undefined): string {
    return formatIsoDateDisplay(iso, 'long');
  }

  protected async confirmDelete(): Promise<void> {
    const a = this.author();
    if (!a) return;
    const ok = await this.alerts.confirmDanger({
      title: 'Eliminar autor',
      text: `¿Eliminar a «${this.displayName(a)}»? Solo es posible si no tiene libros.`,
    });
    if (!ok) return;

    this.api.delete(a.id).subscribe({
      next: () => void this.router.navigate(['/autores']),
      error: (err: unknown) => {
        void this.alerts.error(parseHttpError(err), 'No se pudo eliminar');
      },
    });
  }
}
