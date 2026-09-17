# Plan: Detalle de tarea con contrato real

## Referencia

- Spec: `docs/specs/detalle-tarea.md`

## Decisiones de arquitectura

- El detalle se obtiene exclusivamente con `GET /tasks/tasks/{id}`. `groupId` sigue siendo
  contexto de ruta, validación y parte de la identidad de caché, pero nunca se envía como
  query param ni se usa para filtrar la respuesta del endpoint.
- Se agregará un DTO específico de detalle (`TaskDetail`) y un DTO de subtask embebida. El
  modelo `Task` legacy se conserva para el listado y las mutaciones existentes, porque
  `src/app/groups/[id]/tasks.tsx` todavía muestra `priority` y la API de update todavía usa
  `priority`, `dueDate` y `completedAt`. La pantalla de detalle no volverá a leer esos campos.
- Se conserva `queryKeys.tasks.detail(groupId, taskId)` para no romper enlaces ni caché de la
  ruta actual. La query se habilita solo con ambos parámetros, pero su `queryFn` llama a
  `getTask(taskId)`.
- El detalle usa la colección `subtasks` de la respuesta y no ejecuta una segunda query para
  pintarla. La pantalla de gestión de subtasks mantiene su ruta y sus acciones actuales.
- La moneda se centraliza en un formatter de tasks: usar `es-AR` y `ARS` como fallback hasta
  que el contrato de producto exponga una moneda configurable. Los valores `0` se formatean;
  `null`/`undefined` o valores no numéricos muestran `Sin datos`. Las fechas se formatean en
  locale local como `dd/MM/yyyy HH:mm`; timestamps inválidos muestran `Sin datos`.

## Cambios por archivo

| Archivo | Acción | Descripción |
| --- | --- | --- |
| `src/features/tasks/types.ts` | modificar | Añadir `TaskDetail` y el tipo de subtask embebida con `typeCode`, `typeName`, `parentTaskId`, `amountCents` y `subtasks`; conservar el modelo legacy y sus inputs para listado/mutaciones. Alinear el tipo de `status` con el contrato real sin hacer que un estado desconocido rompa el render. |
| `src/features/tasks/api.ts` | modificar | Cambiar únicamente `getTask` para quitar el mock y hacer `http.get<TaskDetail>('/tasks/tasks/{id}')`, sin params `groupId`; normalizar la ausencia/404 de la task a un error identificable por la UI. No migrar en esta feature los mocks de create/update/delete. |
| `src/features/tasks/queries.ts` | modificar | Mantener `useTask(groupId, taskId)` como API de la pantalla y la key `queryKeys.tasks.detail(groupId, taskId)`; hacer que el `queryFn` pase solo `taskId`, conservar `enabled` para parámetros faltantes y exponer `refetch`/estado de error para reintento. Tras update/delete, invalidar el detalle en lugar de escribir un `Task` legacy incompatible como `TaskDetail`. |
| `src/features/tasks/formatters.ts` | crear | Centralizar formato monetario desde centavos y formato de timestamps ISO; manejar cero, ausencia, negativos y fechas inválidas sin lanzar excepciones. |
| `src/app/groups/[id]/tasks/[taskId].tsx` | modificar | Reemplazar la presentación mock por el DTO real: encabezado con título/estado/tipo, descripción, responsable, padre, precio, monto total, fechas y subtasks embebidas; conservar `router.back()`, la navegación a gestión y las acciones de marcar/eliminar. Implementar estados de parámetros inválidos, loading, error con reintento, 404 y datos cargados; deshabilitar u ocultar acciones destructivas mientras no exista una task válida o haya error. |
| `src/services/http.ts` | revisar | Usar el error HTTP tipado existente o exponer una forma estable de identificar `status === 404` para que la capa de tasks distinga task inexistente de error de red/servidor, sin cambiar la política global de refresh 401. |
| `src/lib/query-keys.ts` | revisar, sin cambio esperado | Confirmar que `queryKeys.tasks.detail(groupId, id)` siga siendo la key canónica; no introducir una key basada solo en `taskId`, para conservar compatibilidad con la ruta y la invalidación por grupo. |

## Descomposición en tareas

1. **T1 — Modelar el contrato de detalle**: `src/features/tasks/types.ts`; definir `TaskDetail` y
   el tipo de subtask con nulabilidad explícita para descripción, responsable y padre, más
   `amountCents` y metadatos de tipo. Mantener separados los campos legacy que todavía requiere
   el listado y las mutaciones. No editar la pantalla de listado en esta feature.
2. **T2 — Conectar el endpoint real**: `src/features/tasks/api.ts`, con revisión acotada de
   `src/services/http.ts`; implementar `getTask(id)` contra `/tasks/tasks/{id}` sin `groupId` en
   params, quitar la dependencia del array mock para ese método y dejar un error con status/código
   utilizable para 404. Requiere T1. Conflicto: T3 también modifica la firma consumida por
   `queries.ts`; serializar T2 antes de T3.
3. **T3 — Ajustar query y coherencia de caché**: `src/features/tasks/queries.ts` y revisión de
   `src/lib/query-keys.ts`; conservar la firma pública `useTask(groupId, taskId)` y la key actual,
   pero invocar el service solo con `taskId`. Configurar el reintento según el `QueryClient` actual
   y garantizar que update/delete invaliden o eliminen la entrada de detalle sin guardar allí el
   DTO legacy. Requiere T1 y T2. Conflicto: comparte `queries.ts` con las mutaciones existentes,
   por lo que no se deben cambiar sus endpoints ni payloads.
4. **T4 — Crear formatters reutilizables**: `src/features/tasks/formatters.ts`; convertir centavos
   a unidades antes de `Intl.NumberFormat`, usar `es-AR`/`ARS` como fallback documentado, y
   formatear fechas ISO en hora local con fallback `Sin datos`. Requiere T1; puede ejecutarse en
   paralelo con T2 si no se modifica otro archivo.
5. **T5 — Implementar la pantalla de detalle**: `src/app/groups/[id]/tasks/[taskId].tsx`; usar
   `useTask(groupId, taskId)`, mantener el contenedor seguro y scroll, reemplazar `priority`,
   `dueDate` y `completedAt` por campos del DTO real, renderizar subtasks sin mezclarlas con la
   task padre, y aplicar valores neutros a datos parciales. Mantener `router.back()`, el pathname
   `/groups/[id]/tasks/[taskId]/subtasks` y las acciones `Manage subtasks`, `Mark done` y
   `Delete task`. Requiere T3 y T4.
6. **T6 — Estados de interacción y verificación**: principalmente
   `src/app/groups/[id]/tasks/[taskId].tsx`; distinguir parámetros faltantes, loading inicial,
   error reintentable, 404 (`Task no encontrada`), respuesta vacía/inconsistente y éxito. El botón
   de reintento debe usar `refetch`; back debe seguir disponible en estados no exitosos y las
   acciones de task solo deben estar activas con una task válida. Requiere T5.
7. **T7 — Validación funcional**: archivos de la feature y ruta de detalle; ejecutar typecheck y
   lint, y probar manualmente respuesta completa, subtasks vacías/incompletas, importes cero o
   negativos, fechas inválidas, error de red, 404, reintento, back, gestión de subtasks y las dos
   acciones existentes. Requiere T6.

## Librerías / dependencias

- No se requieren librerías nuevas.
- Usar `Intl.NumberFormat`/`Intl.DateTimeFormat` y el `http` existente; no agregar módulos nativos.
- No modificar `overrides.lightningcss` ni cambiar la configuración global de TanStack Query.

## Riesgos / dependencias

- El endpoint de detalle y el listado no comparten necesariamente la misma forma. `TaskDetail`
  debe mantenerse separado hasta que el contrato de listado también se actualice; de lo contrario,
  eliminar `priority` del tipo global rompería `src/app/groups/[id]/tasks.tsx` y los inputs de
  update.
- El `getTask` nuevo será real, pero create/update/delete todavía contienen caminos mock. Es una
  deuda preexistente y un conflicto de integración: no se debe ampliar esta feature para migrar
  esos endpoints, pero T3 debe evitar escribir respuestas legacy en la caché de detalle y T7 debe
  verificar que los handlers/contratos visuales existentes sigan presentes.
- `status` puede recibir valores no previstos. Mostrar el valor recibido como texto seguro y no
  derivar lógica destructiva de una lista cerrada; los estados habilitados para `Mark done` deben
  seguir la mutación existente.
- La moneda oficial y la semántica exacta de `amountCents` siguen siendo dependencias del backend/
  producto. El plan usa `ARS` como fallback explícito y presenta `amountCents` como monto total,
  sin recalcularlo desde subtasks.
- Un 404 debe distinguirse de un error de red. Si `src/services/http.ts` no expone un tipo usable,
  T2 debe normalizarlo en la feature antes de que T5 decida el estado visual.
- Las tareas T2 y T3 no deben ejecutarse en paralelo por la firma de `getTask`; T4 es independiente.
  T5 debe esperar T3 y T4. T6/T7 son seriales con T5.

## Verificación

- `npm run typecheck`
- `npm run lint`
- Validación manual del request: confirmar que la URL sea `/tasks/tasks/{id}` sin `?groupId=`.
- Validación manual de caché: entrar desde el listado, volver atrás y reabrir el mismo detalle;
  confirmar que la key conserva grupo + task y que una mutación no deja un objeto legacy parcial.
- Validación manual de UI: título, estado, `typeName`/`typeCode`, descripción ausente, responsable
  ausente, `parentTaskId`, precio, monto total, fechas, subtasks completas/incompletas y estado vacío.
- Validación manual de errores: parámetros faltantes, loading, error de red/servidor, 404,
  reintento exitoso y acciones no disponibles antes de una task válida.
- Validación manual de navegación: `router.back()`, gestión de subtasks con `id`/`taskId` correctos,
  conservar `Mark done` y `Delete task` sin cambiar sus contratos.