import { Injectable, signal } from '@angular/core';

export interface Attempt { startedAt: number; finishedAt?: number; }

const KEY = 'kata.attempt.';

@Injectable({ providedIn: 'root' })
export class AttemptService {
    readonly now = signal(Date.now());

    constructor() { setInterval(() => this.now.set(Date.now()), 1000); }

    get(assessmentId: string): Attempt | null {
        try {
            const raw = localStorage.getItem(KEY + assessmentId);
            return raw ? (JSON.parse(raw) as Attempt) : null;
        } catch { return null; }
    }

    start(assessmentId: string): Attempt {
        const attempt = this.get(assessmentId) ?? { startedAt: Date.now() };
        this.save(assessmentId, attempt);
        return attempt;
    }

    finish(assessmentId: string, durationMinutes: number): Attempt {
        const attempt = this.start(assessmentId);
        if (!attempt.finishedAt) {
            attempt.finishedAt = Math.min(Date.now(), attempt.startedAt + durationMinutes * 60_000);
            this.save(assessmentId, attempt);
        }
        return attempt;
    }

    reset(assessmentId: string) {
        try { localStorage.removeItem(KEY + assessmentId); } catch { }
    }

    remainingMs(attempt: Attempt | null, durationMinutes: number, now: number): number | null {
        if (!attempt) return null;
        const end = attempt.finishedAt ?? now;
        return Math.max(0, attempt.startedAt + durationMinutes * 60_000 - end);
    }

    status(assessmentId: string, durationMinutes: number): 'Pendiente' | 'En curso' | 'Finalizado' {
        const attempt = this.get(assessmentId);
        if (!attempt) return 'Pendiente';
        if (!attempt.finishedAt && this.remainingMs(attempt, durationMinutes, this.now()) === 0) {
            this.finish(assessmentId, durationMinutes);
            return 'Finalizado';
        }
        return attempt.finishedAt ? 'Finalizado' : 'En curso';
    }

    elapsedMs(attempt: Attempt, durationMinutes: number): number {
        const end = attempt.finishedAt ?? this.now();
        return Math.min(end - attempt.startedAt, durationMinutes * 60_000);
    }

    private save(id: string, attempt: Attempt) {
        try { localStorage.setItem(KEY + id, JSON.stringify(attempt)); } catch { }
    }
}
