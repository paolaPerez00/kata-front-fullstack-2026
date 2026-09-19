import { DecimalPipe } from '@angular/common';
import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { QuestionsService } from '../../core/services/questions.service';
import { ExecutionService } from '../../core/services/execution.service';
import { SubmissionsService } from '../../core/services/submissions.service';
import { AssessmentsService } from '../../core/services/assessments.service';
import { AttemptService } from '../../core/services/attempt.service';
import { Language, Question } from '../../core/models/question.model';
import { RunResult } from '../../core/models/execution.model';
import { Submission } from '../../core/models/submission.model';
import { MonacoEditor } from '../../shared/monaco-editor';
import { Modal } from '../../shared/modal';
import { ExamGuard } from '../../shared/exam-guard';
import { LANGUAGE_LABELS, buildTemplate, formatClock } from '../../shared/format';

@Component({
  selector: 'app-code-editor',
  imports: [DecimalPipe, FormsModule, RouterLink, MonacoEditor, Modal, ExamGuard],
  templateUrl: './code-editor.html',
  styleUrl: './code-editor.scss',
})
export class CodeEditor {
  private questionsApi = inject(QuestionsService);
  private assessmentsApi = inject(AssessmentsService);
  private executionApi = inject(ExecutionService);
  private submissionsApi = inject(SubmissionsService);
  private attempts = inject(AttemptService);
  private router = inject(Router);

  readonly assessmentId = input.required<string>();
  readonly questionId = input.required<string>();

  protected labels = LANGUAGE_LABELS;
  protected question = signal<Question | null>(null);
  protected language = signal<Language>('javascript');
  protected code = signal('');
  protected stdin = signal('');
  protected running = signal(false);
  protected submitting = signal(false);
  protected runResult = signal<RunResult | null>(null);
  protected submission = signal<Submission | null>(null);
  protected error = signal('');
  private durationMinutes = signal(0);
  private drafts = new Map<Language, string>();

  protected remaining = computed(() => {
    const d = this.durationMinutes();
    return d ? this.attempts.remainingMs(this.attempts.get(this.assessmentId()), d, this.attempts.now()) : null;
  });
  protected clock = computed(() => (this.remaining() === null ? '--:--' : formatClock(this.remaining()!)));
  protected expired = computed(() => this.remaining() === 0);
  protected busy = computed(() => this.running() || this.submitting());

  protected verdict = computed(() => {
    const r = this.runResult();
    if (!r || !r.compilation.success || r.timedOut || r.exitCode !== 0) return null;
    const sample = this.question()?.testCases?.find(t => t.input.trim() === this.ranInput.trim());
    if (!sample) return { kind: 'unknown' as const };
    const ok = r.stdout.trim() === sample.expectedOutput.trim();
    return { kind: ok ? ('ok' as const) : ('fail' as const), expected: sample.expectedOutput.trim() };
  });
  private ranInput = '';
  private visibleIds = computed(() => new Set((this.question()?.testCases ?? []).map(t => t.id)));
  protected isVisible(testCaseId: string) { return this.visibleIds().has(testCaseId); }
  protected passed = computed(() => this.submission()?.results.filter(r => r.passed).length ?? 0);

  private autoSubmitted = false;

  constructor() {
    effect(() => {
      if (!this.expired()) return;
      this.attempts.finish(this.assessmentId(), this.durationMinutes());
      if (!this.autoSubmitted && !this.submission() && !this.submitting()) {
        this.autoSubmitted = true;
        this.submit();
      }
    });
    effect(() => {
      const id = this.questionId();
      this.drafts.clear();
      this.runResult.set(null);
      this.submission.set(null);
      this.autoSubmitted = false;
      this.questionsApi.get(id).subscribe({
        next: q => {
          this.question.set(q);
          this.stdin.set(q.testCases?.find(t => !t.isHidden)?.input ?? '');
          this.selectLanguage(q.allowedLanguages[0] ?? 'javascript', false);
        },
        error: () => this.error.set('No se pudo cargar la pregunta.'),
      });
    });
    effect(() => {
      this.assessmentsApi.get(this.assessmentId()).subscribe(a => this.durationMinutes.set(a.durationMinutes));
    });
  }

  protected selectLanguage(lang: Language, saveCurrent = true) {
    if (saveCurrent) this.drafts.set(this.language(), this.code());
    this.language.set(lang);
    this.code.set(this.drafts.get(lang) ?? buildTemplate(lang, this.stdin()));
  }

  protected goToResults() {
    this.router.navigate(['/assessments', this.assessmentId(), 'results']);
  }

  protected run() {
    this.running.set(true);
    this.runResult.set(null);
    this.ranInput = this.stdin();
    this.executionApi.run({ code: this.code(), language: this.language(), input: this.stdin() }).subscribe({
      next: r => { this.runResult.set(r); this.running.set(false); },
      error: e => { this.error.set(e?.error?.message ?? 'Error al ejecutar el código.'); this.running.set(false); },
    });
  }

  protected submit() {
    this.submitting.set(true);
    this.submission.set(null);
    this.submissionsApi.submit({
      assessmentId: this.assessmentId(), questionId: this.questionId(), code: this.code(), language: this.language(),
    }).subscribe({
      next: s => { this.submission.set(s); this.submitting.set(false); },
      error: e => { this.error.set(e?.error?.message ?? 'Error al enviar la respuesta.'); this.submitting.set(false); },
    });
  }
}
