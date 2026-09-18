import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { catchError, of } from 'rxjs';
import { AssessmentsService } from '../../core/services/assessments.service';
import { Assessment } from '../../core/models/assessment.model';
import { AttemptService } from '../../core/services/attempt.service';

@Component({
  selector: 'app-assessments-list',
  imports: [RouterLink],
  templateUrl: './assessments-list.html',
  styleUrl: './assessments-list.scss',
})
export class AssessmentsList {
  private attempts = inject(AttemptService);
  protected failed = false;
  protected assessments = toSignal(
    inject(AssessmentsService).list().pipe(catchError(() => { this.failed = true; return of([]); })),
  );

  protected status(a: Assessment) { return this.attempts.status(a.id, a.durationMinutes); }
}
