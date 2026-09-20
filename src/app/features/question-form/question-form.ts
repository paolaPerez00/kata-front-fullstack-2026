import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { QuestionsService } from '../../core/services/questions.service';
import { Language, TestCase } from '../../core/models/question.model';
import { FormField } from '../../shared/form-field';
import { PageHeader } from '../../shared/page-header';
import { TestCasesEditor } from '../../shared/test-cases-editor';
import { LANGUAGE_LABELS } from '../../shared/format';

@Component({
  selector: 'app-question-form',
  imports: [FormsModule, FormField, PageHeader, TestCasesEditor],
  templateUrl: './question-form.html',
})
export class QuestionForm {
  private api = inject(QuestionsService);
  protected router = inject(Router);

  protected languages = Object.entries(LANGUAGE_LABELS) as [Language, string][];
  protected title = signal('');
  protected description = signal('');
  protected allowedLanguages = signal<Language[]>(['javascript']);
  protected points = signal<number | null>(10);
  protected testCases = signal<TestCase[]>([{ input: '', expectedOutput: '', isHidden: false }]);

  protected submitted = signal(false);
  protected saving = signal(false);
  protected error = signal('');

  protected errors = computed(() => ({
    title: this.title().trim() ? '' : 'El título es obligatorio.',
    description: this.description().trim() ? '' : 'La descripción es obligatoria.',
    languages: this.allowedLanguages().length ? '' : 'Elige al menos un lenguaje.',
    points: (this.points() ?? 0) > 0 ? '' : 'El puntaje debe ser mayor que 0.',
    testCases: this.testCases().length && this.testCases().every(t => t.expectedOutput.trim())
      ? '' : 'Cada caso de prueba necesita un output esperado.',
  }));
  protected valid = computed(() => Object.values(this.errors()).every(e => !e));

  protected toggleLanguage(lang: Language) {
    this.allowedLanguages.update(list => (list.includes(lang) ? list.filter(l => l !== lang) : [...list, lang]));
  }

  protected save() {
    this.submitted.set(true);
    if (!this.valid()) return;
    this.saving.set(true);
    this.error.set('');
    this.api.create({
      title: this.title().trim(),
      description: this.description().trim(),
      allowedLanguages: this.allowedLanguages(),
      points: this.points()!,
      testCases: this.testCases(),
    }).subscribe({
      next: () => this.router.navigate(['/questions']),
      error: e => { this.error.set(e?.error?.message ?? 'No se pudo guardar la pregunta.'); this.saving.set(false); },
    });
  }
}
