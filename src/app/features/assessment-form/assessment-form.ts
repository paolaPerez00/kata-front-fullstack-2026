import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { catchError, of } from 'rxjs';
import { AssessmentsService } from '../../core/services/assessments.service';
import { QuestionsService } from '../../core/services/questions.service';
import { FormField } from '../../shared/form-field';
import { PageHeader } from '../../shared/page-header';
import { QuestionPicker } from '../../shared/question-picker';

@Component({
  selector: 'app-assessment-form',
  imports: [FormsModule, RouterLink, FormField, PageHeader, QuestionPicker],
  templateUrl: './assessment-form.html',
})
export class AssessmentForm {
  private api = inject(AssessmentsService);
  protected router = inject(Router);

  protected availableQuestions = toSignal(inject(QuestionsService).list().pipe(catchError(() => of([]))), { initialValue: [] });

  protected name = signal('');
  protected description = signal('');
  protected durationMinutes = signal<number | null>(60);
  protected questionIds = signal<string[]>([]);

  protected submitted = signal(false);
  protected saving = signal(false);
  protected error = signal('');

  protected questionCount = computed(() => this.questionIds().length);
  protected totalPoints = computed(() => {
    const ids = new Set(this.questionIds());
    return this.availableQuestions().filter(q => ids.has(q.id)).reduce((sum, q) => sum + q.points, 0);
  });

  protected errors = computed(() => ({
    name: this.name().trim() ? '' : 'El nombre es obligatorio.',
    description: this.description().trim() ? '' : 'La descripción es obligatoria.',
    duration: (this.durationMinutes() ?? 0) > 0 ? '' : 'El tiempo límite debe ser mayor que 0.',
    questions: this.questionCount() ? '' : 'Elige al menos una pregunta.',
  }));
  protected valid = computed(() => Object.values(this.errors()).every(e => !e));

  protected save() {
    this.submitted.set(true);
    if (!this.valid()) return;
    this.saving.set(true);
    this.error.set('');
    this.api.create({
      name: this.name().trim(),
      description: this.description().trim(),
      durationMinutes: this.durationMinutes()!,
      questionIds: this.questionIds(),
    }).subscribe({
      next: a => this.router.navigate(['/assessments', a.id]),
      error: e => { this.error.set(e?.error?.message ?? 'No se pudo crear el assessment.'); this.saving.set(false); },
    });
  }
}
