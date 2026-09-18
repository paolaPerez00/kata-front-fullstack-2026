import { Language } from './question.model';

export interface TestCaseResult {
    passed: boolean;
    input?: string;
    expectedOutput?: string;
    actualOutput?: string;
    isHidden?: boolean;
}

export interface Submission {
    id: string;
    assessmentId: string;
    questionId: string;
    code: string;
    language: Language;
    results: TestCaseResult[];
    score: number;
    createdAt?: string;
}

export interface CreateSubmissionDto {
    assessmentId: string;
    questionId: string;
    code: string;
    language: Language;
}