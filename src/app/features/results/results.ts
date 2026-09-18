import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { AssessmentsService } from '../../core/services/assessments.service';
import { AttemptService } from '../../core/services/attempt.service';
import { Assessment, AssessmentResults } from '../../core/models/assessment.model';
import { formatClock } from '../../shared/format';

@Component({
  selector: 'app-results',
  imports: [RouterLink],
  templateUrl: './results.html',
  styleUrl: './results.scss',
})
export class Results {
  private api = inject(AssessmentsService);
  private attempts = inject(AttemptService);

  readonly id = input.required<string>();
  protected assessment = signal<Assessment | null>(null);
  protected results = signal<AssessmentResults | null>(null);
  protected error = signal('');

  protected maxScore = computed(() => (this.assessment()?.questions ?? []).reduce((sum, q) => sum + q.points, 0));
  protected percent = computed(() => {
    const max = this.maxScore();
    return max ? Math.round(((this.results()?.totalScore ?? 0) / max) * 100) : 0;
  });
  protected correct = computed(() => this.rows().filter(r => r.ok).length);
  protected incorrect = computed(() => this.rows().length - this.correct());
  protected elapsed = computed(() => {
    const at = this.attempts.get(this.id()), a = this.assessment();
    return at && a ? formatClock(this.attempts.elapsedMs(at, a.durationMinutes)) : '—';
  });
  protected rows = computed(() => {
    const a = this.assessment(), r = this.results();
    if (!a || !r) return [];
    return (a.questions ?? []).map(q => {
      const subs = r.submissions.filter(s => s.questionId === q.id);
      const last = subs.at(-1);
      const passed = last?.results.filter(t => t.passed).length ?? 0;
      return { q, last, passed, total: last?.results.length ?? 0, ok: !!last && passed === last.results.length };
    });
  });

  constructor() {
    effect(() => {
      forkJoin([this.api.get(this.id()), this.api.results(this.id())]).subscribe({
        next: ([a, r]) => { this.assessment.set(a); this.results.set(r); },
        error: () => this.error.set('No se pudieron cargar los resultados.'),
      });
    });
  }
}
