import { Injectable, inject } from '@angular/core';
import { forkJoin, map, of } from 'rxjs';
import { SubmissionsService } from './submissions.service';
import { Question } from '../models/question.model';

@Injectable({ providedIn: 'root' })
export class AutoGradeService {
    private submissionsApi = inject(SubmissionsService);

    submitUnanswered(assessmentId: string, questions: Question[], answeredQuestionIds: ReadonlySet<string>) {
        const pending = questions.filter(q => !answeredQuestionIds.has(q.id));
        if (!pending.length) return of(null);
        return forkJoin(
            pending.map(q =>
                this.submissionsApi.submit({
                    assessmentId,
                    questionId: q.id,
                    code: '',
                    language: q.allowedLanguages[0] ?? 'javascript',
                }),
            ),
        ).pipe(map(() => null));
    }
}
