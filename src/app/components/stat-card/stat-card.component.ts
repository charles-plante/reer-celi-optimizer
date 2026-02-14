import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-stat-card',
  standalone: true,
  template: `
    <div [style]="containerStyle">
      <div style="font-size: 11px; color: #8a96a3; font-family: 'DM Sans', sans-serif; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600; margin-bottom: 6px">
        {{ label }}
      </div>
      <div [style]="valueStyle">
        {{ value }}
      </div>
      @if (sublabel) {
        <div style="font-size: 11px; color: #6b7785; font-family: 'DM Sans', sans-serif; margin-top: 4px">
          {{ sublabel }}
        </div>
      }
    </div>
  `,
})
export class StatCardComponent {
  @Input() label = '';
  @Input() value = '';
  @Input() sublabel = '';
  @Input() accent = false;
  @Input() small = false;

  get containerStyle(): string {
    const bg = this.accent
      ? 'linear-gradient(135deg, #f59e0b22, #f59e0b08)'
      : 'rgba(255,255,255,0.03)';
    const border = this.accent
      ? '1px solid #f59e0b44'
      : '1px solid rgba(255,255,255,0.06)';
    const padding = this.small ? '12px 14px' : '16px 20px';
    const minWidth = this.small ? '120px' : '150px';
    return `background: ${bg}; border: ${border}; border-radius: 12px; padding: ${padding}; flex: 1; min-width: ${minWidth}`;
  }

  get valueStyle(): string {
    const size = this.small ? '18px' : '24px';
    const color = this.accent ? '#f59e0b' : '#e8edf2';
    return `font-size: ${size}; font-weight: 700; font-family: 'Space Mono', monospace; color: ${color}`;
  }
}
