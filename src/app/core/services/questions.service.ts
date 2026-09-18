import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_URL } from '../api.config';
import { CreateQuestionDto, Question } from '../models/question.model';

@Injectable({ providedIn: 'root' })
export class QuestionsService {
    private http = inject(HttpClient);
    private url = `${inject(API_URL)}/questions`;

    list() { return this.http.get<Question[]>(this.url); }
    get(id: string) { return this.http.get<Question>(`${this.url}/${id}`); }
    create(dto: CreateQuestionDto) { return this.http.post<Question>(this.url, dto); }
}