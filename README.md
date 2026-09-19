# 🎨 Kata FullStack — Frontend

Cliente web de la **Technical Assessment Platform**. Permite al candidato elegir un assessment, resolver ejercicios de programación en un editor Monaco, ejecutar su código, enviarlo para calificación automática y ver sus resultados. Consume la API REST del backend NestJS (`kata-back-fullstack-2026`).

## 🛠️ Stack

| Capa | Tecnología |
|---|---|
| 🎨 Framework | Angular 21 (componentes standalone, signals, control flow `@if/@for`) |
| ✍️ Editor de código | Monaco Editor 0.56 |
| 🌐 HTTP | `HttpClient` + servicios por recurso |
| 🔧 Runtime | Node.js 24 |

## ▶️ Cómo correrlo

Requisito: el backend corriendo en `http://localhost:3000`

```bash
npm install
npm start          # http://localhost:4200
```

`proxy.conf.json` redirige `/api/*` → `http://localhost:3000/*`, así que no hace falta configurar CORS ni URLs. La base de la API se cambia inyectando el token `API_URL` (`src/app/core/api.config.ts`).

Otros comandos: `npm run build` (producción), `npm test` (unit tests).

## 🖥️ Pantallas

| Ruta | Pantalla | Qué muestra |
|---|---|---|
| `/assessments` | 1 · Listado | Tarjetas con duración, nº de preguntas y estado del intento |
| `/assessments/:id` | 2 · Detalle | Tiempo restante, puntaje acumulado, estado, preguntas y su avance |
| `/assessments/:id/questions/:questionId` | 3 · Editor | Enunciado, Monaco, selector de lenguaje, ejecutar, consola y enviar |
| `/assessments/:id/results` | 4 · Resultados | Puntaje (y %), correctas, incorrectas, tiempo consumido y detalle por pregunta |

Flujo: **Listado → Detalle → Iniciar (modal de confirmación) → Resolver preguntas → Finalizar / se acaba el tiempo → Resultados.**

## 🏗️ Estructura

```
src/app/
  core/
    api.config.ts          → token API_URL ('/api')
    models/                → interfaces que reflejan los contratos del backend
    services/              → un servicio por recurso (assessments, questions, submissions, execution)
                             + AttemptService (cronómetro del intento)
  features/
    assessments-list/  assessment-detail/  code-editor/  results/   → una carpeta por pantalla (lazy)
  shared/
    monaco-editor.ts       → wrapper standalone de Monaco (carga perezosa)
    exam-guard.ts          → restricciones durante la prueba
    modal.ts               → modal reutilizable
    format.ts              → formato de reloj, etiquetas y plantillas de código de Monaco
```

Todas las rutas usan `loadComponent`, por lo que el bundle inicial es pequeño (~260 kB). Monaco (~2.6 MB) sólo se descarga al entrar al editor.

## 🔑 Decisiones de diseño clave

### ⏱️ Cronómetro del intento
El backend no guarda la hora de inicio del intento, así que `AttemptService` la guarda en `localStorage` por assessment (`startedAt` / `finishedAt`).

- El estado (**Pendiente / En curso / Finalizado**) se calcula con la duración del assessment. Al agotarse el tiempo el cierre se **persiste** y el intento no vuelve a "En curso".
- Al iniciar hay un **modal de confirmación**: no hay reintentos y el tiempo no se detiene aunque se cierre la página.
- Mientras el intento está en curso se muestra un banner con ese aviso.
- Al terminar el tiempo se muestra un **modal "Se terminó el tiempo"** (sin redirección brusca) con el botón para ver resultados; el editor bloquea Ejecutar/Enviar.
- El tiempo consumido se acota a la duración del assessment.

> ⚠️ Al vivir en el navegador, borrar los datos del sitio reinicia el intento. Para un control real, el backend debería persistir `startedAt` (ver *Mejoras*).

### 🧩 Plantillas de código amigables
El input llega al programa por **stdin** (así lo entrega el motor Docker). Para no obligar al candidato a leer stdin, `buildTemplate()` genera la plantilla según el primer ejemplo visible de la pregunta y deja el dato ya convertido en `datos`:

| Ejemplo | `datos` es |
|---|---|
| `[3,5,1,8]` | lista de enteros |
| `5` | número |
| `2 3` | lista de números |
| `ana` | texto |

El candidato sólo escribe su solución y la asigna a `resultado`. Si no asigna nada, la plantilla avisa por `stderr` en lugar de imprimir `null`. Hay plantillas para JavaScript, TypeScript, Python y Java (clase `Main`). Se conserva un borrador por lenguaje.

### 🖥️ Consola de resultados
- Muestra **Compilación exitosa** o **Error de compilación** con línea y mensaje, salida, `stderr`, timeout y exit code.
- Con "Ejecutar", si el input coincide con un ejemplo visible, se compara la salida con el esperado y se indica si **coincide o no** (para que "compiló" no se lea como "correcto"). Con un input propio avisa que no se puede verificar.
- Con "Enviar respuesta" se muestran casos ejecutados / exitosos / fallidos y el puntaje. Los casos ocultos aparecen como *(oculto)* y no revelan su contenido.

### 📊 Puntajes
- El backend no envía puntaje máximo: se calcula sumando los `points` de las preguntas del assessment.
- Una pregunta es **correcta** si pasó todos sus casos; las sin responder cuentan como incorrectas.
- Los puntajes se muestran con máximo 2 decimales (`13.33 / 20`).
- `GET /questions/:id` devuelve sólo los casos visibles, pero `/submissions` ejecuta **todos** (visibles + ocultos); por eso puede haber más casos ejecutados que ejemplos en pantalla.

## 🔒 Medidas durante la prueba (disuasivas)

Implementadas en `shared/exam-guard.ts`, activas sólo en la pantalla del editor:

| Medida | Comportamiento |
|---|---|
| 🚫 Copiar / cortar / pegar | Bloqueados fuera de Monaco (enunciado, consola, stdin), con aviso. **Dentro de Monaco están permitidos.** |
| 🔒 Salir de la ventana | Al perder el foco o cambiar de pestaña el contenido se oculta hasta volver |
| 🖱️ Menú contextual y arrastrar/soltar | Deshabilitados fuera de Monaco |

> ℹ️ Son solo medidas **restrictivas**

## ☁️ Despliegue en AWS (propuesta, no implementado)

| Componente | Servicio |
|---|---|
| 🎨 Frontend (build estático) | S3 + CloudFront (HTTPS, caché, *fallback* a `index.html` para las rutas de Angular) |
| 🔀 Ruteo `/api/*` | CloudFront → ALB → ECS Fargate (backend); mismo dominio, sin CORS |
| 🔐 Certificados / DNS | ACM + Route 53 |
| 🚀 CI/CD | GitHub Actions: `npm ci && npm run build` → `aws s3 sync` → invalidación de CloudFront |

📐 Diagrama completo y detalle: [docs/aws-deployment.md](docs/aws-deployment.md)
