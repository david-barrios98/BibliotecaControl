import { Component, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { catchError, finalize, map, of, switchMap } from 'rxjs';
import { CoverMediaService } from '@core/media/cover-media.service';

/** Miniatura de portada: carga con JWT vía HttpClient + blob URL (mismo patrón que el formulario de edición). */
@Component({
  selector: 'app-cover-thumb',
  standalone: true,
  template: `
    @if (displayUrl(); as src) {
      <img [src]="src" alt="" loading="lazy" decoding="async" />
    } @else if (pending()) {
      <span class="cover-thumb__wait" aria-hidden="true">…</span>
    } @else {
      <span class="cover-thumb__ph">Sin portada</span>
    }
  `,
  styles: `
    :host {
      display: block;
      width: 100%;
      height: 100%;
      min-height: 0;
      align-self: stretch;
      justify-self: stretch;
    }
    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }
    .cover-thumb__ph,
    .cover-thumb__wait {
      font-size: 0.75rem;
      color: var(--bc-color-muted);
      text-align: center;
      padding: 0.25rem;
    }
  `,
})
export class CoverThumbComponent {
  private readonly media = inject(CoverMediaService);

  readonly url = input<string | null | undefined>(undefined);

  protected readonly displayUrl = signal<string | null>(null);
  protected readonly pending = signal(false);

  private blobToRevoke: string | null = null;

  constructor() {
    toObservable(this.url)
      .pipe(
        switchMap((raw) => {
          this.revokeBlob();
          this.displayUrl.set(null);

          if (raw == null || String(raw).trim() === '') {
            this.pending.set(false);
            return of(null);
          }

          this.pending.set(true);
          return this.media.coverDisplayUrl(raw).pipe(
            map((d) => {
              if (d?.startsWith('blob:')) {
                this.blobToRevoke = d;
              }
              return d;
            }),
            catchError(() => of(null)),
            finalize(() => this.pending.set(false)),
          );
        }),
        takeUntilDestroyed(),
      )
      .subscribe((d) => this.displayUrl.set(d));
  }

  private revokeBlob(): void {
    if (this.blobToRevoke) {
      URL.revokeObjectURL(this.blobToRevoke);
      this.blobToRevoke = null;
    }
  }
}
