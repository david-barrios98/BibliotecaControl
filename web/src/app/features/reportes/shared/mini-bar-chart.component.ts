import { Component, Input } from '@angular/core';

export interface MiniBarDatum {
  label: string;
  value: number;
}

@Component({
  selector: 'app-mini-bar-chart',
  standalone: true,
  template: `
    <div class="mbc" role="img" [attr.aria-label]="ariaLabel">
      @for (d of data; track d.label) {
        <div class="mbc__row">
          <div class="mbc__label" [title]="d.label">{{ d.label }}</div>
          <div class="mbc__barwrap">
            <div class="mbc__bar" [style.width.%]="pct(d.value)"></div>
          </div>
          <div class="mbc__value">{{ d.value }}</div>
        </div>
      }
      @if (!data.length) {
        <div class="mbc__empty">Sin datos</div>
      }
    </div>
  `,
  styles: `
    .mbc {
      display: grid;
      gap: 0.5rem;
    }
    .mbc__row {
      display: grid;
      grid-template-columns: minmax(0, 1fr) 7fr auto;
      gap: 0.5rem;
      align-items: center;
    }
    .mbc__label {
      font-size: 0.85rem;
      color: var(--bc-color-text);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .mbc__barwrap {
      height: 10px;
      border-radius: 999px;
      background: rgba(21, 25, 34, 0.06);
      overflow: hidden;
      border: 1px solid rgba(21, 25, 34, 0.06);
    }
    .mbc__bar {
      height: 100%;
      background: linear-gradient(90deg, var(--bc-color-accent), var(--bc-color-accent-hover));
      border-radius: 999px;
      width: 0%;
      transition: width 0.2s ease;
    }
    .mbc__value {
      font-size: 0.85rem;
      font-weight: 800;
      color: var(--bc-color-muted);
      min-width: 2.5rem;
      text-align: right;
    }
    .mbc__empty {
      color: var(--bc-color-muted);
      font-size: 0.9rem;
    }
    @media (max-width: 520px) {
      .mbc__row {
        grid-template-columns: 1fr 3fr auto;
      }
    }
  `,
})
export class MiniBarChartComponent {
  @Input({ required: true }) data: MiniBarDatum[] = [];
  @Input() ariaLabel = 'Gráfico de barras';

  private max(): number {
    return Math.max(1, ...(this.data?.map((d) => d.value) ?? [1]));
  }

  pct(v: number): number {
    return Math.round((Math.max(0, v) / this.max()) * 100);
  }
}

