import { Routes } from '@angular/router';

export const routes: Routes = [
    { path: '', pathMatch: 'full', redirectTo: 'assessments' },
    {
        path: 'assessments',
        loadComponent: () => import('./features/assessments-list/assessments-list').then(m => m.AssessmentsList),
    },
    {
        path: 'assessments/:id',
        loadComponent: () => import('./features/assessment-detail/assessment-detail').then(m => m.AssessmentDetail),
    },
    {
        path: 'assessments/:assessmentId/questions/:questionId',
        loadComponent: () => import('./features/code-editor/code-editor').then(m => m.CodeEditor),
    },
    {
        path: 'assessments/:id/results',
        loadComponent: () => import('./features/results/results').then(m => m.Results),
    },
    { path: '**', redirectTo: 'assessments' },
];