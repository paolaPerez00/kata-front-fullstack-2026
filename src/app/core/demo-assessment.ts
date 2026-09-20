import { CreateAssessmentDto } from './models/assessment.model';
import { CreateQuestionDto } from './models/question.model';

export const DEMO_NAME = 'Demo: así funciona la plataforma';

/** Dos preguntas muy sencillas para mostrar el flujo completo (ejecutar, probar ejemplos, enviar, resultados). */
export const DEMO_QUESTIONS: CreateQuestionDto[] = [
  {
    title: 'Doble de un número',
    description: 'Dado un número entero, retorne su doble.',
    allowedLanguages: ['javascript', 'python', 'java'],
    points: 10,
    testCases: [
      { input: '4', expectedOutput: '8', isHidden: false },
      { input: '0', expectedOutput: '0', isHidden: false },
      { input: '-3', expectedOutput: '-6', isHidden: true },
    ],
  },
  {
    title: 'Saludo',
    description: 'Dado un nombre, retorne el texto "Hola, " seguido del nombre. Ejemplo: Ana → Hola, Ana',
    allowedLanguages: ['javascript', 'python', 'java'],
    points: 10,
    testCases: [
      { input: 'Ana', expectedOutput: 'Hola, Ana', isHidden: false },
      { input: 'Luis', expectedOutput: 'Hola, Luis', isHidden: false },
      { input: 'Sofía', expectedOutput: 'Hola, Sofía', isHidden: true },
    ],
  },
];

export const DEMO_ASSESSMENT: Omit<CreateAssessmentDto, 'questionIds'> = {
  name: DEMO_NAME,
  description: 'Assessment de demostración con 2 preguntas muy sencillas para conocer cómo funciona la plataforma: escribe la solución, ejecútala, pruébala con los ejemplos y envíala.',
  durationMinutes: 15,
};
