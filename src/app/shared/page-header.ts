import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-page-header',
  imports: [RouterLink],
  template: `
    @if (backLink()) { <a [routerLink]="backLink()">← {{ backLabel() }}</a> }
    <div class="row head">
      <div>
        <h1>{{ title() }}</h1>
        @if (subtitle()) { <p class="muted">{{ subtitle() }}</p> }
      </div>
      <span class="spacer"></span>
      <ng-content select="[actions]" />
    </div>`,
  styles: `.head { margin-top: .5rem; align-items: flex-start; }`,
})
export class PageHeader {
  readonly title = input.required<string>();
  readonly subtitle = input('');
  readonly backLink = input<string>();
  readonly backLabel = input('Volver');
}
