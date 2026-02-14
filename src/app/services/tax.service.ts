import { Injectable } from '@angular/core';

export interface TaxBracket {
  min: number;
  max: number;
  rate: number;
}

export interface CombinedBracket {
  min: number;
  max: number;
  rate: number;
  inRange: boolean;
  deducted: number;
}

export interface YearSavings {
  year: number;
  contrib: number;
  saved: number;
  avgRate: number;
}

export interface ProjectionData {
  year: number;
  reer: number;
  celi: number;
  reerNet: number;
  celiNet: number;
}

export interface FamilyAllowanceResult {
  ccbBefore: number;
  ccbAfter: number;
  ccbGain: number;
  qcBefore: number;
  qcAfter: number;
  qcGain: number;
  totalGain: number;
}

export interface CreditImpact {
  name: string;
  before: number;
  after: number;
  gain: number;
}

export interface CreditsImpactResult {
  credits: CreditImpact[];
  totalGain: number;
}

@Injectable({ providedIn: 'root' })
export class TaxService {
  readonly FEDERAL_BRACKETS: TaxBracket[] = [
    { min: 0, max: 55867, rate: 0.15 },
    { min: 55867, max: 111733, rate: 0.205 },
    { min: 111733, max: 154906, rate: 0.26 },
    { min: 154906, max: 220000, rate: 0.29 },
    { min: 220000, max: Infinity, rate: 0.33 },
  ];

  readonly QC_BRACKETS: TaxBracket[] = [
    { min: 0, max: 51780, rate: 0.14 },
    { min: 51780, max: 103545, rate: 0.19 },
    { min: 103545, max: 126000, rate: 0.24 },
    { min: 126000, max: Infinity, rate: 0.2575 },
  ];

  readonly FEDERAL_BASIC_PERSONAL = 15705;
  readonly QC_BASIC_PERSONAL = 17183;
  readonly FEDERAL_ABATEMENT_QC = 0.165;

  calcTax(income: number, brackets: TaxBracket[], personalAmount: number): number {
    let tax = 0;
    const taxable = Math.max(0, income - personalAmount);
    for (const b of brackets) {
      if (taxable <= b.min) break;
      const upper = Math.min(taxable, b.max);
      tax += (upper - b.min) * b.rate;
    }
    return tax;
  }

  calcFederalTax(income: number): number {
    const base = this.calcTax(income, this.FEDERAL_BRACKETS, this.FEDERAL_BASIC_PERSONAL);
    return base * (1 - this.FEDERAL_ABATEMENT_QC);
  }

  calcQCTax(income: number): number {
    return this.calcTax(income, this.QC_BRACKETS, this.QC_BASIC_PERSONAL);
  }

  calcTotalTax(income: number): number {
    return this.calcFederalTax(income) + this.calcQCTax(income);
  }

  getMarginalRate(income: number): number {
    const delta = 1;
    const tax1 = this.calcTotalTax(income);
    const tax2 = this.calcTotalTax(income + delta);
    return (tax2 - tax1) / delta;
  }

  getBracketBreakdown(income: number, reerContrib: number): CombinedBracket[] {
    const before = income;
    const after = income - reerContrib;

    const fedBrackets = this.FEDERAL_BRACKETS.map(b => ({
      ...b,
      adjustedRate: b.rate * (1 - this.FEDERAL_ABATEMENT_QC),
    }));

    const allBreakpoints = new Set<number>([0]);
    fedBrackets.forEach(b => {
      allBreakpoints.add(b.min + this.FEDERAL_BASIC_PERSONAL);
      allBreakpoints.add(b.max === Infinity ? 999999999 : b.max + this.FEDERAL_BASIC_PERSONAL);
    });
    this.QC_BRACKETS.forEach(b => {
      allBreakpoints.add(b.min + this.QC_BASIC_PERSONAL);
      allBreakpoints.add(b.max === Infinity ? 999999999 : b.max + this.QC_BASIC_PERSONAL);
    });

    const sorted = [...allBreakpoints].sort((a, b) => a - b);
    const combinedBrackets: CombinedBracket[] = [];

    for (let i = 0; i < sorted.length - 1; i++) {
      const low = sorted[i];
      const high = sorted[i + 1];
      if (high <= 0) continue;

      const fedTaxable = Math.max(0, low - this.FEDERAL_BASIC_PERSONAL);
      const fedBracket = fedBrackets.find(b => fedTaxable >= b.min && fedTaxable < b.max);
      const qcTaxable = Math.max(0, low - this.QC_BASIC_PERSONAL);
      const qcBracket = this.QC_BRACKETS.find(b => qcTaxable >= b.min && qcTaxable < b.max);

      const combinedRate =
        (fedBracket ? fedBracket.adjustedRate : 0) +
        (qcBracket ? qcBracket.rate : 0);

      if (combinedRate > 0 && low < before) {
        let deducted = 0;
        if (low >= after && high <= before) {
          deducted = high - low;
        } else if (low < after && high > after) {
          deducted = high - after;
        } else if (low < before && high > before) {
          deducted = before - low;
        } else if (low >= after && low < before) {
          deducted = Math.min(high, before) - Math.max(low, after);
        }

        combinedBrackets.push({
          min: low,
          max: Math.min(high, 999999999),
          rate: combinedRate,
          inRange: low < before && high > after,
          deducted,
        });
      }
    }

    return combinedBrackets.filter(b => b.min < before);
  }

  getProjectionData(reerContrib: number, celiContrib: number, years: number = 10): ProjectionData[] {
    const annualReturn = 0.07;
    const data: ProjectionData[] = [];
    let reerBalance = 0;
    let celiBalance = 0;

    for (let y = 0; y <= years; y++) {
      if (y > 0) {
        reerBalance = (reerBalance + reerContrib) * (1 + annualReturn);
        celiBalance = (celiBalance + celiContrib) * (1 + annualReturn);
      }

      const reerWithdrawTax = 0.35;
      const reerNetValue = reerBalance * (1 - reerWithdrawTax);

      data.push({
        year: y,
        reer: reerBalance,
        celi: celiBalance,
        reerNet: reerNetValue,
        celiNet: celiBalance,
      });
    }

    return data;
  }

  getOptimalSplit(salary: number, locatif: number, totalContrib: number, reerSpace: number, celiSpace: number) {
    const totalIncome = salary + locatif;

    const targetBrackets = [
      { threshold: 126000, rate: 0.505 },
      { threshold: 103545, rate: 0.475 },
      { threshold: 55867, rate: 0.37 },
    ];

    let optimalReer = 0;
    let reason = '';

    for (const tb of targetBrackets) {
      if (totalIncome > tb.threshold) {
        const toDeduct = totalIncome - tb.threshold;
        optimalReer = Math.min(toDeduct, totalContrib, reerSpace);
        reason = `Descendre sous ${this.formatMoney(tb.threshold)} (palier ${this.formatPct(tb.rate)})`;
        break;
      }
    }

    const optimalCeli = Math.min(totalContrib - optimalReer, celiSpace);
    optimalReer = Math.min(optimalReer, reerSpace);
    const taxSaved = this.calcTotalTax(totalIncome) - this.calcTotalTax(totalIncome - optimalReer);

    return { optimalReer, optimalCeli, reason, taxSaved };
  }

  // ===== ALLOCATIONS FAMILIALES =====

  // Canada Child Benefit (ACE) 2024-2025
  readonly CCB_MAX_UNDER6 = 7997;
  readonly CCB_MAX_6TO17 = 6748;
  readonly CCB_THRESHOLD1 = 37487;
  readonly CCB_THRESHOLD2 = 81222;

  // Clawback rates by number of children: [between T1-T2, above T2]
  readonly CCB_CLAWBACK: Record<number, [number, number]> = {
    1: [0.07, 0.032],
    2: [0.135, 0.057],
    3: [0.19, 0.08],
    4: [0.23, 0.095],
  };

  // Quebec Family Allowance (Soutien aux enfants) 2024
  readonly QC_FA_MAX_PER_CHILD = 2923;
  readonly QC_FA_THRESHOLD_COUPLE = 59369;
  readonly QC_FA_CLAWBACK_RATE = 0.04;

  calcCCB(familyIncome: number, childrenUnder6: number, children6to17: number): number {
    const totalChildren = childrenUnder6 + children6to17;
    if (totalChildren === 0) return 0;

    const maxBenefit = (childrenUnder6 * this.CCB_MAX_UNDER6) + (children6to17 * this.CCB_MAX_6TO17);
    const clawbackKey = Math.min(totalChildren, 4);
    const [rate1, rate2] = this.CCB_CLAWBACK[clawbackKey];

    let reduction = 0;
    if (familyIncome > this.CCB_THRESHOLD1) {
      const excessT1 = Math.min(familyIncome, this.CCB_THRESHOLD2) - this.CCB_THRESHOLD1;
      reduction += excessT1 * rate1;
    }
    if (familyIncome > this.CCB_THRESHOLD2) {
      const excessT2 = familyIncome - this.CCB_THRESHOLD2;
      reduction += excessT2 * rate2;
    }

    return Math.max(0, maxBenefit - reduction);
  }

  calcQCFamilyAllowance(familyIncome: number, totalChildren: number): number {
    if (totalChildren === 0) return 0;

    const maxBenefit = totalChildren * this.QC_FA_MAX_PER_CHILD;

    if (familyIncome <= this.QC_FA_THRESHOLD_COUPLE) {
      return maxBenefit;
    }

    const excess = familyIncome - this.QC_FA_THRESHOLD_COUPLE;
    const reduction = excess * this.QC_FA_CLAWBACK_RATE;
    return Math.max(0, maxBenefit - reduction);
  }

  calcFamilyAllowanceImpact(
    familyIncome: number,
    reerContrib: number,
    childrenUnder6: number,
    children6to17: number
  ): FamilyAllowanceResult {
    const totalChildren = childrenUnder6 + children6to17;
    const incomeAfter = familyIncome - reerContrib;

    const ccbBefore = this.calcCCB(familyIncome, childrenUnder6, children6to17);
    const ccbAfter = this.calcCCB(incomeAfter, childrenUnder6, children6to17);
    const ccbGain = ccbAfter - ccbBefore;

    const qcBefore = this.calcQCFamilyAllowance(familyIncome, totalChildren);
    const qcAfter = this.calcQCFamilyAllowance(incomeAfter, totalChildren);
    const qcGain = qcAfter - qcBefore;

    return {
      ccbBefore,
      ccbAfter,
      ccbGain,
      qcBefore,
      qcAfter,
      qcGain,
      totalGain: ccbGain + qcGain,
    };
  }

  // ===== CRÉDIT TPS/TVH (2024-2025) =====
  readonly GST_BASE_ADULT = 340;
  readonly GST_SINGLE_SUPPLEMENT = 179;
  readonly GST_PER_CHILD = 179;
  readonly GST_THRESHOLD = 44681;
  readonly GST_REDUCTION_RATE = 0.05;

  calcGSTCredit(familyIncome: number, isCouple: boolean, numChildren: number): number {
    let maxCredit: number;
    if (isCouple) {
      maxCredit = this.GST_BASE_ADULT * 2;
    } else {
      maxCredit = this.GST_BASE_ADULT + this.GST_SINGLE_SUPPLEMENT;
    }
    maxCredit += numChildren * this.GST_PER_CHILD;

    if (familyIncome <= this.GST_THRESHOLD) return maxCredit;

    const reduction = (familyIncome - this.GST_THRESHOLD) * this.GST_REDUCTION_RATE;
    return Math.max(0, maxCredit - reduction);
  }

  // ===== CRÉDIT D'IMPÔT POUR SOLIDARITÉ QC (2024-2025) =====
  readonly SOLIDARITY_QST_SINGLE = 340;
  readonly SOLIDARITY_QST_COUPLE = 680;
  readonly SOLIDARITY_HOUSING = 731;
  readonly SOLIDARITY_THRESHOLD_SINGLE = 24185;
  readonly SOLIDARITY_THRESHOLD_COUPLE = 39335;
  readonly SOLIDARITY_REDUCTION_RATE = 0.06;

  calcSolidarityCredit(familyIncome: number, isCouple: boolean, isRenter: boolean): number {
    const qstComponent = isCouple ? this.SOLIDARITY_QST_COUPLE : this.SOLIDARITY_QST_SINGLE;
    const housingComponent = isRenter ? this.SOLIDARITY_HOUSING : 0;
    const maxCredit = qstComponent + housingComponent;

    const threshold = isCouple ? this.SOLIDARITY_THRESHOLD_COUPLE : this.SOLIDARITY_THRESHOLD_SINGLE;
    if (familyIncome <= threshold) return maxCredit;

    const reduction = (familyIncome - threshold) * this.SOLIDARITY_REDUCTION_RATE;
    return Math.max(0, maxCredit - reduction);
  }

  // ===== ALLOCATION CANADIENNE POUR LES TRAVAILLEURS (ACT/CWB) 2024 =====
  readonly CWB_MAX_SINGLE = 1518;
  readonly CWB_MAX_FAMILY = 2616;
  readonly CWB_PHASE_IN_START = 3000;
  readonly CWB_PHASE_IN_RATE = 0.275;
  readonly CWB_PHASE_OUT_SINGLE = 24975;
  readonly CWB_PHASE_OUT_FAMILY = 28494;
  readonly CWB_PHASE_OUT_RATE = 0.15;

  calcCWB(workIncome: number, familyIncome: number, isCouple: boolean): number {
    const maxBenefit = isCouple ? this.CWB_MAX_FAMILY : this.CWB_MAX_SINGLE;
    const phaseOutStart = isCouple ? this.CWB_PHASE_OUT_FAMILY : this.CWB_PHASE_OUT_SINGLE;

    if (workIncome <= this.CWB_PHASE_IN_START) return 0;

    const phaseIn = Math.min(
      (workIncome - this.CWB_PHASE_IN_START) * this.CWB_PHASE_IN_RATE,
      maxBenefit
    );

    if (familyIncome <= phaseOutStart) return phaseIn;

    const phaseOut = (familyIncome - phaseOutStart) * this.CWB_PHASE_OUT_RATE;
    return Math.max(0, phaseIn - phaseOut);
  }

  // ===== PRIME AU TRAVAIL QC (2024) =====
  readonly WP_MAX_SINGLE = 1175;
  readonly WP_MAX_COUPLE = 1833;
  readonly WP_PHASE_IN_SINGLE = 2400;
  readonly WP_PHASE_IN_COUPLE = 3600;
  readonly WP_PHASE_IN_RATE = 0.0988;
  readonly WP_PHASE_OUT_SINGLE = 12613;
  readonly WP_PHASE_OUT_COUPLE = 19209;
  readonly WP_PHASE_OUT_RATE = 0.10;

  calcWorkPremium(workIncome: number, familyIncome: number, isCouple: boolean): number {
    const maxBenefit = isCouple ? this.WP_MAX_COUPLE : this.WP_MAX_SINGLE;
    const phaseInStart = isCouple ? this.WP_PHASE_IN_COUPLE : this.WP_PHASE_IN_SINGLE;
    const phaseOutStart = isCouple ? this.WP_PHASE_OUT_COUPLE : this.WP_PHASE_OUT_SINGLE;

    if (workIncome <= phaseInStart) return 0;

    const phaseIn = Math.min(
      (workIncome - phaseInStart) * this.WP_PHASE_IN_RATE,
      maxBenefit
    );

    if (familyIncome <= phaseOutStart) return phaseIn;

    const phaseOut = (familyIncome - phaseOutStart) * this.WP_PHASE_OUT_RATE;
    return Math.max(0, phaseIn - phaseOut);
  }

  // ===== CALCUL COMBINÉ DE TOUS LES CRÉDITS =====

  calcAllCreditsImpact(
    familyIncome: number,
    workIncome: number,
    reerContrib: number,
    isCouple: boolean,
    isRenter: boolean,
    numChildren: number
  ): CreditsImpactResult {
    const incomeAfter = familyIncome - reerContrib;

    const credits: CreditImpact[] = [
      {
        name: 'Crédit TPS/TVH',
        before: this.calcGSTCredit(familyIncome, isCouple, numChildren),
        after: this.calcGSTCredit(incomeAfter, isCouple, numChildren),
        gain: 0,
      },
      {
        name: 'Crédit de solidarité (QC)',
        before: this.calcSolidarityCredit(familyIncome, isCouple, isRenter),
        after: this.calcSolidarityCredit(incomeAfter, isCouple, isRenter),
        gain: 0,
      },
      {
        name: 'Allocation canadienne pour travailleurs',
        before: this.calcCWB(workIncome, familyIncome, isCouple),
        after: this.calcCWB(workIncome, incomeAfter, isCouple),
        gain: 0,
      },
      {
        name: 'Prime au travail (QC)',
        before: this.calcWorkPremium(workIncome, familyIncome, isCouple),
        after: this.calcWorkPremium(workIncome, incomeAfter, isCouple),
        gain: 0,
      },
    ];

    credits.forEach(c => c.gain = c.after - c.before);

    return {
      credits,
      totalGain: credits.reduce((sum, c) => sum + c.gain, 0),
    };
  }

  formatMoney(n: number): string {
    return n.toLocaleString('fr-CA', {
      style: 'currency',
      currency: 'CAD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  }

  formatPct(n: number): string {
    return (n * 100).toFixed(1) + ' %';
  }
}
