import { Component, Input, OnChanges } from '@angular/core';
import { TaxService, CreditsImpactResult, CreditImpact } from '../../services/tax.service';

@Component({
  selector: 'app-credits-impact',
  standalone: true,
  template: `
    <div class="ci-container">
      <div class="ci-header">
        <span class="ci-icon">💰</span>
        IMPACT SUR LES CRÉDITS D'IMPÔT
      </div>
      <div class="ci-subtitle">
        Effet de la déduction REER sur les crédits et prestations basés sur le revenu
      </div>

      <!-- Situation selector -->
      <div class="situation-selector">
        <div class="toggle-group">
          <label class="toggle-label">Situation</label>
          <div class="toggle-buttons">
            <button
              [class]="!isCouple ? 'toggle-btn active' : 'toggle-btn'"
              (click)="onCoupleChange(false)"
            >Seul(e)</button>
            <button
              [class]="isCouple ? 'toggle-btn active' : 'toggle-btn'"
              (click)="onCoupleChange(true)"
            >En couple</button>
          </div>
        </div>
        <div class="toggle-group">
          <label class="toggle-label">Logement</label>
          <div class="toggle-buttons">
            <button
              [class]="isRenter ? 'toggle-btn active' : 'toggle-btn'"
              (click)="onRenterChange(true)"
            >Locataire</button>
            <button
              [class]="!isRenter ? 'toggle-btn active' : 'toggle-btn'"
              (click)="onRenterChange(false)"
            >Propriétaire</button>
          </div>
        </div>
      </div>

      <!-- Spouse income (when couple) -->
      @if (isCouple) {
        <div class="spouse-income">
          <label class="toggle-label">Revenu du conjoint(e)</label>
          <div class="spouse-input-row">
            <input
              type="range"
              [min]="0"
              [max]="200000"
              [step]="5000"
              [value]="spouseIncome"
              (input)="onSpouseIncomeChange(+$any($event.target).value)"
              class="spouse-slider"
            />
            <span class="spouse-value">{{ taxService.formatMoney(spouseIncome) }}</span>
          </div>
          <div class="spouse-hint">Revenu familial combiné: {{ taxService.formatMoney(totalFamilyIncome) }}</div>
        </div>
      }

      <!-- Credits list -->
      @for (credit of result.credits; track credit.name) {
        <div class="ci-section" [class.inactive]="credit.before === 0 && credit.after === 0">
          <div class="ci-section-title">{{ credit.name }}</div>
          @if (credit.before === 0 && credit.after === 0) {
            <div class="ci-na">Non applicable à ce niveau de revenu</div>
          } @else {
            <div class="ci-row">
              <div class="ci-item">
                <div class="ci-item-label">Sans REER</div>
                <div class="ci-item-value">{{ taxService.formatMoney(credit.before) }}/an</div>
              </div>
              <div class="ci-arrow">→</div>
              <div class="ci-item">
                <div class="ci-item-label">Avec REER</div>
                <div class="ci-item-value highlight">{{ taxService.formatMoney(credit.after) }}/an</div>
              </div>
              <div class="ci-gain" [class.positive]="credit.gain > 0">
                {{ credit.gain > 0 ? '+' : '' }}{{ taxService.formatMoney(credit.gain) }}
              </div>
            </div>
          }
        </div>
      }

      <!-- Total -->
      @if (result.totalGain > 0) {
        <div class="ci-total">
          <div class="ci-total-row">
            <span class="ci-total-label">Gain total en crédits grâce au REER</span>
            <span class="ci-total-value">+{{ taxService.formatMoney(result.totalGain) }}/an</span>
          </div>
          <div class="ci-total-sub">
            Ces montants s'ajoutent au retour d'impôt direct et aux allocations familiales
          </div>
        </div>
      } @else {
        <div class="ci-no-impact">
          Aucun gain sur les crédits — votre revenu dépasse les seuils de récupération
        </div>
      }
    </div>
  `,
  styles: [`
    .ci-container {
      background: rgba(255,255,255,0.02);
      border: 1px solid rgba(255,255,255,0.06);
      border-radius: 16px;
      padding: 20px;
    }
    .ci-header {
      font-size: 14px;
      font-weight: 700;
      color: #38bdf8;
      font-family: 'DM Sans', sans-serif;
      margin-bottom: 4px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .ci-icon { font-size: 18px; }
    .ci-subtitle {
      font-size: 11px;
      color: #6b7785;
      margin-bottom: 16px;
    }
    .situation-selector {
      display: flex;
      gap: 20px;
      margin-bottom: 16px;
    }
    .toggle-group { flex: 1; }
    .toggle-label {
      font-size: 11px;
      color: #8a96a3;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      font-weight: 600;
      display: block;
      margin-bottom: 8px;
    }
    .toggle-buttons {
      display: flex;
      gap: 4px;
    }
    .toggle-btn {
      flex: 1;
      height: 32px;
      border-radius: 8px;
      border: 1px solid rgba(255,255,255,0.1);
      background: rgba(255,255,255,0.03);
      color: #8a96a3;
      font-size: 12px;
      font-weight: 600;
      font-family: 'DM Sans', sans-serif;
      cursor: pointer;
      transition: all 0.2s;
    }
    .toggle-btn:hover {
      border-color: rgba(56,189,248,0.4);
      color: #38bdf8;
    }
    .toggle-btn.active {
      background: rgba(56,189,248,0.15);
      border-color: rgba(56,189,248,0.5);
      color: #38bdf8;
    }
    .spouse-income {
      margin-bottom: 16px;
      padding: 12px;
      background: rgba(56,189,248,0.05);
      border: 1px solid rgba(56,189,248,0.15);
      border-radius: 10px;
    }
    .spouse-input-row {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .spouse-slider {
      flex: 1;
      accent-color: #38bdf8;
      height: 6px;
      cursor: pointer;
    }
    .spouse-value {
      font-size: 14px;
      font-weight: 700;
      font-family: 'Space Mono', monospace;
      color: #38bdf8;
      min-width: 90px;
      text-align: right;
    }
    .spouse-hint {
      font-size: 11px;
      color: #6b7785;
      margin-top: 6px;
    }
    .ci-section {
      margin-bottom: 8px;
      padding: 12px;
      background: rgba(255,255,255,0.02);
      border-radius: 10px;
      border: 1px solid rgba(255,255,255,0.04);
    }
    .ci-section.inactive {
      opacity: 0.5;
    }
    .ci-section-title {
      font-size: 11px;
      color: #8a96a3;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      font-weight: 600;
      margin-bottom: 8px;
    }
    .ci-na {
      font-size: 11px;
      color: #555e6a;
      font-style: italic;
    }
    .ci-row {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .ci-item { flex: 1; }
    .ci-item-label {
      font-size: 10px;
      color: #555e6a;
      margin-bottom: 2px;
    }
    .ci-item-value {
      font-size: 15px;
      font-weight: 700;
      font-family: 'Space Mono', monospace;
      color: #e8edf2;
    }
    .ci-item-value.highlight { color: #38bdf8; }
    .ci-arrow {
      color: #555e6a;
      font-size: 18px;
    }
    .ci-gain {
      font-size: 14px;
      font-weight: 700;
      font-family: 'Space Mono', monospace;
      color: #555e6a;
      min-width: 80px;
      text-align: right;
    }
    .ci-gain.positive { color: #34d399; }
    .ci-total {
      margin-top: 4px;
      padding: 14px;
      background: linear-gradient(135deg, rgba(56,189,248,0.1), rgba(56,189,248,0.03));
      border: 1px solid rgba(56,189,248,0.25);
      border-radius: 10px;
    }
    .ci-total-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .ci-total-label {
      font-size: 13px;
      font-weight: 600;
      color: #8a96a3;
    }
    .ci-total-value {
      font-size: 20px;
      font-weight: 700;
      color: #38bdf8;
      font-family: 'Space Mono', monospace;
    }
    .ci-total-sub {
      font-size: 11px;
      color: #6b7785;
      margin-top: 6px;
    }
    .ci-no-impact {
      padding: 14px;
      text-align: center;
      color: #555e6a;
      font-size: 13px;
      background: rgba(255,255,255,0.02);
      border-radius: 10px;
      border: 1px solid rgba(255,255,255,0.04);
    }
  `],
})
export class CreditsImpactComponent implements OnChanges {
  @Input() familyIncome = 0;
  @Input() workIncome = 0;
  @Input() reerContrib = 0;

  isCouple = false;
  isRenter = true;
  spouseIncome = 50000;

  result: CreditsImpactResult = { credits: [], totalGain: 0 };

  constructor(public taxService: TaxService) {}

  get totalFamilyIncome(): number {
    return this.familyIncome + (this.isCouple ? this.spouseIncome : 0);
  }

  ngOnChanges() {
    this.recalculate();
  }

  onCoupleChange(value: boolean) {
    this.isCouple = value;
    this.recalculate();
  }

  onRenterChange(value: boolean) {
    this.isRenter = value;
    this.recalculate();
  }

  onSpouseIncomeChange(value: number) {
    this.spouseIncome = value;
    this.recalculate();
  }

  recalculate() {
    this.result = this.taxService.calcAllCreditsImpact(
      this.totalFamilyIncome,
      this.workIncome,
      this.reerContrib,
      this.isCouple,
      this.isRenter,
      0
    );
  }
}
