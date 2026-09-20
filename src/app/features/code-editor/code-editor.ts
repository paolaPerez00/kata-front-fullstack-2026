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
import { DEMO_NAME } from '../../core/demo-assessment';
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
  protected isDemo = signal(false);
  /** Ids de las preguntas del assessment, en el mismo orden que se muestran en el detalle. */
  private questionOrder = signal<string[]>([]);
  /** Código sin enviar por lenguaje, para no perderlo al cambiar de lenguaje en la misma pregunta. */
  private drafts = new Map<Language, string>();
  /** Input con el que se ejecutó por última vez (puede diferir del textarea si el candidato lo edita después de "Ejecutar"). */
  private lastRunInput = '';
  /** Evita reenviar por segunda vez cuando el tiempo se agota (el efecto de abajo corre en cada tick del reloj). */
  private autoSubmitted = false;

  protected remaining = computed(() => {
    const durationMinutes = this.durationMinutes();
    return durationMinutes
      ? this.attempts.remainingMs(this.attempts.get(this.assessmentId()), durationMinutes, this.attempts.now())
      : null;
  });
  protected clock = computed(() => {
    const remainingMs = this.remaining();
    return remainingMs === null ? '--:--' : formatClock(remainingMs);
  });
  protected expired = computed(() => this.remaining() === 0);
  protected busy = computed(() => this.running() || this.submitting());

  /** Posición (1-based) de la pregunta actual dentro del assessment, y el total, para "Pregunta 2 de 5". */
  protected position = computed(() => {
    const order = this.questionOrder();
    const index = order.indexOf(this.questionId());
    return { current: index + 1, total: order.length };
  });
  protected previousQuestionId = computed(() => this.siblingQuestionId(-1));
  protected nextQuestionId = computed(() => this.siblingQuestionId(1));

  /** Compara la última ejecución con el ejemplo visible cuyo input coincide, para no confundir "compiló" con "es correcta". */
  protected verdict = computed(() => {
    const runResult = this.runResult();
    if (!runResult || !runResult.compilation.success || runResult.timedOut || runResult.exitCode !== 0) return null;

    const sample = this.question()?.testCases?.find(t => t.input.trim() === this.lastRunInput.trim());
    if (!sample) return { kind: 'unknown' as const };

    const matchesExpected = runResult.stdout.trim() === sample.expectedOutput.trim();
    return { kind: matchesExpected ? ('ok' as const) : ('fail' as const), expected: sample.expectedOutput.trim() };
  });

  private visibleTestCaseIds = computed(() => new Set((this.question()?.testCases ?? []).map(t => t.id)));
  protected isVisible(testCaseId: string) { return this.visibleTestCaseIds().has(testCaseId); }
  protected passed = computed(() => this.submission()?.results.filter(r => r.passed).length ?? 0);

  constructor() {
    effect(() => {
      if (!this.expired()) return;
      this.attempts.finish(this.assessmentId(), this.durationMinutes());
      // Se acabó el tiempo: registra lo que había en el editor, aunque no se haya pulsado "Enviar respuesta".
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
        next: question => {
          this.question.set(question);
          this.stdin.set(question.testCases?.find(t => !t.isHidden)?.input ?? '');
          this.selectLanguage(question.allowedLanguages[0] ?? 'javascript', false);
        },
        error: () => this.error.set('No se pudo cargar la pregunta.'),
      });
    });
    effect(() => {
      this.assessmentsApi.get(this.assessmentId()).subscribe(a => {
        this.durationMinutes.set(a.durationMinutes);
        this.isDemo.set(a.name === DEMO_NAME);
        this.questionOrder.set((a.questions ?? []).map(q => q.id));
      });
    });
  }

  private siblingQuestionId(offset: number): string | null {
    const order = this.questionOrder();
    const index = order.indexOf(this.questionId());
    if (index === -1) return null;
    return order[index + offset] ?? null;
  }

  /** Cambia de lenguaje conservando el borrador del actual (si `keepDraft` es true) y recupera o genera el del nuevo. */
  protected selectLanguage(lang: Language, keepDraft = true) {
    if (keepDraft) this.drafts.set(this.language(), this.code());
    this.clearResults();
    this.language.set(lang);
    this.code.set(this.drafts.get(lang) ?? buildTemplate(lang, this.stdin()));
  }

  protected goToQuestion(id: string) {
    this.router.navigate(['/assessments', this.assessmentId(), 'questions', id]);
  }

  protected goToResults() {
    this.router.navigate(['/assessments', this.assessmentId(), 'results']);
  }

  /** Los resultados pertenecen al código y lenguaje con que se generaron: se descartan al cambiarlos o volver a correr. */
  private clearResults() {
    this.runResult.set(null);
    this.submission.set(null);
  }

  protected run() {
    this.clearResults();
    this.running.set(true);
    this.lastRunInput = this.stdin();
    this.executionApi.run({ code: this.code(), language: this.language(), input: this.stdin() }).subscribe({
      next: result => { this.runResult.set(result); this.running.set(false); },
      error: e => { this.error.set(e?.error?.message ?? 'Error al ejecutar el código.'); this.running.set(false); },
    });
  }

  protected submit() {
    this.clearResults();
    this.submitting.set(true);
    this.submissionsApi.submit({
      assessmentId: this.assessmentId(), questionId: this.questionId(), code: this.code(), language: this.language(),
    }).subscribe({
      next: saved => { this.submission.set(saved); this.submitting.set(false); },
      error: e => { this.error.set(e?.error?.message ?? 'Error al enviar la respuesta.'); this.submitting.set(false); },
    });
  }
}
