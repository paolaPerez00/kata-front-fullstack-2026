import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { catchError, of } from 'rxjs';
import { QuestionsService } from '../../core/services/questions.service';
import { PageHeader } from '../../shared/page-header';
import { LANGUAGE_LABELS } from '../../shared/format';

@Component({
  selector: 'app-questions-list',
  imports: [RouterLink, PageHeader],
  templateUrl: './questions-list.html',
})
export class QuestionsList {
  protected failed = false;
  protected labels = LANGUAGE_LABELS;
  protected questions = toSignal(
    inject(QuestionsService).list().pipe(catchError(() => { this.failed = true; return of([]); })),
  );
}
