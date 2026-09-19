import { DecimalPipe } from '@angular/common';
import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AssessmentsService } from '../../core/services/assessments.service';
import { Attempt, AttemptService } from '../../core/services/attempt.service';
import { AutoGradeService } from '../../core/services/auto-grade.service';
import { Assessment, AssessmentResults } from '../../core/models/assessment.model';
import { formatClock } from '../../shared/format';
import { Modal } from '../../shared/modal';

@Component({
  selector: 'app-assessment-detail',
  imports: [DecimalPipe, RouterLink, Modal],
  templateUrl: './assessment-detail.html',
  styleUrl: './assessment-detail.scss',
})
export class AssessmentDetail {
  private api = inject(AssessmentsService);
  private attempts = inject(AttemptService);
  private autoGrade = inject(AutoGradeService);
  private router = inject(Router);

  readonly id = input.required<string>();
  protected assessment = signal<Assessment | null>(null);
  protected results = signal<AssessmentResults | null>(null);
  protected error = signal('');
  protected confirmingStart = signal(false);
  protected timeUp = signal(false);
  private attempt = signal<Attempt | null>(null);

  protected remaining = computed(() => {
    const a = this.assessment();
    if (!a) return null;
    return this.attempts.remainingMs(this.attempt(), a.durationMinutes, this.attempts.now());
  });
  protected clock = computed(() => {
    const r = this.remaining();
    return r === null ? `${this.assessment()?.durationMinutes ?? 0}:00` : formatClock(r);
  });
  protected maxScore = computed(() => (this.assessment()?.questions ?? []).reduce((sum, q) => sum + q.points, 0));
  protected started = computed(() => this.attempt() !== null);
  protected finished = computed(() => !!this.attempt()?.finishedAt || this.remaining() === 0);
  protected status = computed(() => (this.finished() ? 'Finalizado' : this.started() ? 'En curso' : 'Pendiente'));

  constructor() {
    effect(() => {
      const a = this.assessment();
      if (a && this.attempt() && !this.attempt()!.finishedAt && this.remaining() === 0) {
        this.attempt.set(this.attempts.finish(this.id(), a.durationMinutes));
        this.timeUp.set(true);
        this.fillUnanswered(a);
      }
    });
    effect(() => {
      const id = this.id();
      this.attempt.set(this.attempts.get(id));
      this.api.get(id).subscribe({ next: a => this.assessment.set(a), error: () => this.error.set('No se pudo cargar el assessment.') });
      this.api.results(id).subscribe({ next: r => this.results.set(r), error: () => this.results.set(null) });
    });
  }

  private fillUnanswered(assessment: Assessment) {
    const answered = new Set((this.results()?.submissions ?? []).map(s => s.questionId));
    this.autoGrade.submitUnanswered(this.id(), assessment.questions ?? [], answered).subscribe({
      next: () => this.api.results(this.id()).subscribe(r => this.results.set(r)),
    });
  }

  protected scoreOf(questionId: string): number | null {
    const subs = this.results()?.submissions.filter(s => s.questionId === questionId) ?? [];
    return subs.length ? Math.max(...subs.map(s => s.score)) : null;
  }

  protected start() {
    this.confirmingStart.set(false);
    this.attempt.set(this.attempts.start(this.id()));
  }

  protected goToResults() {
    this.router.navigate(['/assessments', this.id(), 'results']);
  }

  protected finish() {
    this.attempts.finish(this.id(), this.assessment()?.durationMinutes ?? 0);
    const a = this.assessment();
    if (a) this.fillUnanswered(a);
    this.router.navigate(['/assessments', this.id(), 'results']);
  }
}
