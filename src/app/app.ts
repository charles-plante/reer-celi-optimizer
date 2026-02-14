import { Component } from '@angular/core';
import { SliderComponent } from './components/slider/slider.component';
import { StatCardComponent } from './components/stat-card/stat-card.component';
import { BracketBarComponent } from './components/bracket-bar/bracket-bar.component';
import { ProjectionChartComponent } from './components/projection-chart/projection-chart.component';
import { OptimalSplitComponent } from './components/optimal-split/optimal-split.component';
import { FamilyAllowanceComponent } from './components/family-allowance/family-allowance.component';
import { TaxService, CombinedBracket, YearSavings } from './services/tax.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    SliderComponent,
    StatCardComponent,
    BracketBarComponent,
    ProjectionChartComponent,
    OptimalSplitComponent,
    FamilyAllowanceComponent,
  ],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  salary = 130000;
  locatif = 7500;
  reerContrib = 25000;
  celiContrib = 7000;
  reerSpace = 50000;
  celiSpace = 105000;
  years = 2;

  constructor(public taxService: TaxService) {}

  get totalIncome(): number {
    return this.salary + this.locatif;
  }

  get incomeAfterReer(): number {
    return this.totalIncome - this.reerContrib;
  }

  get taxBefore(): number {
    return this.taxService.calcTotalTax(this.totalIncome);
  }

  get taxAfter(): number {
    return this.taxService.calcTotalTax(this.incomeAfterReer);
  }

  get taxSaved(): number {
    return this.taxBefore - this.taxAfter;
  }

  get marginalBefore(): number {
    return this.taxService.getMarginalRate(this.totalIncome);
  }

  get marginalAfter(): number {
    return this.taxService.getMarginalRate(this.incomeAfterReer);
  }

  get avgDeductionRate(): number {
    return this.reerContrib > 0 ? this.taxSaved / this.reerContrib : 0;
  }

  get brackets(): CombinedBracket[] {
    return this.taxService.getBracketBreakdown(this.totalIncome, this.reerContrib);
  }

  get reerPerYear(): number {
    return this.years > 0
      ? Math.min(this.reerContrib / this.years, this.reerSpace / this.years)
      : this.reerContrib;
  }

  get maxReerContrib(): number {
    return Math.min(this.reerSpace, this.totalIncome);
  }

  get maxCeliContrib(): number {
    return Math.min(this.celiSpace, 50000);
  }

  get savingsPerYear(): YearSavings[] {
    const result: YearSavings[] = [];
    let remaining = this.reerContrib;
    const perYear = this.reerPerYear;

    for (let y = 1; y <= Math.max(this.years, 1); y++) {
      const thisYear = Math.min(perYear, remaining);
      remaining -= thisYear;
      const saved =
        this.taxService.calcTotalTax(this.totalIncome) -
        this.taxService.calcTotalTax(this.totalIncome - thisYear);
      result.push({
        year: y,
        contrib: thisYear,
        saved,
        avgRate: thisYear > 0 ? saved / thisYear : 0,
      });
    }
    return result;
  }

  get totalSavedMultiYear(): number {
    return this.savingsPerYear.reduce((s, y) => s + y.saved, 0);
  }

  get spreadDiff(): number {
    return this.totalSavedMultiYear - this.taxSaved;
  }

  get spreadBetter(): boolean {
    return this.totalSavedMultiYear > this.taxSaved;
  }

  get spreadWorse(): boolean {
    return this.totalSavedMultiYear < this.taxSaved;
  }
}
