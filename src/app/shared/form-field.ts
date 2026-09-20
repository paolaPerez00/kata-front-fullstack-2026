import { Component, input } from '@angular/core';

@Component({
  selector: 'app-form-field',
  template: `
    <div class="field">
      <label class="label" [attr.for]="for()">{{ label() }}@if (required()) { <b class="req">*</b> }</label>
      <ng-content />
      @if (error()) { <small class="error" role="alert">{{ error() }}</small> }
      @else if (hint()) { <small class="muted">{{ hint() }}</small> }
    </div>`,
  styles: `
    .field { display: flex; flex-direction: column; gap: .3rem; }
    .label { font-weight: 600; font-size: .9rem; }
    .req { color: var(--bad); }
  `,
})
export class FormField {
  readonly label = input.required<string>();
  readonly for = input<string>();
  readonly required = input(false);
  readonly error = input('');
  readonly hint = input('');
}
