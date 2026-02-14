import { Component, Input, OnChanges } from '@angular/core';
import { TaxService, FamilyAllowanceResult } from '../../services/tax.service';

@Component({
  selector: 'app-family-allowance',
  standalone: true,
  template: `
    <div class="fa-container">
      <div class="fa-header">
        <span class="fa-icon">👶</span>
        IMPACT SUR LES ALLOCATIONS FAMILIALES
      </div>
      <div class="fa-subtitle">
        Effet de la déduction REER sur l'ACE fédérale et le Soutien aux enfants du Québec
      </div>

      <!-- Children selector -->
      <div class="children-selector">
        <div class="child-group">
          <label class="child-label">Enfants &lt; 6 ans</label>
          <div class="child-buttons">
            @for (n of [0,1,2,3,4]; track n) {
              <button
                [class]="childrenUnder6 === n ? 'child-btn active' : 'child-btn'"
                (click)="onUnder6Change(n)"
              >{{ n }}</button>
            }
          </div>
        </div>
        <div class="child-group">
          <label class="child-label">Enfants 6-17 ans</label>
          <div class="child-buttons">
            @for (n of [0,1,2,3,4]; track n) {
              <button
                [class]="children6to17 === n ? 'child-btn active' : 'child-btn'"
                (click)="on6to17Change(n)"
              >{{ n }}</button>
            }
          </div>
        </div>
      </div>

      @if (totalChildren > 0) {
        <!-- CCB Federal -->
        <div class="fa-section">
          <div class="fa-section-title">Allocation canadienne pour enfants (ACE)</div>
          <div class="fa-row">
            <div class="fa-item">
              <div class="fa-item-label">Sans REER</div>
              <div class="fa-item-value">{{ taxService.formatMoney(result.ccbBefore) }}/an</div>
            </div>
            <div class="fa-arrow">→</div>
            <div class="fa-item">
              <div class="fa-item-label">Avec REER</div>
              <div class="fa-item-value highlight">{{ taxService.formatMoney(result.ccbAfter) }}/an</div>
            </div>
            <div class="fa-gain" [class.positive]="result.ccbGain > 0">
              {{ result.ccbGain > 0 ? '+' : '' }}{{ taxService.formatMoney(result.ccbGain) }}
            </div>
          </div>
        </div>

        <!-- QC Family Allowance -->
        <div class="fa-section">
          <div class="fa-section-title">Soutien aux enfants du Québec</div>
          <div class="fa-row">
            <div class="fa-item">
              <div class="fa-item-label">Sans REER</div>
              <div class="fa-item-value">{{ taxService.formatMoney(result.qcBefore) }}/an</div>
            </div>
            <div class="fa-arrow">→</div>
            <div class="fa-item">
              <div class="fa-item-label">Avec REER</div>
              <div class="fa-item-value highlight">{{ taxService.formatMoney(result.qcAfter) }}/an</div>
            </div>
            <div class="fa-gain" [class.positive]="result.qcGain > 0">
              {{ result.qcGain > 0 ? '+' : '' }}{{ taxService.formatMoney(result.qcGain) }}
            </div>
          </div>
        </div>

        <!-- Total gain -->
        <div class="fa-total">
          <div class="fa-total-row">
            <span class="fa-total-label">Gain total en allocations grâce au REER</span>
            <span class="fa-total-value">+{{ taxService.formatMoney(result.totalGain) }}/an</span>
          </div>
          <div class="fa-total-sub">
            Cela s'ajoute au retour d'impôt — le REER a un effet double pour les familles
          </div>
        </div>
      } @else {
        <div class="fa-no-children">
          Sélectionnez le nombre d'enfants pour voir l'impact sur vos allocations
        </div>
      }
    </div>
  `,
  styles: [`
    .fa-container {
      background: rgba(255,255,255,0.02);
      border: 1px solid rgba(255,255,255,0.06);
      border-radius: 16px;
      padding: 20px;
    }
    .fa-header {
      font-size: 14px;
      font-weight: 700;
      color: #a78bfa;
      font-family: 'DM Sans', sans-serif;
      margin-bottom: 4px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .fa-icon { font-size: 18px; }
    .fa-subtitle {
      font-size: 11px;
      color: #6b7785;
      margin-bottom: 16px;
    }
    .children-selector {
      display: flex;
      gap: 20px;
      margin-bottom: 16px;
    }
    .child-group { flex: 1; }
    .child-label {
      font-size: 11px;
      color: #8a96a3;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      font-weight: 600;
      display: block;
      margin-bottom: 8px;
    }
    .child-buttons {
      display: flex;
      gap: 4px;
    }
    .child-btn {
      width: 36px;
      height: 32px;
      border-radius: 8px;
      border: 1px solid rgba(255,255,255,0.1);
      background: rgba(255,255,255,0.03);
      color: #8a96a3;
      font-size: 14px;
      font-weight: 600;
      font-family: 'Space Mono', monospace;
      cursor: pointer;
      transition: all 0.2s;
    }
    .child-btn:hover {
      border-color: rgba(167,139,250,0.4);
      color: #a78bfa;
    }
    .child-btn.active {
      background: rgba(167,139,250,0.15);
      border-color: rgba(167,139,250,0.5);
      color: #a78bfa;
    }
    .fa-section {
      margin-bottom: 12px;
      padding: 12px;
      background: rgba(255,255,255,0.02);
      border-radius: 10px;
      border: 1px solid rgba(255,255,255,0.04);
    }
    .fa-section-title {
      font-size: 11px;
      color: #8a96a3;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      font-weight: 600;
      margin-bottom: 8px;
    }
    .fa-row {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .fa-item { flex: 1; }
    .fa-item-label {
      font-size: 10px;
      color: #555e6a;
      margin-bottom: 2px;
    }
    .fa-item-value {
      font-size: 15px;
      font-weight: 700;
      font-family: 'Space Mono', monospace;
      color: #e8edf2;
    }
    .fa-item-value.highlight { color: #a78bfa; }
    .fa-arrow {
      color: #555e6a;
      font-size: 18px;
    }
    .fa-gain {
      font-size: 14px;
      font-weight: 700;
      font-family: 'Space Mono', monospace;
      color: #555e6a;
      min-width: 80px;
      text-align: right;
    }
    .fa-gain.positive { color: #34d399; }
    .fa-total {
      margin-top: 4px;
      padding: 14px;
      background: linear-gradient(135deg, rgba(167,139,250,0.1), rgba(167,139,250,0.03));
      border: 1px solid rgba(167,139,250,0.25);
      border-radius: 10px;
    }
    .fa-total-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .fa-total-label {
      font-size: 13px;
      font-weight: 600;
      color: #8a96a3;
    }
    .fa-total-value {
      font-size: 20px;
      font-weight: 700;
      color: #a78bfa;
      font-family: 'Space Mono', monospace;
    }
    .fa-total-sub {
      font-size: 11px;
      color: #6b7785;
      margin-top: 6px;
    }
    .fa-no-children {
      padding: 20px;
      text-align: center;
      color: #555e6a;
      font-size: 13px;
    }
  `],
})
export class FamilyAllowanceComponent implements OnChanges {
  @Input() familyIncome = 0;
  @Input() reerContrib = 0;

  childrenUnder6 = 0;
  children6to17 = 0;

  result: FamilyAllowanceResult = {
    ccbBefore: 0, ccbAfter: 0, ccbGain: 0,
    qcBefore: 0, qcAfter: 0, qcGain: 0,
    totalGain: 0,
  };

  constructor(public taxService: TaxService) {}

  get totalChildren(): number {
    return this.childrenUnder6 + this.children6to17;
  }

  ngOnChanges() {
    this.recalculate();
  }

  onUnder6Change(n: number) {
    this.childrenUnder6 = n;
    this.recalculate();
  }

  on6to17Change(n: number) {
    this.children6to17 = n;
    this.recalculate();
  }

  recalculate() {
    this.result = this.taxService.calcFamilyAllowanceImpact(
      this.familyIncome,
      this.reerContrib,
      this.childrenUnder6,
      this.children6to17
    );
  }
}
