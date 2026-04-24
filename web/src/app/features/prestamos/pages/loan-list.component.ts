import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { LoadingBlockComponent } from '@shared/ui/loading-block.component';
import { EmptyStateComponent } from '@shared/ui/empty-state.component';
import { BackLinkComponent } from '@shared/ui/back-link.component';
import { AlertService } from '@core/notifications/alert.service';
import { parseHttpError } from '@core/http/api-response-helpers';
import { formatIsoDateDisplay } from '@core/utils/date-input';
import { LoanApiService } from '../services/loan-api.service';
import type { BookResponseDto } from '../../libros/models/book.dto';
import { BookApiService } from '../../libros/services/book-api.service';
import type { LoanResponseDto } from '../models/loan.dto';
import {
  LOAN_LIST_STATUS,
  isLoanReturned,
  loanCopyLabel,
  loanPersonLabel,
} from '../utils/loan-display';

type StatusTab = 'all' | 'active' | 'returned';

@Component({
  selector: 'app-loan-list',
  standalone: true,
  imports: [RouterLink, LoadingBlockComponent, EmptyStateComponent, BackLinkComponent],
  templateUrl: './loan-list.component.html',
  styleUrl: './loan-list.component.scss',
})
export class LoanListComponent implements OnInit {
  private readonly loansApi = inject(LoanApiService);
  private readonly booksApi = inject(BookApiService);
  private readonly alerts = inject(AlertService);

  protected readonly loading = signal(false);
  protected readonly statsLoading = signal(false);
  protected readonly listLoadFailed = signal(false);
  protected readonly booksLoadFailed = signal(false);

  protected readonly loans = signal<LoanResponseDto[]>([]);
  protected readonly booksFilter = signal<BookResponseDto[]>([]);
  protected readonly pageNumber = signal(1);
  protected readonly pageSize = signal(10);
  protected readonly totalRecords = signal(0);
  protected readonly totalPages = signal(0);

  protected readonly statusTab = signal<StatusTab>('active');
  protected readonly bookIdFilter = signal<number | null>(null);

  protected readonly statActive = signal(0);
  protected readonly statReturned = signal(0);
  protected readonly statTotal = signal(0);

  protected readonly returningId = signal<number | null>(null);

  readonly pageSizeOptions = [10, 25, 50] as const;

  protected readonly formatDate = formatIsoDateDisplay;
  protected readonly loanPersonLabel = loanPersonLabel;
  protected readonly loanCopyLabel = loanCopyLabel;
  protected readonly isLoanReturned = isLoanReturned;

  protected readonly hasFilters = computed(() => this.bookIdFilter() != null);

  ngOnInit(): void {
    this.loadBooksForFilter();
    this.loadPage();
    this.loadStats();
  }

  private statusQuery(): string | undefined {
    const t = this.statusTab();
    if (t === 'active') return LOAN_LIST_STATUS.active;
    if (t === 'returned') return LOAN_LIST_STATUS.returned;
    return undefined;
  }

  protected loadBooksForFilter(): void {
    this.booksLoadFailed.set(false);
    this.booksApi.listAllForLookup().subscribe({
      next: (items) => this.booksFilter.set(items),
      error: () => {
        this.booksLoadFailed.set(true);
        this.booksFilter.set([]);
      },
    });
  }

  protected loadStats(): void {
    this.statsLoading.set(true);
    const bid = this.bookIdFilter();
    const base = {
      pageNumber: 1,
      pageSize: 1,
      ...(bid != null && bid > 0 ? { bookId: bid } : {}),
    };
    forkJoin({
      active: this.loansApi.list({ ...base, status: LOAN_LIST_STATUS.active }),
      returned: this.loansApi.list({ ...base, status: LOAN_LIST_STATUS.returned }),
      total: this.loansApi.list({ ...base }),
    }).subscribe({
      next: ({ active, returned, total }) => {
        this.statActive.set(active.totalRecords ?? 0);
        this.statReturned.set(returned.totalRecords ?? 0);
        this.statTotal.set(total.totalRecords ?? 0);
        this.statsLoading.set(false);
      },
      error: (err: unknown) => {
        this.statsLoading.set(false);
        void this.alerts.error(parseHttpError(err), 'No se pudieron cargar las métricas');
      },
    });
  }

  protected loadPage(): void {
    this.loading.set(true);
    this.listLoadFailed.set(false);
    const st = this.statusQuery();
    const bid = this.bookIdFilter();
    this.loansApi
      .list({
        pageNumber: this.pageNumber(),
        pageSize: this.pageSize(),
        ...(st ? { status: st } : {}),
        ...(bid != null && bid > 0 ? { bookId: bid } : {}),
      })
      .subscribe({
        next: (page) => {
          this.loans.set(page.items ?? []);
          this.pageNumber.set(page.pageNumber);
          this.pageSize.set(page.pageSize);
          this.totalRecords.set(page.totalRecords);
          this.totalPages.set(page.totalPages);
          this.loading.set(false);
        },
        error: (err: unknown) => {
          this.loading.set(false);
          this.loans.set([]);
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

  protected setStatusTab(tab: StatusTab): void {
    if (this.statusTab() === tab) return;
    this.statusTab.set(tab);
    this.pageNumber.set(1);
    this.loadPage();
  }

  protected onBookFilterChange(event: Event): void {
    const v = +(event.target as HTMLSelectElement).value;
    this.bookIdFilter.set(Number.isFinite(v) && v > 0 ? v : null);
    this.pageNumber.set(1);
    this.loadPage();
    this.loadStats();
  }

  protected clearBookFilter(): void {
    this.bookIdFilter.set(null);
    this.pageNumber.set(1);
    this.loadPage();
    this.loadStats();
  }

  protected onPageSizeChange(event: Event): void {
    this.pageSize.set(+(event.target as HTMLSelectElement).value);
    this.pageNumber.set(1);
    this.loadPage();
  }

  protected prevPage(): void {
    if (this.pageNumber() <= 1) return;
    this.pageNumber.update((n) => n - 1);
    this.loadPage();
  }

  protected nextPage(): void {
    if (this.totalPages() === 0 || this.pageNumber() >= this.totalPages()) return;
    this.pageNumber.update((n) => n + 1);
    this.loadPage();
  }

  protected isEmpty(): boolean {
    return !this.loading() && !this.listLoadFailed() && this.loans().length === 0;
  }

  protected async onReturn(loan: LoanResponseDto): Promise<void> {
    if (this.isLoanReturned(loan)) return;
    const r = await this.alerts.fire({
      icon: 'question',
      title: 'Registrar devolución',
      text: `¿Confirmar la devolución del ejemplar ${this.loanCopyLabel(loan)} de «${(loan.bookTitle ?? '—').trim()}» prestado a ${this.loanPersonLabel(loan)}?`,
      showCancelButton: true,
      confirmButtonText: 'Registrar devolución',
      cancelButtonText: 'Cancelar',
    });
    if (!r.isConfirmed) return;

    this.returningId.set(loan.id);
    this.loansApi.returnLoan(loan.id).subscribe({
      next: async () => {
        this.returningId.set(null);
        await this.alerts.success('La devolución se registró correctamente.');
        this.loadPage();
        this.loadStats();
      },
      error: async (err: unknown) => {
        this.returningId.set(null);
        await this.alerts.error(parseHttpError(err));
      },
    });
  }
}
