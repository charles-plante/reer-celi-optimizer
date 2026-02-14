import { Component, Input } from '@angular/core';
import { CombinedBracket, TaxService } from '../../services/tax.service';

@Component({
  selector: 'app-bracket-bar',
  standalone: true,
  template: `
    <div style="margin-top: 12px; margin-bottom: 4px">
      <div style="position: relative; height: 48px; border-radius: 8px; overflow: hidden; background: rgba(255,255,255,0.03)">
        @for (b of brackets; track $index) {
          <div [style]="getBracketStyle(b, $index)">
            @if (getWidth(b) > 8) {
              <span style="font-size: 13px; font-weight: 700; color: #e8edf2; font-family: 'Space Mono', monospace">
                {{ taxService.formatPct(b.rate) }}
              </span>
              <span style="font-size: 9px; color: #8a96a3; font-family: 'DM Sans', sans-serif">
                {{ taxService.formatMoney(b.min) }}+
              </span>
            }
          </div>
        }
        <!-- Hatched zone -->
        <div [style]="hatchedStyle"></div>
      </div>
      <div style="display: flex; justify-content: space-between; margin-top: 6px; font-size: 10px; font-family: 'DM Sans', sans-serif">
        <span style="color: #f59e0b">◄ Après REER: {{ taxService.formatMoney(afterIncome) }}</span>
        <span style="color: #ef4444">Avant: {{ taxService.formatMoney(income) }} ►</span>
      </div>
    </div>
  `,
})
export class BracketBarComponent {
  @Input() brackets: CombinedBracket[] = [];
  @Input() income = 0;
  @Input() afterIncome = 0;

  constructor(public taxService: TaxService) {}

  private readonly colors = [
    'rgba(52, 211, 153, 0.25)',
    'rgba(96, 165, 250, 0.25)',
    'rgba(251, 191, 36, 0.25)',
    'rgba(248, 113, 113, 0.3)',
    'rgba(236, 72, 153, 0.3)',
  ];

  private readonly borderColors = [
    'rgba(52, 211, 153, 0.5)',
    'rgba(96, 165, 250, 0.5)',
    'rgba(251, 191, 36, 0.5)',
    'rgba(248, 113, 113, 0.6)',
    'rgba(236, 72, 153, 0.6)',
  ];

  get maxIncome(): number {
    return Math.max(this.income * 1.1, 180000);
  }

  getWidth(b: CombinedBracket): number {
    return ((Math.min(b.max, this.maxIncome) - b.min) / this.maxIncome) * 100;
  }

  getBracketStyle(b: CombinedBracket, i: number): string {
    const left = (b.min / this.maxIncome) * 100;
    const width = this.getWidth(b);
    return `position: absolute; left: ${left}%; width: ${width}%; height: 100%; background: ${this.colors[i % this.colors.length]}; border-right: 1px solid ${this.borderColors[i % this.borderColors.length]}; display: flex; align-items: center; justify-content: center; flex-direction: column; transition: all 0.3s ease`;
  }

  get hatchedStyle(): string {
    const left = (this.afterIncome / this.maxIncome) * 100;
    const width = ((this.income - this.afterIncome) / this.maxIncome) * 100;
    return `position: absolute; left: ${left}%; width: ${width}%; height: 100%; background: repeating-linear-gradient(45deg, rgba(245,158,11,0.15), rgba(245,158,11,0.15) 4px, transparent 4px, transparent 8px); border-left: 2px solid #f59e0b; border-right: 2px solid #ef4444; transition: all 0.3s ease`;
  }
}
