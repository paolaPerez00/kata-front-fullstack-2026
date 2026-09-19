import { Injectable, inject } from '@angular/core';
import { forkJoin, map, of } from 'rxjs';
import { SubmissionsService } from './submissions.service';
import { Question } from '../models/question.model';

/**
 * Cuando se acaba el tiempo, cada pregunta debe quedar con un registro (aunque sea en blanco):
 * evita que el candidato pierda su avance por no alcanzar a pulsar "Enviar respuesta" a tiempo,
 * y evita que /results salga vacío sin explicación.
 */
@Injectable({ providedIn: 'root' })
export class AutoGradeService {
    private submissionsApi = inject(SubmissionsService);

    submitUnanswered(assessmentId: string, questions: Question[], answeredQuestionIds: ReadonlySet<string>) {
        const unanswered = questions.filter(question => !answeredQuestionIds.has(question.id));
        if (!unanswered.length) return of(null);

        return forkJoin(
            unanswered.map(question =>
                this.submissionsApi.submit({
                    assessmentId,
                    questionId: question.id,
                    code: '',
                    language: question.allowedLanguages[0] ?? 'javascript',
                }),
            ),
        ).pipe(map(() => null));
    }
}
