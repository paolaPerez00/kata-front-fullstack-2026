import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_URL } from '../api.config';
import { Assessment, AssessmentResults, CreateAssessmentDto } from '../models/assessment.model';

@Injectable({ providedIn: 'root' })
export class AssessmentsService {
    private http = inject(HttpClient);
    private url = `${inject(API_URL)}/assessments`;

    list() { return this.http.get<Assessment[]>(this.url); }
    get(id: string) { return this.http.get<Assessment>(`${this.url}/${id}`); }
    create(dto: CreateAssessmentDto) { return this.http.post<Assessment>(this.url, dto); }
    addQuestions(id: string, questionIds: string[]) {
        return this.http.post<Assessment>(`${this.url}/${id}/questions`, { questionIds });
    }
    results(id: string) { return this.http.get<AssessmentResults>(`${this.url}/${id}/results`); }
}