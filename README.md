# Kata FullStack — Frontend (Angular 21)

Cliente web de la Technical Assessment Platform. Consume la API REST del backend NestJS.

## Ejecutar

```bash
npm install
npm start        # http://localhost:4200
```

`proxy.conf.json` redirige `/api/*` a `http://localhost:3000` (backend). Levanta el backend primero.

## Pantallas

| Ruta | Pantalla |
|---|---|
| `/assessments` | Listado de assessments |
| `/assessments/:id` | Detalle: tiempo restante, preguntas, estado, puntaje acumulado |
| `/assessments/:id/questions/:questionId` | Editor Monaco, selector de lenguaje, ejecutar, consola, enviar |
| `/assessments/:id/results` | Puntaje, correctas/incorrectas, tiempo consumido |

## Notas de diseño

- Componentes standalone + signals, rutas con carga perezosa (Monaco sólo se descarga en el editor).
- El backend no expone hora de inicio del intento, así que el cronómetro se guarda en `localStorage` (`AttemptService`).
- Los borradores de código se conservan por lenguaje mientras se está en la pregunta.
- Se asume la clase `Main` para Java y lectura por stdin en todos los lenguajes.

## Tests

```bash
npm test
```
