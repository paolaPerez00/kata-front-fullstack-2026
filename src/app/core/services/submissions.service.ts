import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_URL } from '../api.config';
import { CreateSubmissionDto, Submission } from '../models/submission.model';

@Injectable({ providedIn: 'root' })
export class SubmissionsService {
    private http = inject(HttpClient);
    private url = `${inject(API_URL)}/submissions`;

    submit(dto: CreateSubmissionDto) { return this.http.post<Submission>(this.url, dto); }
    get(id: string) { return this.http.get<Submission>(`${this.url}/${id}`); }
}