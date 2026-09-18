export type Language = 'javascript' | 'python' | 'java' | 'typescript';

export interface TestCase { id?: string; input: string; expectedOutput: string; isHidden: boolean; }

export interface Question {
    id: string;
    title: string;
    description: string;
    allowedLanguages: Language[];
    points: number;
    testCases?: TestCase[];
}

export type CreateQuestionDto = Omit<Question, 'id'> & { testCases: TestCase[] };
