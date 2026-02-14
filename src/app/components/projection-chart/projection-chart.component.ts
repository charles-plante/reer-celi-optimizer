import { Component, Input, OnChanges } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { StatCardComponent } from '../stat-card/stat-card.component';
import { ProjectionData, TaxService } from '../../services/tax.service';

@Component({
  selector: 'app-projection-chart',
  standalone: true,
  imports: [StatCardComponent],
  template: `
    <div>
      <div style="font-size: 13px; font-weight: 600; color: #8a96a3; font-family: 'DM Sans', sans-serif; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 12px">
        Projection sur {{ years }} ans (rendement 7%)
      </div>
      <div style="position: relative; padding: 0 10px" [innerHTML]="chartSvg"></div>

      <div style="display: flex; gap: 16px; margin-top: 12px; justify-content: center">
        <div style="display: flex; align-items: center; gap: 6px; font-size: 12px; color: #8a96a3; font-family: 'DM Sans', sans-serif">
          <div style="width: 12px; height: 12px; border-radius: 3px; background: linear-gradient(135deg, #60a5fa, #3b82f6)"></div>
          REER
        </div>
        <div style="display: flex; align-items: center; gap: 6px; font-size: 12px; color: #8a96a3; font-family: 'DM Sans', sans-serif">
          <div style="width: 12px; height: 12px; border-radius: 3px; background: linear-gradient(135deg, #34d399, #10b981)"></div>
          CELI
        </div>
      </div>

      <div style="display: flex; gap: 10px; margin-top: 16px">
        <app-stat-card
          [small]="true"
          label="REER an 10 (brut)"
          [value]="taxService.formatMoney(lastReer)"
          [sublabel]="'Net après impôt ~' + taxService.formatMoney(lastReer * 0.65)"
        ></app-stat-card>
        <app-stat-card
          [small]="true"
          [accent]="true"
          label="CELI an 10 (net)"
          [value]="taxService.formatMoney(lastCeli)"
          sublabel="100% libre d'impôt"
        ></app-stat-card>
      </div>
    </div>
  `,
})
export class ProjectionChartComponent implements OnChanges {
  @Input() reerContrib = 0;
  @Input() celiContrib = 0;
  @Input() years = 10;

  chartSvg: SafeHtml = '';
  data: ProjectionData[] = [];
  lastReer = 0;
  lastCeli = 0;

  constructor(
    public taxService: TaxService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnChanges() {
    this.data = this.taxService.getProjectionData(this.reerContrib, this.celiContrib, this.years);
    this.lastReer = this.data[this.years]?.reer || 0;
    this.lastCeli = this.data[this.years]?.celi || 0;
    this.buildChart();
  }

  buildChart() {
    const chartHeight = 200;
    const maxVal = Math.max(...this.data.map(d => Math.max(d.reer, d.celi, 1)));
    const totalWidth = (this.years + 1) * 50 + 20;

    let gridLines = '';
    for (const pct of [0, 0.25, 0.5, 0.75, 1]) {
      const y = chartHeight - pct * chartHeight;
      gridLines += `<line x1="0" y1="${y}" x2="${(this.years + 1) * 50}" y2="${y}" stroke="rgba(255,255,255,0.05)" stroke-dasharray="4,4"/>`;
      gridLines += `<text x="-4" y="${y + 4}" text-anchor="end" fill="#555e6a" font-size="9" font-family="'Space Mono', monospace">${this.taxService.formatMoney(pct * maxVal)}</text>`;
    }

    let bars = '';
    const barW = 16;
    for (let i = 0; i < this.data.length; i++) {
      const d = this.data[i];
      const x = i * 50 + 15;
      const reerH = (d.reer / maxVal) * chartHeight;
      const celiH = (d.celi / maxVal) * chartHeight;

      bars += `<rect x="${x - barW - 1}" y="${chartHeight - reerH}" width="${barW}" height="${Math.max(reerH, 0)}" rx="3" fill="url(#reerGrad)" opacity="0.85"/>`;
      bars += `<rect x="${x + 1}" y="${chartHeight - celiH}" width="${barW}" height="${Math.max(celiH, 0)}" rx="3" fill="url(#celiGrad)" opacity="0.85"/>`;
      bars += `<text x="${x}" y="${chartHeight + 16}" text-anchor="middle" fill="#6b7785" font-size="10" font-family="'DM Sans', sans-serif">An ${d.year}</text>`;
    }

    const svg = `<svg width="100%" height="${chartHeight + 40}" viewBox="0 0 ${totalWidth} ${chartHeight + 40}" style="overflow: visible">
      <defs>
        <linearGradient id="reerGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#60a5fa"/>
          <stop offset="100%" stop-color="#3b82f6"/>
        </linearGradient>
        <linearGradient id="celiGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#34d399"/>
          <stop offset="100%" stop-color="#10b981"/>
        </linearGradient>
      </defs>
      ${gridLines}
      ${bars}
    </svg>`;

    this.chartSvg = this.sanitizer.bypassSecurityTrustHtml(svg);
  }
}
