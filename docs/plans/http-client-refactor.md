# Plan: Refactor del cliente HTTP

## Referencia

- Spec: `docs/specs/http-client-refactor.md`

## Cambios por archivo

| Archivo | Acción | Descripción |
| --- | --- | --- |
| `src/lib/http-client.ts` | crear | Cliente HTTP centralizado con métodos base, interceptores, timeout y errores tipados. |
| `src/lib/http-client.types.ts` | crear | Tipados de request/response y errores del cliente. |
| `src/lib/query-client.ts` | modificar | Ajustar defaults y exponer helpers para queries/mutations con el nuevo cliente. |
| `src/hooks/use-health.ts` | modificar | Migrar ejemplo de fetch a la nueva API de cliente HTTP como referencia. |
| `src/app/_layout.tsx` | modificar | Verificar integración con `QueryClientProvider` y bootstrapping del cliente. |
| `src/components/app-tabs.tsx` | revisar | No requiere cambios funcionales, solo garantizar que no haya dependencia del fetch directo. |

## Descomposición en tareas

1. **T1 — Relevamiento de la capa de fetching actual**: archivos que toca: `src/lib/query-client.ts`, `src/hooks/use-health.ts`; definir cómo se usa TanStack Query hoy, qué defaults de retry/stale time ya existen y qué conviene mantener.
2. **T2 — Definir la API del cliente HTTP**: archivos que toca: `src/lib/http-client.types.ts`; especificar `HttpClient`, `RequestConfig`, `ApiError`, `HttpMethods`, serialización de params y gestión de `AbortSignal`.
3. **T3 — Implementar el cliente base y los interceptores**: archivos que toca: `src/lib/http-client.ts`; crear `get/post/put/patch/delete`, manejo de baseURL, headers, timeout, retries y manejo uniforme de errores HTTP/red.
4. **T4 — Integrar autenticación y errores normalizados**: archivos que toca: `src/lib/http-client.ts`, `src/lib/query-client.ts`; incluir token desde almacenamiento/estado global, tratamiento de `401`/`403` y errores con formato extendido para UI.
5. **T5 — Migrar hooks de ejemplo y validación**: archivos que toca: `src/hooks/use-health.ts`, `src/lib/query-client.ts`; cambiar el patrón de ejemplo para usar `queryFn` con el cliente HTTP, sin romper la configuración actual de QueryClient.
6. **T6 — Validación y hardening**: archivos que toca: `src/lib/http-client.ts`, `src/lib/http-client.types.ts`; verificar `204`, `FormData`, cancelación, offline, retry controlado y compatibilidad con Expo/React Native.

## Librerías / dependencias

- No requieren dependencias nuevas; se usa la funcionalidad nativa de `fetch` del runtime RN/Expo.
- Si se decide un helper de manejo de `FormData` o `URLSearchParams`, no requiere librerías adicionales.

## Riesgos / dependencias

- El flujo de auth real puede depender de un store persistente o un token provider aún no definido; la implementación debe tolerar `undefined` y una estrategia centralizada de logout.
- La capa HTTP debe evitar conflictos con `QueryClient` ya configurado en `src/lib/query-client.ts` y mantener el comportamiento actual de `staleTime` y retry.
- La serialización de errores debe ser consistente para que la UI no tenga que interpretar códigos por pantalla.

## Verificación

- `npm run typecheck`
- `npm run lint:fix`
- Validación manual de:
  - request exitosa con y sin token
  - error 401/403
  - timeout/retry
  - cancelación de request
  - respuesta `204 No Content`
