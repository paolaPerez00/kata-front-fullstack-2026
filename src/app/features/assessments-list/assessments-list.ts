import { Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { catchError, of } from 'rxjs';
import { AssessmentsService } from '../../core/services/assessments.service';
import { Assessment } from '../../core/models/assessment.model';
import { PageHeader } from '../../shared/page-header';
import { DemoService } from '../../core/services/demo.service';
import { AttemptService } from '../../core/services/attempt.service';

@Component({
  selector: 'app-assessments-list',
  imports: [RouterLink, PageHeader],
  templateUrl: './assessments-list.html',
  styleUrl: './assessments-list.scss',
})
export class AssessmentsList {
  private attempts = inject(AttemptService);
  private demo = inject(DemoService);
  private router = inject(Router);
  protected failed = false;
  protected creatingDemo = signal(false);
  protected demoError = signal('');
  protected assessments = toSignal(
    inject(AssessmentsService).list().pipe(catchError(() => { this.failed = true; return of([]); })),
  );

  protected status(a: Assessment) { return this.attempts.status(a.id, a.durationMinutes); }

  protected openDemo() {
    this.creatingDemo.set(true);
    this.demoError.set('');
    this.demo.ensureDemo().subscribe({
      next: id => this.router.navigate(['/assessments', id]),
      error: () => { this.demoError.set('No se pudo crear el demo. Verifica que el backend esté corriendo.'); this.creatingDemo.set(false); },
    });
  }
}
