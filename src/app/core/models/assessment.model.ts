import { Question } from './question.model';
import { Submission } from './submission.model';

export interface Assessment {
    id: string;
    name: string;
    description: string;
    durationMinutes: number;
    questions?: Question[];
}

export interface CreateAssessmentDto {
    name: string;
    description: string;
    durationMinutes: number;
    questionIds?: string[];
}

export interface AssessmentResults {
    assessmentId: string;
    totalScore: number;
    totalQuestions: number;
    correctAnswers: number;
    incorrectAnswers: number;
    testCasesSummary: { totalCases: number; passedCases: number; failedCases: number; percentage: number };
    /** Última submission de cada pregunta. */
    submissions: Submission[];
}
