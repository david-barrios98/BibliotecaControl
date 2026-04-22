import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthorApiService } from '../services/author-api.service';
import type { AuthorResponseDto } from '../models/author.dto';
import { parseHttpError } from '@core/http/api-response-helpers';
import { LoadingBlockComponent } from '@shared/ui/loading-block.component';
import { ErrorAlertComponent } from '@shared/ui/error-alert.component';

@Component({
  selector: 'app-author-detail',
  standalone: true,
  imports: [RouterLink, LoadingBlockComponent, ErrorAlertComponent],
  templateUrl: './author-detail.component.html',
  styleUrl: './author-detail.component.scss',
})
export class AuthorDetailComponent implements OnInit {
  private readonly api = inject(AuthorApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly loading = signal(true);
  protected readonly loadError = signal<string | null>(null);
  protected readonly deleteError = signal<string | null>(null);
  /** URL sin id numérico válido: sin reintento de carga. */
  protected readonly invalidId = signal(false);
  protected readonly author = signal<AuthorResponseDto | null>(null);

  private id = 0;

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (!idParam) {
      this.loading.set(false);
      this.invalidId.set(true);
      this.loadError.set('Identificador no válido.');
      return;
    }
    this.id = +idParam;
    if (Number.isNaN(this.id)) {
      this.loading.set(false);
      this.invalidId.set(true);
      this.loadError.set('Identificador no válido.');
      return;
    }
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    this.loadError.set(null);
    this.deleteError.set(null);
    this.api.getById(this.id).subscribe({
      next: (a) => {
        this.author.set(a);
        this.loading.set(false);
      },
      error: (err: unknown) => {
        this.loading.set(false);
        this.author.set(null);
        this.loadError.set(parseHttpError(err));
      },
    });
  }

  protected retryLoad(): void {
    if (!this.invalidId()) {
      this.load();
    }
  }

  protected displayName(a: AuthorResponseDto): string {
    return [a.name, a.lastName].filter(Boolean).join(' ') || '(sin nombre)';
  }

  protected formatDate(iso: string | null | undefined): string {
    if (!iso) return '—';
    try {
      return new Date(iso).toLocaleString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return iso;
    }
  }

  protected confirmDelete(): void {
    const a = this.author();
    if (!a) return;
    const ok = window.confirm(`¿Eliminar al autor "${this.displayName(a)}"? Solo es posible si no tiene libros.`);
    if (!ok) return;

    this.deleteError.set(null);
    this.api.delete(a.id).subscribe({
      next: () => void this.router.navigate(['/autores']),
      error: (err: unknown) => {
        this.deleteError.set(parseHttpError(err));
      },
    });
  }
}
