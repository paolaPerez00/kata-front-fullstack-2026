import { Language } from './question.model';

export interface TestCaseResult {
    testCaseId: string;
    passed: boolean;
    actualOutput: string;
    expectedOutput: string;
    errorMessage?: string;
}

export interface Submission {
    id: string;
    assessmentId: string;
    questionId: string;
    code: string;
    language: Language;
    results: TestCaseResult[];
    score: number;
    status: 'pending' | 'graded' | 'error';
    submittedAt: string;
}

export interface CreateSubmissionDto {
    assessmentId: string;
    questionId: string;
    code: string;
    language: Language;
}