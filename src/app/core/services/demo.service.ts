import { Injectable, inject } from '@angular/core';
import { forkJoin, map, of, switchMap } from 'rxjs';
import { AssessmentsService } from './assessments.service';
import { QuestionsService } from './questions.service';
import { DEMO_ASSESSMENT, DEMO_NAME, DEMO_QUESTIONS } from '../demo-assessment';

@Injectable({ providedIn: 'root' })
export class DemoService {
  private assessments = inject(AssessmentsService);
  private questions = inject(QuestionsService);

  /** Devuelve el id del assessment demo; lo crea (con sus preguntas) solo si todavía no existe. */
  ensureDemo() {
    return this.assessments.list().pipe(
      switchMap(list => {
        const existing = list.find(a => a.name === DEMO_NAME);
        if (existing) return of(existing.id);
        return forkJoin(DEMO_QUESTIONS.map(q => this.questions.create(q))).pipe(
          switchMap(created => this.assessments.create({ ...DEMO_ASSESSMENT, questionIds: created.map(q => q.id) })),
          map(a => a.id),
        );
      }),
    );
  }
}
