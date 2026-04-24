import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BackLinkComponent } from '@shared/ui/back-link.component';
import { LoadingBlockComponent } from '@shared/ui/loading-block.component';
import { EmptyStateComponent } from '@shared/ui/empty-state.component';
import { AlertService } from '@core/notifications/alert.service';
import { parseHttpError } from '@core/http/api-response-helpers';
import { UserApiService } from '../services/user-api.service';
import type { UserResponseDto } from '../models/user.dto';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [RouterLink, BackLinkComponent, LoadingBlockComponent, EmptyStateComponent],
  templateUrl: './user-list.component.html',
  styleUrl: './user-list.component.scss',
})
export class UserListComponent implements OnInit {
  private readonly api = inject(UserApiService);
  private readonly alerts = inject(AlertService);

  protected readonly loading = signal(false);
  protected readonly listLoadFailed = signal(false);

  protected readonly search = signal('');
  protected readonly users = signal<UserResponseDto[]>([]);
  protected readonly pageNumber = signal(1);
  protected readonly pageSize = signal(10);
  protected readonly totalRecords = signal(0);
  protected readonly totalPages = signal(0);

  readonly pageSizeOptions = [10, 25, 50] as const;

  protected readonly isEmpty = computed(() => !this.loading() && !this.listLoadFailed() && this.users().length === 0);

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
        search: this.search(),
      })
      .subscribe({
        next: (page) => {
          this.users.set(page.items ?? []);
          this.pageNumber.set(page.pageNumber);
          this.pageSize.set(page.pageSize);
          this.totalRecords.set(page.totalRecords);
          this.totalPages.set(page.totalPages);
          this.loading.set(false);
        },
        error: (err: unknown) => {
          this.loading.set(false);
          this.users.set([]);
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
    this.search.set((event.target as HTMLInputElement).value);
  }

  protected onSearchSubmit(event: Event): void {
    event.preventDefault();
    this.pageNumber.set(1);
    this.loadPage();
  }

  protected clearSearch(): void {
    this.search.set('');
    this.pageNumber.set(1);
    this.loadPage();
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

  protected userDisplay(u: UserResponseDto): string {
    const name = (u.username ?? '').trim();
    const mail = (u.email ?? '').trim();
    if (name && mail) return `${name} · ${mail}`;
    return name || mail || `Usuario #${u.id}`;
  }

  protected userRole(u: UserResponseDto): string {
    return (u.role ?? '').trim() || '—';
  }

  protected statusLabel(u: UserResponseDto): string {
    if (u.isActive === false) return 'Inactivo';
    if (u.isActive === true) return 'Activo';
    return '—';
  }

  protected async deactivate(u: UserResponseDto): Promise<void> {
    const ok = await this.alerts.confirmDanger({
      title: 'Desactivar usuario',
      text: `Se desactivará el usuario ${this.userDisplay(u)}. Podrás reactivarlo desde backend si lo implementas luego.`,
      confirmText: 'Desactivar',
    });
    if (!ok) return;
    this.api.deactivate(u.id).subscribe({
      next: () => {
        this.alerts.toastSuccess('Usuario desactivado');
        this.loadPage();
      },
      error: (err: unknown) => void this.alerts.error(parseHttpError(err), 'No se pudo desactivar'),
    });
  }
}

