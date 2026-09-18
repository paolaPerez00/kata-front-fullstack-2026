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
    totalScore: number;
    maxScore: number;
    correct: number;
    incorrect: number;
    submissions: Submission[];
}
