import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_URL } from '../api.config';
import { RunRequest, RunResult } from '../models/execution.model';

@Injectable({ providedIn: 'root' })
export class ExecutionService {
    private http = inject(HttpClient);
    private url = `${inject(API_URL)}/run`;

    run(req: RunRequest) { return this.http.post<RunResult>(this.url, req); }
}