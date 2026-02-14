import { Component, Input, OnChanges } from '@angular/core';
import { StatCardComponent } from '../stat-card/stat-card.component';
import { TaxService } from '../../services/tax.service';

@Component({
  selector: 'app-optimal-split',
  standalone: true,
  imports: [StatCardComponent],
  template: `
    <div style="background: linear-gradient(135deg, rgba(245,158,11,0.08), rgba(245,158,11,0.02)); border: 1px solid rgba(245,158,11,0.2); border-radius: 14px; padding: 20px; margin-top: 16px">
      <div style="font-size: 14px; font-weight: 700; color: #f59e0b; font-family: 'DM Sans', sans-serif; margin-bottom: 4px; display: flex; align-items: center; gap: 8px">
        <span style="font-size: 18px">⚡</span>
        RÉPARTITION OPTIMALE SUGGÉRÉE
      </div>
      <div style="font-size: 11px; color: #8a96a3; font-family: 'DM Sans', sans-serif; margin-bottom: 16px">
        Objectif : {{ reason }}
      </div>
      <div style="display: flex; gap: 10px">
        <app-stat-card
          [small]="true"
          label="REER recommandé"
          [value]="taxService.formatMoney(optimalReer)"
          [sublabel]="'Retour d\\'impôt: ' + taxService.formatMoney(taxSaved)"
        ></app-stat-card>
        <app-stat-card
          [small]="true"
          [accent]="true"
          label="CELI recommandé"
          [value]="taxService.formatMoney(optimalCeli)"
          sublabel="Croissance libre d'impôt"
        ></app-stat-card>
      </div>
    </div>
  `,
})
export class OptimalSplitComponent implements OnChanges {
  @Input() salary = 0;
  @Input() locatif = 0;
  @Input() totalContrib = 0;
  @Input() reerSpace = 0;
  @Input() celiSpace = 0;

  optimalReer = 0;
  optimalCeli = 0;
  reason = '';
  taxSaved = 0;

  constructor(public taxService: TaxService) {}

  ngOnChanges() {
    const result = this.taxService.getOptimalSplit(
      this.salary,
      this.locatif,
      this.totalContrib,
      this.reerSpace,
      this.celiSpace
    );
    this.optimalReer = result.optimalReer;
    this.optimalCeli = result.optimalCeli;
    this.reason = result.reason;
    this.taxSaved = result.taxSaved;
  }
}
