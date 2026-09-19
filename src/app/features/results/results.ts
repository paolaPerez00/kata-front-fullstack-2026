import { DecimalPipe } from '@angular/common';
import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin, switchMap } from 'rxjs';
import { AssessmentsService } from '../../core/services/assessments.service';
import { AttemptService } from '../../core/services/attempt.service';
import { AutoGradeService } from '../../core/services/auto-grade.service';
import { Assessment, AssessmentResults } from '../../core/models/assessment.model';
import { formatClock } from '../../shared/format';

@Component({
  selector: 'app-results',
  imports: [DecimalPipe, RouterLink],
  templateUrl: './results.html',
  styleUrl: './results.scss',
})
export class Results {
  private api = inject(AssessmentsService);
  private attempts = inject(AttemptService);
  private autoGrade = inject(AutoGradeService);

  readonly id = input.required<string>();
  protected assessment = signal<Assessment | null>(null);
  protected results = signal<AssessmentResults | null>(null);
  protected error = signal('');
  protected grading = signal(false);

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
      const id = this.id();
      forkJoin([this.api.get(id), this.api.results(id)]).subscribe({
        next: ([a, r]) => {
          this.assessment.set(a);
          this.results.set(r);
          this.fillUnansweredIfFinished(id, a, r);
        },
        error: () => this.error.set('No se pudieron cargar los resultados.'),
      });
    });
  }

  private fillUnansweredIfFinished(assessmentId: string, assessment: Assessment, results: AssessmentResults) {
    const finished = !!this.attempts.get(assessmentId)?.finishedAt;
    const questions = assessment.questions ?? [];
    const answered = new Set(results.submissions.map(s => s.questionId));
    if (!finished || answered.size >= questions.length) return;

    this.grading.set(true);
    this.autoGrade
      .submitUnanswered(assessmentId, questions, answered)
      .pipe(switchMap(() => this.api.results(assessmentId)))
      .subscribe({
        next: r => { this.results.set(r); this.grading.set(false); },
        error: () => this.grading.set(false),
      });
  }
}
