export function formatClock(ms: number): string {
    const total = Math.floor(ms / 1000);
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    const pad = (n: number) => String(n).padStart(2, '0');
    return h ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

export const LANGUAGE_LABELS: Record<string, string> = {
    javascript: 'JavaScript (Node.js)',
    typescript: 'TypeScript',
    python: 'Python',
    java: 'Java',
};

type InputKind = 'json' | 'numbers' | 'intArray' | 'int' | 'text';

function detectKind(sample: string): InputKind {
    const s = sample.trim();
    if (/^\[\s*(-?\d+\s*(,\s*-?\d+\s*)*)?\]$/.test(s)) return 'intArray';
    if (/^-?\d+$/.test(s)) return 'int';
    if (/^-?\d+(\.\d+)?(\s+-?\d+(\.\d+)?)+$/.test(s)) return 'numbers';
    try { JSON.parse(s); return 'json'; } catch { return 'text'; }
}

const NOTE: Record<InputKind, string> = {
    intArray: 'lista de números',
    int: 'un número',
    numbers: 'lista de números',
    json: 'dato ya convertido',
    text: 'texto',
};

export function buildTemplate(language: string, sampleInput = ''): string {
    const kind = detectKind(sampleInput);
    const ejemplo = sampleInput.trim() ? ` (ej: ${sampleInput.trim()})` : '';
    const note = `${NOTE[kind]}${ejemplo}`;

    if (language === 'python') {
        const read = {
            intArray: 'json.loads(sys.stdin.read())',
            int: 'int(sys.stdin.read())',
            numbers: 'list(map(float, sys.stdin.read().split()))',
            json: 'json.loads(sys.stdin.read())',
            text: 'sys.stdin.read().strip()',
        }[kind];
        return `import sys, json

# 1) Tu dato de entrada ya está listo en "datos": ${note}
datos = ${read}

# 2) Escribe tu solución aquí y guarda la respuesta en "resultado"
resultado = None

# 3) No cambies esto: muestra la respuesta (avisa si aún no asignaste "resultado")
if resultado is None:
    print('Falta tu solución: asigna un valor a "resultado"', file=sys.stderr)
else:
    print(resultado)
`;
    }

    if (language === 'java') {
        const body = {
            intArray: `String texto = sc.hasNextLine() ? sc.nextLine().replaceAll("[\\\\[\\\\]\\\\s]", "") : "";
        int[] datos = texto.isEmpty() ? new int[0] : Arrays.stream(texto.split(",")).mapToInt(Integer::parseInt).toArray();`,
            int: `int datos = Integer.parseInt(sc.nextLine().trim());`,
            numbers: `double[] datos = Arrays.stream(sc.nextLine().trim().split("\\\\s+")).mapToDouble(Double::parseDouble).toArray();`,
            json: `String datos = sc.hasNextLine() ? sc.nextLine().trim() : "";`,
            text: `String datos = sc.hasNextLine() ? sc.nextLine().trim() : "";`,
        }[kind];
        return `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);

        // 1) Tu dato de entrada ya está listo en "datos": ${note}
        ${body}

        // 2) Escribe tu solución aquí y guarda la respuesta en "resultado"
        Object resultado = null;

        // 3) No cambies esto: muestra la respuesta (avisa si aún no asignaste "resultado")
        if (resultado == null) System.err.println("Falta tu solución: asigna un valor a resultado");
        else System.out.println(resultado);
    }
}
`;
    }

    const ts = language === 'typescript';
    const raw = ts
        ? `fs.readFileSync(0, 'utf8')`
        : `require('fs').readFileSync(0, 'utf8')`;
    const read = {
        intArray: `JSON.parse(${raw})`,
        int: `Number(${raw})`,
        numbers: `${raw}.trim().split(/\\s+/).map(Number)`,
        json: `JSON.parse(${raw})`,
        text: `${raw}.trim()`,
    }[kind];
    const type = ts ? ': any' : '';
    return `${ts ? "import * as fs from 'fs';\n\n" : ''}// 1) Tu dato de entrada ya está listo en "datos": ${note}
const datos${type} = ${read};

// 2) Escribe tu solución aquí y guarda la respuesta en "resultado"
let resultado${type} = null;

// 3) No cambies esto: muestra la respuesta (avisa si aún no asignaste "resultado")
if (resultado === null) console.error('Falta tu solución: asigna un valor a "resultado"');
else console.log(resultado);
`;
}
