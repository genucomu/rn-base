# Plan: Crear tasks desde un grupo

## Referencia

- Spec aprobada: `docs/specs/crear-tasks.md`
- Arquitectura: Expo Router + NativeWind, TanStack Query v5, HTTP wrapper en `src/services/http.ts`.

## Evidencia y decisiones

- `src/app/groups/[id]/tasks.tsx` lista con `useTasks(groupId)` pero hoy ejecuta `useCreateTask(groupId)` con un payload hardcodeado. El botón debe navegar a una pantalla dedicada, no mutar desde el listado.
- Ya existe la ruta hermana `src/app/groups/[id]/tasks/[taskId].tsx`; `src/app/groups/[id]/tasks/new.tsx` es consistente con el árbol de Expo Router y no requiere cambios en tabs ni en el detalle del grupo.
- `src/features/tasks/types.ts` no contiene `typeId` ni `priceCents`, y `assigneeId` es opcional. Debe alinearse con el body de creación: `typeId: string`, `title: string`, `description: string`, `priceCents: number`, `assigneeId: string | null`.
- No hay `TaskType`, endpoint, service, hook ni catálogo de tipos en `src/`; el feedback aprobado agrega `GET /tasks/task-types`. El catálogo debe incorporarse al módulo de tasks: tipo de respuesta en `src/features/tasks/types.ts`, función de API en `src/features/tasks/api.ts`, hook `useTaskTypes()` en `src/features/tasks/queries.ts` y key dedicada en `src/lib/query-keys.ts`.
- No se debe pedir un UUID manual ni inventar una lista local: el formulario seleccionará una opción del catálogo y enviará su `id` como `typeId`. Como no existe un componente Select/Picker reutilizable en `src/components/ui/`, el selector se implementará dentro de la nueva pantalla con controles nativos existentes, manteniendo el alcance acotado.
- `useGroup(groupId)` obtiene `Group.members` mediante `/tasks/groups/:id/members`, aunque ante error devuelve el grupo sin miembros. El formulario debe ofrecer siempre “sin asignar” y mostrar los miembros disponibles cuando existan; no debe bloquear la creación por la ausencia de esa lista.
- `src/features/tasks/api.ts` ya usa `http.post<Task>('/tasks/tasks', ...)`; debe dejar de omitir `assigneeId: null`, `typeId` y `priceCents`, sin modificar los stubs de update/delete/get fuera de alcance.
- `useCreateTask` ya invalida `queryKeys.tasks.list(task.groupId)` después del éxito y conserva el guard de `groupId`; el formulario debe reutilizarlo y navegar solo desde `onSuccess`.

## Cambios por archivo

| Archivo | Acción | Descripción |
| --- | --- | --- |
| `src/features/tasks/types.ts` | modificar | Extender `Task` con `typeId` y `priceCents`; definir `CreateTaskInput` con los cinco campos del formulario y nullabilidad explícita de `assigneeId`. Alinear `description` con el contrato remoto confirmado; no alterar `UpdateTaskInput` salvo que el tipo compartido lo exija para compilar. |
| `src/features/tasks/api.ts` | modificar | Mantener `createTask(groupId, input): Promise<Task>` y enviar exactamente `{ groupId, typeId, title, description, priceCents, assigneeId }` mediante `http.post`; agregar `listTaskTypes(): Promise<TaskType[]>` con `GET /tasks/task-types`. Conservar el trim/guard de `groupId`, no convertir precio a string ni eliminar `null`; propagar errores HTTP. |
| `src/features/tasks/queries.ts` | modificar | Agregar `useTaskTypes()` con `useQuery` sobre `listTaskTypes`, key centralizada y estado de carga/error; conservar `useCreateTask(groupId)`, su guard y la invalidación por `task.groupId`; no cambiar update/delete. |
| `src/app/groups/[id]/tasks.tsx` | modificar | Reemplazar la mutación hardcodeada por navegación a `'/groups/[id]/tasks/new'` con el mismo `groupId`. Mantener listado, empty state y regreso al nivel anterior; evitar crear tareas desde esta pantalla. |
| `src/app/groups/[id]/tasks/new.tsx` | crear | Implementar el formulario local para título, descripción multilinea, selector de tipo basado en `useTaskTypes()`, `priceCents` y responsable. Usar `useLocalSearchParams`, `useGroup` y `useCreateTask`; validar antes de mutar, mostrar loading/error de catálogo y submit, conservar valores en error y navegar a `'/groups/[id]/tasks'` únicamente en éxito. Incluir labels/accessibilityLabel, teclado numérico para precio, `ScrollView` y controles deshabilitados durante el submit o mientras no haya un tipo seleccionado válido. |
| `src/lib/query-keys.ts` | modificar | Agregar `queryKeys.tasks.types` bajo el namespace existente para cachear `GET /tasks/task-types`; mantener las keys de list/detail sin cambios y no usar strings inline. |
| `src/types/api.ts` | no modificar | La implementación de tasks usa `src/features/tasks/types.ts`; no duplicar el contrato allí. |

## Descomposición en tareas ejecutables

1. **T1 — Confirmar y tipar los contratos de tasks**: modificar `src/features/tasks/types.ts` y revisar usos de `Task`/`CreateTaskInput`. Representar `TaskType` con el `id` UUID y los campos de presentación que devuelva `GET /tasks/task-types`, además de `typeId`, `priceCents`, `description` requerido según el DTO remoto y `assigneeId: string | null`. Confirmar el shape de la colección (array directo o envelope) y que la respuesta de creación contiene `groupId` y los campos mínimos antes de usarla para invalidación. **Sin dependencias.**

2. **T2 — Implementar API de creación y catálogo**: modificar `src/features/tasks/api.ts`. Construir el body con los seis campos requeridos, preservando `assigneeId: null`, `priceCents` numérico y el `groupId` de la ruta; usar `http.post<Task>('/tasks/tasks', body)`. Agregar `listTaskTypes()` con `http.get` a `'/tasks/task-types'`, tipado con el shape confirmado en T1. No tocar las implementaciones locales de get/update/delete. **Requiere T1. Conflicto de archivo: ninguno fuera de T1; si T1 cambia la firma mientras se implementa, serializar ambas tareas.**

3. **T3 — Consultar tipos con TanStack Query**: modificar `src/features/tasks/queries.ts` y `src/lib/query-keys.ts`. Exponer `useTaskTypes()` con `queryKeys.tasks.types`, `listTaskTypes`, caché normal de catálogo y estados de query; asegurar que `useCreateTask(groupId)` recibe el nuevo input, rechaza `groupId` ausente y, tras una respuesta válida, invalida `queryKeys.tasks.list(task.groupId)`. No hacer actualización optimista ni navegación dentro del hook. **Requiere T1 y T2. Comparte `src/features/tasks/queries.ts` solo con esta tarea.**

4. **T4 — Separar el punto de entrada del formulario**: modificar `src/app/groups/[id]/tasks.tsx` para que `+ Create task` y el empty state naveguen a `tasks/new` con `id`. El listado no debe llamar a `mutate` ni fabricar títulos/descripciones. **Puede ejecutarse después de T3; conflicto de archivo exclusivo de esta tarea.**

5. **T5 — Implementar formulario, selector y navegación**: crear `src/app/groups/[id]/tasks/new.tsx`. Mantener el estado en `useState`, inicializar responsable en `null` y tipo sin seleccionar, cargar opciones con `useTaskTypes()` y mostrar cada label/nombre disponible asociado a su UUID. El selector debe contemplar carga, error, catálogo vacío y opción seleccionada; no permitir texto libre ni enviar el label como `typeId`. Validar título/descripción no vacíos, que `typeId` pertenezca al catálogo cargado, entero `priceCents >= 0` dentro de `Number.MAX_SAFE_INTEGER` y UUID del responsable cuando no sea `null`. Obtener miembros con `useGroup`; representar “Sin asignar” como `null`; si no hay miembros, dejar disponible esa opción y no inventar nombres. En `onSuccess`, limpiar si corresponde y volver al listado; en `onError`, conservar inputs y mostrar el mensaje. **Requiere T3 y T4. Conflicto: archivo nuevo, sin conflicto; depende de los nombres de ruta definidos en T4.**

6. **T6 — Verificar integración y casos críticos**: ejecutar `npm run typecheck` y `npm run lint`. Revisar manualmente web y una plataforma nativa: abrir desde grupo, completar UUID de tipo, crear con/sin responsable, comprobar loading/doble submit, retorno al listado invalidado y conservación del formulario ante error. Si existe infraestructura de tests, agregar solo pruebas focalizadas del body exacto, validaciones y navegación post-éxito. **Requiere T1–T5.**

## Dependencias y conflictos

- Orden recomendado: `T1 -> T2 -> T3 -> (T4 y preparación UI) -> T5 -> T6`.
- `T1`, `T2` y `T3` comparten el contrato de tasks; deben serializarse si se modifican tipos en la misma iteración.
- `T4` toca exclusivamente `src/app/groups/[id]/tasks.tsx`; `T5` crea exclusivamente `src/app/groups/[id]/tasks/new.tsx`, por lo que no hay conflicto de edición entre ambas después de acordar la ruta.
- `src/features/groups/*` no se modifica: `useGroup` y `Group.members` ya aportan la fuente de responsables.
- No modificar `src/services/http.ts`, `src/lib/query-keys.ts`, tabs, autenticación, stores globales ni agregar librerías.

## Reglas del formulario

- `groupId` proviene de la ruta, se muestra como contexto no editable y nunca se pide al usuario.
- `typeId` se obtiene exclusivamente de la opción elegida en `useTaskTypes()`. El usuario ve el nombre/label del catálogo, mientras el submit conserva y envía el UUID asociado; no hay `TextInput` de UUID ni catálogo local.
- El selector de task type debe usar `Pressable`/`Button` y estado local de selección, o un control nativo ya disponible si aparece durante la implementación. No agregar una librería de formularios ni un componente global nuevo solo para este selector.
- `description` se conserva tal como fue ingresada después de validar la obligatoriedad del contrato; el trim puede usarse para decidir vacío, pero no para reemplazar el texto enviado sin una decisión del contrato.
- `priceCents` se parsea como entero base 10 y se envía como `number`; rechazar vacío, decimal, negativo, símbolos monetarios y valores fuera del rango seguro.
- `assigneeId` se envía siempre: UUID del miembro seleccionado o `null` para “Sin asignar”.
- El submit queda deshabilitado durante `isPending`; la navegación no ocurre antes de la respuesta exitosa.

## Librerías / dependencias

- No agregar dependencias. Usar `TextInput`, `ScrollView`, `Pressable` o el `Button` existente, `ActivityIndicator`, NativeWind/estilos locales y Expo Router.

## Riesgos

- Si el backend no devuelve `typeId`, `priceCents`, `description` o `assigneeId` con la forma esperada, detener el ajuste de tipos en T1 y documentar el shape real antes de implementar T2/T5.
- Si `GET /tasks/task-types` devuelve un envelope, nombres de campos distintos o un catálogo vacío, adaptar `TaskType`/`listTaskTypes` al contrato real y mantener el formulario bloqueado hasta tener una opción válida; no caer silenciosamente a UUID manual.
- Si `useGroup` falla al cargar miembros, el formulario puede crear sin responsable, pero no debe presentar opciones de miembros inexistentes.
- Un error 401/400/422 debe provenir del cliente HTTP, conservar los valores y no reintentar automáticamente la creación desde la pantalla.

## Verificación

- `npm run typecheck`
- `npm run lint`
- `git diff --check -- docs/plans/crear-tasks.md`
- Prueba manual de navegación, carga/error/vacío del catálogo de tipos, selección que envía el UUID correcto, validación, payload, invalidación y estados de error según T6.