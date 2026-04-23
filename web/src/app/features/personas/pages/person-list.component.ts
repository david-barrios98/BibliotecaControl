import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PersonApiService } from '../services/person-api.service';
import type { PersonResponseDto } from '../models/person.dto';
import { parseHttpError } from '@core/http/api-response-helpers';
import { LoadingBlockComponent } from '@shared/ui/loading-block.component';
import { EmptyStateComponent } from '@shared/ui/empty-state.component';
import { BackLinkComponent } from '@shared/ui/back-link.component';
import { AlertService } from '@core/notifications/alert.service';

@Component({
  selector: 'app-person-list',
  standalone: true,
  imports: [RouterLink, LoadingBlockComponent, EmptyStateComponent, BackLinkComponent],
  templateUrl: './person-list.component.html',
  styleUrl: './person-list.component.scss',
})
export class PersonListComponent implements OnInit {
  private readonly api = inject(PersonApiService);
  private readonly alerts = inject(AlertService);

  protected readonly loading = signal(false);
  protected readonly listLoadFailed = signal(false);
  protected readonly searchTerm = signal('');
  protected readonly persons = signal<PersonResponseDto[]>([]);
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
        this.persons.set(page.items ?? []);
        this.pageNumber.set(page.pageNumber);
        this.pageSize.set(page.pageSize);
        this.totalRecords.set(page.totalRecords);
        this.totalPages.set(page.totalPages);
        this.loading.set(false);
      },
      error: (err: unknown) => {
        this.loading.set(false);
        this.persons.set([]);
        this.totalRecords.set(0);
        this.totalPages.set(0);
        this.listLoadFailed.set(true);
        void this.promptListRetry(parseHttpError(err));
      },
    });
  }

  private async promptListRetry(message: string): Promise<void> {
    const retry = await this.alerts.errorWithRetry(message, 'No se pudo cargar el listado');
    if (retry) this.loadPage();
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

  protected displayName(p: PersonResponseDto): string {
    return [p.firstName, p.lastName].filter(Boolean).join(' ') || '(sin nombre)';
  }

  protected dash(v: string | null | undefined): string {
    return v?.trim() ? v : '—';
  }

  protected readonly isEmpty = () =>
    !this.loading() && !this.listLoadFailed() && this.persons().length === 0;
}
