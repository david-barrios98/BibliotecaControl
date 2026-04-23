import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { PersonApiService } from '../services/person-api.service';
import type { PersonResponseDto } from '../models/person.dto';
import { parseHttpError } from '@core/http/api-response-helpers';
import { LoadingBlockComponent } from '@shared/ui/loading-block.component';
import { AlertService } from '@core/notifications/alert.service';
import { BackLinkComponent } from '@shared/ui/back-link.component';

@Component({
  selector: 'app-person-detail',
  standalone: true,
  imports: [RouterLink, LoadingBlockComponent, BackLinkComponent],
  templateUrl: './person-detail.component.html',
  styleUrl: './person-detail.component.scss',
})
export class PersonDetailComponent implements OnInit {
  private readonly api = inject(PersonApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly alerts = inject(AlertService);

  protected readonly loading = signal(true);
  protected readonly loadFailed = signal(false);
  protected readonly invalidId = signal(false);
  protected readonly person = signal<PersonResponseDto | null>(null);

  private id = 0;

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (!idParam) {
      this.loading.set(false);
      this.invalidId.set(true);
      void this.alerts.error('El identificador no es válido.', 'Error');
      return;
    }
    this.id = +idParam;
    if (Number.isNaN(this.id)) {
      this.loading.set(false);
      this.invalidId.set(true);
      void this.alerts.error('El identificador no es válido.', 'Error');
      return;
    }
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    this.loadFailed.set(false);
    this.api.getById(this.id).subscribe({
      next: (p) => {
        this.person.set(p);
        this.loading.set(false);
      },
      error: (err: unknown) => {
        this.loading.set(false);
        this.person.set(null);
        void this.afterLoadError(parseHttpError(err));
      },
    });
  }

  private async afterLoadError(message: string): Promise<void> {
    if (this.invalidId()) return;
    const retry = await this.alerts.errorWithRetry(message, 'No se pudo cargar el registro');
    if (retry) {
      this.load();
    } else {
      this.loadFailed.set(true);
    }
  }

  protected retryLoad(): void {
    if (!this.invalidId()) this.load();
  }

  protected displayName(p: PersonResponseDto): string {
    return [p.firstName, p.lastName].filter(Boolean).join(' ') || '(sin nombre)';
  }

  protected dash(v: string | null | undefined): string {
    return v?.trim() ? v : '—';
  }

  protected async confirmDelete(): Promise<void> {
    const p = this.person();
    if (!p) return;
    const ok = await this.alerts.confirmDanger({
      title: 'Eliminar persona',
      text: `¿Dar de baja a «${this.displayName(p)}»? Es una baja lógica. El servidor devolverá error 409 si tiene préstamos activos sin devolver.`,
    });
    if (!ok) return;

    this.api.delete(p.id).subscribe({
      next: () => void this.router.navigate(['/personas']),
      error: (err: unknown) => {
        void this.alerts.error(parseHttpError(err), 'No se pudo eliminar');
      },
    });
  }
}
