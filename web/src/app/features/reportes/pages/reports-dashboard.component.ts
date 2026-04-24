import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { BackLinkComponent } from '@shared/ui/back-link.component';
import { LoadingBlockComponent } from '@shared/ui/loading-block.component';
import { AlertService } from '@core/notifications/alert.service';
import { parseHttpError } from '@core/http/api-response-helpers';
import { ReportApiService } from '../services/report-api.service';
import type { AuthorBookReportDto, TotalSummaryReportDto } from '../models/report.dto';
import { MiniBarChartComponent, type MiniBarDatum } from '../shared/mini-bar-chart.component';
import { MiniDonutComponent, type MiniDonutSlice } from '../shared/mini-donut.component';
import { LoanApiService } from '@features/prestamos/services/loan-api.service';
import { LOAN_LIST_STATUS } from '@features/prestamos/utils/loan-display';
import { BookApiService } from '@features/libros/services/book-api.service';
import { PersonApiService } from '@features/personas/services/person-api.service';
import { UserApiService } from '@features/usuarios/services/user-api.service';
import { AuthzService } from '@core/auth/authz.service';
import { forkJoin, of } from 'rxjs';
import type { BookResponseDto } from '@features/libros/models/book.dto';
import type { PersonResponseDto } from '@features/personas/models/person.dto';
import type { UserResponseDto } from '@features/usuarios/models/user.dto';

@Component({
  selector: 'app-reports-dashboard',
  standalone: true,
  imports: [BackLinkComponent, LoadingBlockComponent, MiniBarChartComponent, MiniDonutComponent],
  templateUrl: './reports-dashboard.component.html',
  styleUrl: './reports-dashboard.component.scss',
})
export class ReportsDashboardComponent implements OnInit {
  private readonly api = inject(ReportApiService);
  private readonly loansApi = inject(LoanApiService);
  private readonly booksApi = inject(BookApiService);
  private readonly personsApi = inject(PersonApiService);
  private readonly usersApi = inject(UserApiService);
  private readonly authz = inject(AuthzService);
  private readonly alerts = inject(AlertService);

  protected readonly loading = signal(false);
  protected readonly loadFailed = signal(false);

  protected readonly total = signal<TotalSummaryReportDto | null>(null);
  protected readonly byAuthor = signal<AuthorBookReportDto[]>([]);
  protected readonly loanActive = signal<number | null>(null);
  protected readonly loanReturned = signal<number | null>(null);
  protected readonly booksAll = signal<BookResponseDto[]>([]);
  protected readonly personsAll = signal<PersonResponseDto[]>([]);
  protected readonly usersAll = signal<UserResponseDto[]>([]);

  protected readonly kpis = computed(() => {
    const t = this.total();
    const by = this.byAuthor();
    const totalPages = by.reduce((acc, x) => acc + (x.totalPages ?? 0), 0);
    return [
      { label: 'Autores', value: t?.totalAuthors ?? '—' },
      { label: 'Libros', value: t?.totalBooks ?? '—' },
      { label: 'Páginas (total)', value: totalPages ? this.fmtInt(totalPages) : '—' },
      { label: 'Prom. páginas/libro', value: this.fmtNum(t?.averagePagesPerBook ?? t?.avgPages) },
      { label: 'Autores sin libros', value: t?.authorsWithoutBooks?.length ?? '—' },
    ] as const;
  });

  protected readonly booksByAuthorBars = computed<MiniBarDatum[]>(() => {
    const t = this.total();
    const fromTotal = (t?.booksCountByAuthor ?? []).map((x) => ({ label: x.authorName, value: x.bookCount }));
    const fromSummary = this.byAuthor().map((x) => ({ label: x.authorName, value: x.bookCount }));
    const src = fromTotal.length ? fromTotal : fromSummary;
    return [...src].sort((a, b) => b.value - a.value).slice(0, 8);
  });

  protected readonly pagesByAuthorBars = computed<MiniBarDatum[]>(() => {
    const t = this.total();
    const rows = (t?.topAuthorsByPages ?? []).map((x) => ({ label: x.authorName, value: x.totalPages }));
    return [...rows].sort((a, b) => b.value - a.value).slice(0, 8);
  });

  protected readonly authorsWithoutBooksList = computed(() => {
    const t = this.total();
    const rows = t?.authorsWithoutBooks ?? [];
    return rows.map((a) => {
      const name = [a.name, a.lastName].filter(Boolean).join(' ').trim();
      return name || (a.authorId ? `Autor #${a.authorId}` : '—');
    });
  });

  protected readonly loansDonut = computed<MiniDonutSlice[]>(() => {
    const a = this.loanActive();
    const r = this.loanReturned();
    if (a == null && r == null) return [];
    return [
      { label: 'Activos', value: a ?? 0, color: 'var(--bc-color-accent)' },
      { label: 'Devueltos', value: r ?? 0, color: 'rgba(46, 125, 50, 0.95)' },
    ];
  });

  protected readonly booksCopiesDonut = computed<MiniDonutSlice[]>(() => {
    const rows = this.booksAll();
    if (!rows.length) return [];
    const withCopy = rows.filter((b) => (b.copyCode ?? '').trim() !== '').length;
    const withoutCopy = Math.max(0, rows.length - withCopy);
    return [
      { label: 'Con ejemplar activo', value: withCopy, color: 'rgba(46, 125, 50, 0.95)' },
      { label: 'Sin ejemplar activo', value: withoutCopy, color: 'rgba(244, 67, 54, 0.92)' },
    ];
  });

  protected readonly personsEmailDonut = computed<MiniDonutSlice[]>(() => {
    const rows = this.personsAll();
    if (!rows.length) return [];
    const withEmail = rows.filter((p) => (p.email ?? '').trim() !== '').length;
    const withoutEmail = Math.max(0, rows.length - withEmail);
    return [
      { label: 'Con email', value: withEmail, color: 'var(--bc-color-accent)' },
      { label: 'Sin email', value: withoutEmail, color: 'rgba(120, 144, 156, 0.95)' },
    ];
  });

  protected readonly usersActiveDonut = computed<MiniDonutSlice[]>(() => {
    if (!this.authz.isAdmin()) return [];
    const rows = this.usersAll();
    if (!rows.length) return [];
    const active = rows.filter((u) => (u.isActive ?? true) === true).length;
    const inactive = Math.max(0, rows.length - active);
    return [
      { label: 'Activos', value: active, color: 'rgba(46, 125, 50, 0.95)' },
      { label: 'Inactivos', value: inactive, color: 'rgba(120, 144, 156, 0.95)' },
    ];
  });

  protected fmtInt(v: number): string {
    return new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(v);
  }

  protected fmtNum(v: number | null | undefined): string {
    if (v == null) return '—';
    return new Intl.NumberFormat(undefined, { maximumFractionDigits: 1 }).format(v);
  }

  ngOnInit(): void {
    this.reload();
  }

  protected reload(): void {
    this.loading.set(true);
    this.loadFailed.set(false);
    this.total.set(null);
    this.byAuthor.set([]);
    this.loanActive.set(null);
    this.loanReturned.set(null);
    this.booksAll.set([]);
    this.personsAll.set([]);
    this.usersAll.set([]);

    const req = forkJoin({
      total: this.api.totalSummary(),
      byAuthor: this.api.authorsBooksSummary(),
      loanActive: this.loansApi
        .list({ pageNumber: 1, pageSize: 1, status: LOAN_LIST_STATUS.active })
        .pipe(),
      loanReturned: this.loansApi
        .list({ pageNumber: 1, pageSize: 1, status: LOAN_LIST_STATUS.returned })
        .pipe(),
      booksAll: this.booksApi.listAllForLookup(80),
      personsAll: this.personsApi.listAllForLookup(80),
      usersAll: this.authz.isAdmin() ? this.usersApi.listAllForLookup(80, null) : of([] as UserResponseDto[]),
    });

    req.subscribe({
      next: (r) => {
        this.total.set(r.total);
        this.byAuthor.set((r.byAuthor ?? []).filter((x) => (x.authorName ?? '').trim() !== ''));
        this.loanActive.set(r.loanActive.totalRecords ?? 0);
        this.loanReturned.set(r.loanReturned.totalRecords ?? 0);
        this.booksAll.set(r.booksAll ?? []);
        this.personsAll.set(r.personsAll ?? []);
        this.usersAll.set(r.usersAll ?? []);
        this.loading.set(false);
      },
      error: async (err: unknown) => {
        this.loading.set(false);
        this.loadFailed.set(true);
        await this.alerts.error(parseHttpError(err), 'No se pudieron cargar los reportes');
      },
    });
  }
}

