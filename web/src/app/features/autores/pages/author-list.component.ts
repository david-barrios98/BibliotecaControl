import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthorApiService } from '../services/author-api.service';
import type { AuthorResponseDto } from '../models/author.dto';
import { parseHttpError } from '@core/http/api-response-helpers';
import { LoadingBlockComponent } from '@shared/ui/loading-block.component';
import { EmptyStateComponent } from '@shared/ui/empty-state.component';
import { ErrorAlertComponent } from '@shared/ui/error-alert.component';

@Component({
  selector: 'app-author-list',
  standalone: true,
  imports: [RouterLink, LoadingBlockComponent, EmptyStateComponent, ErrorAlertComponent],
  templateUrl: './author-list.component.html',
  styleUrl: './author-list.component.scss',
})
export class AuthorListComponent implements OnInit {
  private readonly api = inject(AuthorApiService);

  protected readonly loading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
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
    this.errorMessage.set(null);
    this.api.list(this.pageNumber(), this.pageSize()).subscribe({
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
        this.errorMessage.set(parseHttpError(err));
      },
    });
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

  protected displayName(a: AuthorResponseDto): string {
    return [a.name, a.lastName].filter(Boolean).join(' ') || '(sin nombre)';
  }

  protected formatDate(iso: string | null | undefined): string {
    if (!iso) return '—';
    try {
      return new Date(iso).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return iso;
    }
  }

  /** Estado vacío real (sin error y sin filas). */
  protected readonly isEmpty = () => !this.loading() && !this.errorMessage() && this.authors().length === 0;
}
