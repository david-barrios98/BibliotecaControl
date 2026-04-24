import { Component, Input } from '@angular/core';

export interface MiniDonutSlice {
  label: string;
  value: number;
  color: string;
}

@Component({
  selector: 'app-mini-donut',
  standalone: true,
  template: `
    <div class="md">
      <svg class="md__svg" viewBox="0 0 42 42" role="img" [attr.aria-label]="ariaLabel">
        <circle class="md__track" cx="21" cy="21" r="15.9155"></circle>
        @for (s of normalized(); track s.label) {
          <circle
            class="md__seg"
            cx="21"
            cy="21"
            r="15.9155"
            [attr.stroke]="s.color"
            [attr.stroke-dasharray]="s.dash"
            [attr.stroke-dashoffset]="s.offset"
          ></circle>
        }
      </svg>
      <div class="md__legend">
        @for (s of slices; track s.label) {
          <div class="md__legrow">
            <span class="md__dot" [style.background]="s.color" aria-hidden="true"></span>
            <span class="md__leglbl">{{ s.label }}</span>
            <span class="md__legval">{{ s.value }}</span>
          </div>
        }
      </div>
    </div>
  `,
  styles: `
    .md { display: grid; grid-template-columns: 96px 1fr; gap: .9rem; align-items: center; }
    .md__svg { width: 96px; height: 96px; }
    .md__track { fill: transparent; stroke: rgba(21,25,34,.08); stroke-width: 8; }
    .md__seg { fill: transparent; stroke-width: 8; transform: rotate(-90deg); transform-origin: 50% 50%; }
    .md__legend { display: grid; gap: .35rem; }
    .md__legrow { display: grid; grid-template-columns: 14px 1fr auto; gap: .5rem; align-items: center; }
    .md__dot { width: 10px; height: 10px; border-radius: 999px; }
    .md__leglbl { font-size: .85rem; color: var(--bc-color-text); }
    .md__legval { font-size: .85rem; font-weight: 900; color: var(--bc-color-muted); text-align: right; min-width: 2.5rem; }
    @media (max-width: 520px) { .md { grid-template-columns: 1fr; } .md__svg { justify-self: start; } }
  `,
})
export class MiniDonutComponent {
  @Input({ required: true }) slices: MiniDonutSlice[] = [];
  @Input() ariaLabel = 'Gráfico circular';

  private total(): number {
    return Math.max(0, this.slices.reduce((a, b) => a + Math.max(0, b.value), 0));
  }

  normalized(): { label: string; dash: string; offset: number; color: string }[] {
    const total = this.total();
    if (total <= 0) return [];
    // Circumference normalized to 100 for dasharray math.
    let acc = 25; // start offset so first segment begins at top (circle uses -90deg)
    return this.slices
      .filter((s) => s.value > 0)
      .map((s) => {
        const pct = (s.value / total) * 100;
        const dash = `${pct} ${100 - pct}`;
        const offset = 100 - acc;
        acc += pct;
        return { label: s.label, dash, offset, color: s.color };
      });
  }
}

