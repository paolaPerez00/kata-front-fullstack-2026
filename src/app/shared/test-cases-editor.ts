import { Component, model } from '@angular/core';
import { TestCase } from '../core/models/question.model';

@Component({
  selector: 'app-test-cases-editor',
  template: `
    @for (tc of value(); track $index; let i = $index) {
      <div class="card case">
        <div class="row">
          <strong>Caso {{ i + 1 }}</strong>
          <label class="check"><input type="checkbox" [checked]="tc.isHidden" (change)="patch(i, { isHidden: $any($event.target).checked })" /> Oculto</label>
          <span class="spacer"></span>
          <button type="button" class="btn" (click)="remove(i)" [disabled]="value().length === 1">Quitar</button>
        </div>
        <div class="cols">
          <div class="field">
            <span class="label">Input (stdin)</span>
            <textarea rows="2" [value]="tc.input" (input)="patch(i, { input: $any($event.target).value })"></textarea>
          </div>
          <div class="field">
            <span class="label">Output esperado <b class="req">*</b></span>
            <textarea rows="2" [value]="tc.expectedOutput" (input)="patch(i, { expectedOutput: $any($event.target).value })"></textarea>
          </div>
        </div>
      </div>
    }
    <button type="button" class="btn" (click)="add()">+ Agregar caso de prueba</button>`,
  styles: `
    .case { margin-bottom: .75rem; }
    .cols { display: grid; gap: .75rem; grid-template-columns: 1fr 1fr; margin-top: .5rem; }
    .field { display: flex; flex-direction: column; gap: .3rem; }
    .label { font-size: .85rem; color: var(--muted); }
    .req { color: var(--bad); }
    .check { display: flex; align-items: center; gap: .35rem; font-size: .9rem; }
    textarea { font-family: 'JetBrains Mono', Menlo, monospace; resize: vertical; }
    @media (max-width: 640px) { .cols { grid-template-columns: 1fr; } }
  `,
})
export class TestCasesEditor {
  readonly value = model<TestCase[]>([]);

  protected add() { this.value.update(list => [...list, { input: '', expectedOutput: '', isHidden: false }]); }
  protected remove(i: number) { this.value.update(list => list.filter((_, idx) => idx !== i)); }
  protected patch(i: number, change: Partial<TestCase>) {
    this.value.update(list => list.map((tc, idx) => (idx === i ? { ...tc, ...change } : tc)));
  }
}
