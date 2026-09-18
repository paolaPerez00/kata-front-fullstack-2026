import { Language } from './question.model';

export interface RunRequest { code: string; language: Language; input: string; }

export interface RunResult {
    stdout: string;
    stderr: string;
    exitCode: number;
    timedOut: boolean;
    compilation: { success: boolean; line?: number; message?: string };
}
