import { Component, input, model } from '@angular/core';
import { Question } from '../core/models/question.model';
import { LANGUAGE_LABELS } from './format';

@Component({
  selector: 'app-question-picker',
  template: `
    @if (!questions().length) { <p class="muted">No hay preguntas registradas todavía.</p> }
    @for (q of questions(); track q.id) {
      <label class="card item">
        <input type="checkbox" [checked]="selected().includes(q.id)" (change)="toggle(q.id)" />
        <div>
          <div>{{ q.title }}</div>
          <small class="muted">{{ q.description }}</small>
          <div class="row tags">
            @for (l of q.allowedLanguages; track l) { <span class="badge">{{ labels[l] }}</span> }
          </div>
        </div>
        <span class="spacer"></span>
        <span class="badge">{{ q.points }} pts</span>
      </label>
    }`,
  styles: `
    .item { display: flex; align-items: flex-start; gap: .75rem; margin-bottom: .5rem; cursor: pointer; padding: .9rem 1rem; }
    .item input { margin-top: .3rem; }
    .tags { margin-top: .35rem; gap: .35rem; }
  `,
})
export class QuestionPicker {
  readonly questions = input.required<Question[]>();
  readonly selected = model<string[]>([]);
  protected labels = LANGUAGE_LABELS;

  protected toggle(id: string) {
    this.selected.update(ids => (ids.includes(id) ? ids.filter(x => x !== id) : [...ids, id]));
  }
}
