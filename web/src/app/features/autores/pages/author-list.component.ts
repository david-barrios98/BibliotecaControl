import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthorApiService } from '../services/author-api.service';
import type { AuthorResponseDto } from '../models/author.dto';
import { parseHttpError } from '@core/http/api-response-helpers';
import { LoadingBlockComponent } from '@shared/ui/loading-block.component';
import { EmptyStateComponent } from '@shared/ui/empty-state.component';
import { BackLinkComponent } from '@shared/ui/back-link.component';
import { AlertService } from '@core/notifications/alert.service';
import { formatIsoDateDisplay } from '@core/utils/date-input';

@Component({
  selector: 'app-author-list',
  standalone: true,
  imports: [RouterLink, LoadingBlockComponent, EmptyStateComponent, BackLinkComponent],
  templateUrl: './author-list.component.html',
  styleUrl: './author-list.component.scss',
})
export class AuthorListComponent implements OnInit {
  private readonly api = inject(AuthorApiService);
  private readonly alerts = inject(AlertService);

  protected readonly loading = signal(false);
  /** Tras un fallo de red/API: no mostrar estado vacío hasta reintentar con éxito. */
  protected readonly listLoadFailed = signal(false);
  protected readonly searchTerm = signal('');
  protected readonly authors = signal<AuthorResponseDto[]>([]);
  protected readonly pageNumber = signal(1);
  protected readonly pageSize = signal(10);
  protected readonly totalRecords = signal(0);
  protected readonly totalPages = signal(0);

  readonly pageSizeOptions = [10, 25, 50] as const;

  ngOnInit(): void {
    this.loadPage();
  }

  protected loadPage(): void {
    this.loading.set(true);
    this.listLoadFailed.set(false);
    this.api.list(this.pageNumber(), this.pageSize(), this.searchTerm()).subscribe({
      next: (page) => {
        this.authors.set(page.items ?? []);
        this.pageNumber.set(page.pageNumber);
        this.pageSize.set(page.pageSize);
        this.totalRecords.set(page.totalRecords);
        this.totalPages.set(page.totalPages);
        this.loading.set(false);
      },
      error: (err: unknown) => {
        this.loading.set(false);
        this.authors.set([]);
        this.totalRecords.set(0);
        this.totalPages.set(0);
        this.listLoadFailed.set(true);
        void this.promptListRetry(parseHttpError(err));
      },
    });
  }

  private async promptListRetry(message: string): Promise<void> {
    const retry = await this.alerts.errorWithRetry(message, 'No se pudo cargar el listado');
    if (retry) {
      this.loadPage();
    }
  }

  protected prevPage(): void {
    if (this.pageNumber() <= 1) return;
    this.pageNumber.update((p) => p - 1);
    this.loadPage();
  }

  protected nextPage(): void {
    if (this.pageNumber() >= this.totalPages()) return;
    this.pageNumber.update((p) => p + 1);
    this.loadPage();
  }

  protected onPageSizeChange(event: Event): void {
    const value = +(event.target as HTMLSelectElement).value;
    this.pageSize.set(value);
    this.pageNumber.set(1);
    this.loadPage();
  }

  protected onSearchSubmit(event: Event): void {
    event.preventDefault();
    this.pageNumber.set(1);
    this.loadPage();
  }

  protected onSearchInput(event: Event): void {
    this.searchTerm.set((event.target as HTMLInputElement).value);
  }

  protected clearSearch(): void {
    this.searchTerm.set('');
    this.pageNumber.set(1);
    this.loadPage();
  }

  protected displayName(a: AuthorResponseDto): string {
    return [a.name, a.lastName].filter(Boolean).join(' ') || '(sin nombre)';
  }

  protected countryLabel(a: AuthorResponseDto): string {
    return a.countryName ?? a.country ?? '—';
  }

  protected formatBirthColumn(iso: string | null | undefined): string {
    return formatIsoDateDisplay(iso, 'short');
  }

  /** Estado vacío real (sin fallo reciente y sin filas). */
  protected readonly isEmpty = () =>
    !this.loading() && !this.listLoadFailed() && this.authors().length === 0;
}
