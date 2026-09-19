import { Component, input } from '@angular/core';

/** Modal simple con contenido proyectado. El contenido va en <ng-content>, los botones en [actions]. */
@Component({
  selector: 'app-modal',
  template: `
    <div class="backdrop">
      <div class="dialog" role="dialog" aria-modal="true" [attr.aria-label]="title()">
        <h2>{{ icon() }} {{ title() }}</h2>
        <div class="body"><ng-content /></div>
        <div class="actions"><ng-content select="[actions]" /></div>
      </div>
    </div>`,
  styles: `
    .backdrop { position: fixed; inset: 0; background: rgb(15 23 42 / .6); display: grid; place-items: center; z-index: 1000; padding: 1rem; }
    .dialog { background: #fff; border-radius: 14px; padding: 1.5rem; max-width: 480px; width: 100%; box-shadow: 0 20px 50px rgb(0 0 0 / .3); }
    h2 { margin: 0 0 .75rem; }
    .body { color: #1c2333; line-height: 1.5; }
    .actions { display: flex; justify-content: flex-end; gap: .75rem; margin-top: 1.25rem; }
  `,
})
export class Modal {
  readonly title = input.required<string>();
  readonly icon = input('');
}
