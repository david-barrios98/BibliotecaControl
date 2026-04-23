import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LoadingBlockComponent } from '@shared/ui/loading-block.component';
import { EmptyStateComponent } from '@shared/ui/empty-state.component';
import { BackLinkComponent } from '@shared/ui/back-link.component';
import { AlertService } from '@core/notifications/alert.service';
import { parseHttpError } from '@core/http/api-response-helpers';
import { BookApiService } from '../services/book-api.service';
import type { BookResponseDto } from '../models/book.dto';
import { formatIsoDateDisplay } from '@core/utils/date-input';
import { CoverThumbComponent } from '@shared/ui/cover-thumb.component';

@Component({
  selector: 'app-book-list',
  standalone: true,
  imports: [RouterLink, LoadingBlockComponent, EmptyStateComponent, BackLinkComponent, CoverThumbComponent],
  templateUrl: './book-list.component.html',
  styleUrl: './book-list.component.scss',
})
export class BookListComponent implements OnInit {
  private readonly api = inject(BookApiService);
  private readonly alerts = inject(AlertService);

  protected readonly loading = signal(false);
  protected readonly listLoadFailed = signal(false);

  protected readonly searchTerm = signal('');
  protected readonly books = signal<BookResponseDto[]>([]);
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
    this.api
      .list({
        pageNumber: this.pageNumber(),
        pageSize: this.pageSize(),
        searchTerm: this.searchTerm(),
      })
      .subscribe({
        next: (page) => {
          this.books.set(page.items ?? []);
          this.pageNumber.set(page.pageNumber);
          this.pageSize.set(page.pageSize);
          this.totalRecords.set(page.totalRecords);
          this.totalPages.set(page.totalPages);
          this.loading.set(false);
        },
        error: (err: unknown) => {
          this.loading.set(false);
          this.books.set([]);
          this.totalRecords.set(0);
          this.totalPages.set(0);
          this.listLoadFailed.set(true);
          void this.promptRetry(parseHttpError(err));
        },
      });
  }

  private async promptRetry(message: string): Promise<void> {
    const retry = await this.alerts.errorWithRetry(message, 'No se pudo cargar el listado');
    if (retry) this.loadPage();
  }

  protected onSearchInput(event: Event): void {
    this.searchTerm.set((event.target as HTMLInputElement).value);
  }

  protected onSearchSubmit(event: Event): void {
    event.preventDefault();
    this.pageNumber.set(1);
    this.loadPage();
  }

  protected clearSearch(): void {
    this.searchTerm.set('');
    this.pageNumber.set(1);
    this.loadPage();
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

  protected formatPublished(iso: string | null | undefined): string {
    return formatIsoDateDisplay(iso, 'short');
  }

  protected hasCover(b: BookResponseDto): boolean {
    return !!b.coverUrl;
  }

  protected readonly isEmpty = () => !this.loading() && !this.listLoadFailed() && this.books().length === 0;
}

