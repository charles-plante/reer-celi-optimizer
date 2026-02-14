import { Component, Input, Output, EventEmitter } from '@angular/core';
import { TaxService } from '../../services/tax.service';

@Component({
  selector: 'app-slider',
  standalone: true,
  template: `
    <div style="margin-bottom: 20px">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px">
        <label style="font-size: 13px; color: #8a96a3; font-family: 'DM Sans', sans-serif; letter-spacing: 0.03em; text-transform: uppercase; font-weight: 600; display: flex; align-items: center; gap: 8px">
          @if (icon) { <span style="font-size: 16px">{{ icon }}</span> }
          {{ label }}
        </label>
        <span style="font-size: 22px; font-weight: 700; font-family: 'Space Mono', monospace; color: #e8edf2">
          {{ taxService.formatMoney(value) }}
        </span>
      </div>
      <input
        type="range"
        [min]="min"
        [max]="max"
        [step]="step"
        [value]="value"
        (input)="onInput($event)"
        style="width: 100%; accent-color: #f59e0b; height: 6px; cursor: pointer"
      />
      <div style="display: flex; justify-content: space-between; font-size: 11px; color: #555e6a; font-family: 'DM Sans', sans-serif; margin-top: 4px">
        <span>{{ taxService.formatMoney(min) }}</span>
        <span>{{ taxService.formatMoney(max) }}</span>
      </div>
    </div>
  `,
})
export class SliderComponent {
  @Input() label = '';
  @Input() value = 0;
  @Input() min = 0;
  @Input() max = 100;
  @Input() step = 1000;
  @Input() icon = '';
  @Output() valueChange = new EventEmitter<number>();

  constructor(public taxService: TaxService) {}

  onInput(event: Event) {
    const target = event.target as HTMLInputElement;
    this.valueChange.emit(Number(target.value));
  }
}
