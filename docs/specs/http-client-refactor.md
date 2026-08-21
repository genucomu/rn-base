# Refactor del cliente HTTP

## Contexto / Problema

La app necesita una capa HTTP centralizada y tipada para evitar duplicación de requests, errores inconsistentes y acoplamiento directo de cada pantalla con la API. El proyecto ya usa TanStack Query en `src/lib/query-client.ts`, pero aún no existe un cliente HTTP reutilizable para manejar headers, parsing, reintentos, timeout y traducción de errores.

El problema actual es que cada flujo de datos repite lógica ad-hoc y dificulta mantener contratos de respuesta, autenticación y manejo de errores. Esto impacta el crecimiento del proyecto y la fiabilidad de la capa de datos.

## Objetivos

- Crear un cliente HTTP base reutilizable para todas las llamadas al backend.
- Centralizar autenticación, timeouts, reintentos y manejo de errores.
- Mantener respuestas tipadas y validación de payloads en el cliente.
- Desacoplar la lógica de fetch de las pantallas y hooks de React.
- Integrarlo con TanStack Query para queries y mutaciones sin duplicar código.

## No-objetivos

- No incorporar lógica de caché específica por pantalla fuera del mecanismo de TanStack Query.
- No desarrollar un mock server completo en esta feature.
- No implementar OAuth u otra estrategia de auth distinta a bearer token.
- No reescribir la app entera; la refactorización debe ser incremental y compatible con el estado actual.

## Supuestos

- El backend expone JSON con respuestas en formato estándar y errores con estructura consistente.
- El proyecto usa un token en `Authorization: Bearer <token>` y un flujo de refresh opcional en una etapa posterior.
- Las pantallas y hooks consumen datos a través de servicios o hooks generados por el cliente HTTP.
- La capa HTTP debe poder usarse tanto desde React Native como desde scripts de test o utilidades no visuales.

## Requerimientos funcionales

- [ ] RF-1: El cliente HTTP debe exponer métodos `get`, `post`, `put`, `patch`, `delete` con tipado genérico.
- [ ] RF-2: Debe soportar `baseURL`, headers por defecto y sobreescritura por request.
- [ ] RF-3: Debe manejar errores HTTP y red con una estructura uniforme: `code`, `message`, `status`, `details` opcional.
- [ ] RF-4: Debe incluir el token de autenticación cuando exista y no romper requests públicos.
- [ ] RF-5: Debe soportar retries controlados y timeout personalizado por operación.
- [ ] RF-6: Debe permitir cancelar requests en vuelo para evitar updates de estado vencidos.
- [ ] RF-7: Debe centralizar la transformación del payload de respuesta y el manejo de `204 No Content`.
- [ ] RF-8: Debe exponear un helper para serializar query params y multipart/form-data si se requiere en futuro.
- [ ] RF-9: El cliente debe ser reusable tanto para queries como para mutaciones de TanStack Query.

## Requerimientos no funcionales

- Rendimiento: evitar re-creación innecesaria del cliente y reutilizar instancias por app.
- Seguridad: nunca loggear tokens ni payloads sensibles en producción.
- Observabilidad: incluir hooks para errores o telemetry sin romper la API pública.
- Compatibilidad: funcionar en Expo/React Native sin dependencias nativas extra.
- Robustez: manejar estados offline y errores de red sin romper la pantalla.

## Datos / API

- Entidad cliente HTTP: `HttpClient` o equivalente, configurado con `baseUrl`, `defaultHeaders`, `timeout`, `onUnauthorized` y `logger`.
- Contrato de request:
  - `method`
  - `url`
  - `params`
  - `body`
  - `headers`
  - `signal`
  - `timeout`
  - `retry`
- Contrato de response:
  - `data: T`
  - `status: number`
  - `headers`
- Error estándar:
  - `code: string`
  - `message: string`
  - `status?: number`
  - `details?: unknown`
- Integración con TanStack Query:
  - Queries usar `queryFn: () => httpClient.get<T>(...)`
  - Mutations usar `mutationFn: (payload) => httpClient.post<T>(...)`
  - Keys centralizados por dominio (ej., `groups`, `tasks`, `subtasks`)

## UI / Navegación

- No se prevén pantallas nuevas en esta feature; la refactorización es infraestructural.
- Se debe garantizar que los hooks de `useQuery` y `useMutation` no dependan de `fetch` directo ni de lógica duplicada.
- Los estados de loading, error y empty state siguen siendo responsabilidad de la UI, pero la capa HTTP debe devolver errores normalizados para simplificar los componentes.

## Manejo de errores y edge cases

- Error de red: mostrar mensaje amigable y permitir reintento.
- `401`/`403`: activar flujo de logout o renovación del token centralizado.
- `404`: propagar error de recurso no encontrado con contexto del endpoint.
- `409`/`422`: levantar errores de validación con detalle útil para la pantalla.
- `204`: tratar respuesta vacía como `null` o `undefined` según contrato.
- Cancelación: ignorar updates si una request fue abortada durante un unmount o cambio de pantalla.
- Retry: aplicar solo a operaciones idempotentes y no a mutaciones con efectos secundarios no seguros.

## Estrategia de testing

- Validación estática: `npm run typecheck`.
- Validación de lint/format: `npm run lint:fix`.
- Pruebas manuales:
  - request exitosa con token presente
  - request sin token para endpoint público
  - error 401 con flujo de logout
  - timeout/retry
  - cancelación durante cambio de pantalla
- Pruebas unitarias recomendadas:
  - serialización de query params
  - mapping de errores HTTP
  - transformación de payloads en 204 / 200

## Preguntas abiertas

- ¿Se necesita soporte inicial para `FormData` o solo JSON? (se asume JSON por ahora con extensión futura).
- ¿La app requiere un interceptor de refresh de token en esta etapa o solo manejo de 401/403?

## Criterios de aceptación

- [ ] Existe una única capa cliente HTTP reutilizable para queries y mutaciones.
- [ ] El manejo de auth, errores y retry está centralizado.
- [ ] Las pantallas usan la nueva capa y no duplican `fetch`/`axios`/lógica manual.
- [ ] El cliente soporta cancelación y errores tipados con formato uniforme.
- [ ] La refactorización cumple `typecheck` y `lint` sin regressiones.
