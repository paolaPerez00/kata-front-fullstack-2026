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
  protected correct = computed(() => this.rows().filter(row => row.ok).length);
  protected incorrect = computed(() => this.rows().length - this.correct());
  protected elapsed = computed(() => {
    const attempt = this.attempts.get(this.id());
    const assessment = this.assessment();
    return attempt && assessment ? formatClock(this.attempts.elapsedMs(attempt, assessment.durationMinutes)) : '—';
  });

  protected rows = computed(() => {
    const assessment = this.assessment();
    const results = this.results();
    if (!assessment || !results) return [];

    return (assessment.questions ?? []).map(question => {
      const submission = results.submissions.find(s => s.questionId === question.id);
      const passed = submission?.results.filter(t => t.passed).length ?? 0;
      const total = submission?.results.length ?? 0;
      return { question, submission, passed, total, ok: !!submission && passed === total };
    });
  });

  constructor() {
    effect(() => {
      const id = this.id();
      forkJoin([this.api.get(id), this.api.results(id)]).subscribe({
        next: ([assessment, results]) => {
          this.assessment.set(assessment);
          this.results.set(results);
          this.fillUnansweredIfFinished(id, assessment, results);
        },
        error: () => this.error.set('No se pudieron cargar los resultados.'),
      });
    });
  }

  private fillUnansweredIfFinished(assessmentId: string, assessment: Assessment, results: AssessmentResults) {
    const finished = !!this.attempts.get(assessmentId)?.finishedAt;
    const questions = assessment.questions ?? [];
    const answeredQuestionIds = new Set(results.submissions.map(s => s.questionId));
    if (!finished || answeredQuestionIds.size >= questions.length) return;

    this.grading.set(true);
    this.autoGrade
      .submitUnanswered(assessmentId, questions, answeredQuestionIds)
      .pipe(switchMap(() => this.api.results(assessmentId)))
      .subscribe({
        next: r => { this.results.set(r); this.grading.set(false); },
        error: () => this.grading.set(false),
      });
  }
}
