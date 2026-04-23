import { Component, effect, inject, input, signal } from '@angular/core';
import { CoverMediaService } from '@core/media/cover-media.service';

/** Miniatura de portada: carga con JWT si hace falta (no usa `<img src>` directo a `/uploads`). */
@Component({
  selector: 'app-cover-thumb',
  standalone: true,
  template: `
    @if (displayUrl(); as src) {
      <img [src]="src" alt="" loading="lazy" />
    } @else if (pending()) {
      <span class="cover-thumb__wait" aria-hidden="true">…</span>
    } @else {
      <span class="cover-thumb__ph">Sin portada</span>
    }
  `,
  styles: `
    :host {
      display: contents;
    }
    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }
    .cover-thumb__ph,
    .cover-thumb__wait {
      font-size: 0.85rem;
      color: var(--bc-color-muted);
    }
  `,
})
export class CoverThumbComponent {
  private readonly media = inject(CoverMediaService);

  /** Valor crudo de la API (`coverUrl`). */
  readonly url = input<string | null | undefined>(undefined);

  protected readonly displayUrl = signal<string | null>(null);
  protected readonly pending = signal(false);

  private effectGen = 0;
  private blobToRevoke: string | null = null;

  constructor() {
    effect((onCleanup) => {
      const raw = this.url();
      const gen = ++this.effectGen;

      this.revokeBlob();
      this.displayUrl.set(null);

      if (raw == null || String(raw).trim() === '') {
        this.pending.set(false);
        return;
      }

      this.pending.set(true);

      const sub = this.media.coverDisplayUrl(raw).subscribe({
        next: (d) => {
          if (gen !== this.effectGen) return;
          this.pending.set(false);
          if (d?.startsWith('blob:')) {
            this.revokeBlob();
            this.blobToRevoke = d;
          }
          this.displayUrl.set(d);
        },
        error: () => {
          if (gen !== this.effectGen) return;
          this.pending.set(false);
          this.displayUrl.set(null);
        },
      });

      onCleanup(() => {
        sub.unsubscribe();
        this.revokeBlob();
        this.displayUrl.set(null);
        this.pending.set(false);
      });
    });
  }

  private revokeBlob(): void {
    if (this.blobToRevoke) {
      URL.revokeObjectURL(this.blobToRevoke);
      this.blobToRevoke = null;
    }
  }
}
