# Plan: Crear tareas mediante API

## Referencia
- Spec: `docs/specs/crear-tareas.md`
- Alcance: service, tipos, mutación/hook y query keys para crear tareas mediante `POST /tasks/tasks`.
- Fuera de alcance: pantallas, formularios, componentes, navegación, tabs, listado funcional más allá de sus keys e implementación de update/delete.

## Estado actual relevante
- `src/features/tasks/api.ts` usa un arreglo local para `getTask`, `createTask`, `updateTask` y `deleteTask`; `listTasks` ya consulta `GET /tasks/tasks` mediante `src/services/http.ts`.
- `createTask` conserva validación/normalización local de `title`, agrega defaults locales y simula latencia; debe reemplazarse únicamente para creación.
- `src/features/tasks/queries.ts` tiene `useCreateTask`, pero define `TASKS_KEY` local y el listado/detalle/mutaciones restantes usan keys inline.
- `src/lib/query-keys.ts` todavía no tiene namespace de tareas.
- `src/features/tasks/types.ts` ya define `Task`, `CreateTaskInput` y `UpdateTaskInput`; no requiere ampliación prevista.
- `src/services/http.ts` expone `http.post<T>()`, serializa JSON, inyecta token y aplica refresh ante `401`.

## Cambios por archivo

| Archivo | Acción | Descripción |
| --- | --- | --- |
| `src/lib/query-keys.ts` | modificar | Agregar `queryKeys.tasks` con `all`, `list(groupId, params?)` y `detail(groupId, id)`, conservando separación por grupo y un tipo de filtros compatible con el listado. |
| `src/features/tasks/api.ts` | modificar | Reemplazar solo la implementación de `createTask` por `http.post<Task>('/tasks/tasks', body)`, validando `groupId` antes de llamar y omitiendo opcionales no informados del body. Retirar del flujo de creación el arreglo local, `wait`, generación de IDs, defaults de estado/timestamps y errores locales que ya no correspondan; conservar sin cambios el comportamiento de las operaciones fuera de alcance. |
| `src/features/tasks/queries.ts` | modificar | Importar y usar `queryKeys.tasks` para `useTasks`, `useTask` y la invalidación de `useCreateTask`; mantener el guard de `groupId`, el patrón `useMutation` y la invalidación basada en el `groupId` devuelto por la API. Eliminar `TASKS_KEY` y strings inline de keys de tareas en las rutas tocadas. |
| `src/features/tasks/types.ts` | revisar, modificar solo si es necesario | Confirmar que `Task` y `CreateTaskInput` cubren la respuesta y body del endpoint. Solo cambiar el contrato si la evidencia del API/OpenAPI exige una corrección; no agregar campos especulativos ni cambiar estados, prioridades o relaciones. |

## Descomposición en tareas

1. **T1 — Centralizar query keys de tareas**: modificar `src/lib/query-keys.ts`; definir `queryKeys.tasks.all`, `queryKeys.tasks.list(groupId, params?)` y `queryKeys.tasks.detail(groupId, id)`. Usar una forma de parámetros que permita status/priority y mantenga la coincidencia por prefijo para invalidar todas las variantes del listado de un grupo. No tocar UI ni crear keys inline nuevas. **Sin dependencias.**

2. **T2 — Conectar `createTask` con el endpoint remoto**: modificar `src/features/tasks/api.ts`; conservar la firma `createTask(groupId, input): Promise<Task>`, rechazar `groupId` ausente antes del request, conservar únicamente la validación/normalización cliente compatible ya existente para el título, construir `{ groupId, ...input }` omitiendo propiedades opcionales con valor `undefined`, y retornar directamente la respuesta de `http.post<Task>('/tasks/tasks', body)`. Eliminar del camino de creación el arreglo local, la espera artificial y la fabricación de la entidad. Propagar sin envolver los errores de `http`. **Requiere T1 solo si se modifica también la firma de filtros/tipos compartidos; de lo contrario puede ejecutarse en paralelo con T1. Conflicto de archivo: ninguno con T1.**

3. **T3 — Adaptar listado, detalle y mutación al namespace centralizado**: modificar `src/features/tasks/queries.ts`; reemplazar `TASKS_KEY` y las keys inline por `queryKeys.tasks.list(groupId, params?)` y `queryKeys.tasks.detail(groupId, id)`, manteniendo `useTasks` habilitado solo con `groupId`. Hacer que `useCreateTask` llame al service solo con `groupId` válido y que, en éxito, invalide el listado del `task.groupId` devuelto; no invalidar en error ni hacer actualización optimista. Revisar callbacks de update/delete únicamente para que no queden keys de tareas duplicadas, sin cambiar su comportamiento funcional. **Requiere T1 y T2. Conflicto de archivo: comparte `src/features/tasks/queries.ts` únicamente con esta tarea.**

4. **T4 — Validar contrato de tipos y comportamiento**: revisar `src/features/tasks/types.ts` frente a los usos de T2/T3 y modificarlo solo si el contrato remoto validado lo exige; ejecutar `npm run typecheck` y `npm run lint`. Si existe infraestructura de tests, agregar o ajustar únicamente pruebas de service/hook para verificar POST, body, respuesta tipada, invalidación por grupo y ausencia de invalidación ante error; no crear infraestructura nueva ni tocar UI. **Requiere T2 y T3. Conflictos: `src/features/tasks/types.ts` puede coincidir con una modificación contractual de T2; serializar si se cambia.**

## Dependencias y conflictos para paralelización

- **T1 → T3**: T3 consume el namespace creado por T1.
- **T2 → T3**: T3 depende de la firma y contrato de respuesta de `createTask` establecidos por T2.
- **T4 después de T2/T3**: la verificación debe ejecutarse sobre el conjunto integrado.
- **Archivos compartidos**: T1 solo toca `src/lib/query-keys.ts`; T2 solo toca `src/features/tasks/api.ts`; T3 solo toca `src/features/tasks/queries.ts`; T4 puede tocar `src/features/tasks/types.ts` únicamente ante una incompatibilidad demostrada. No hay conflictos entre T1, T2 y T3 mientras T3 se serialice después de las dos primeras.
- **No modificar**: `src/app/`, `src/components/`, tabs, navegación, `src/services/http.ts`, `package.json`, dependencias y almacenamiento global.

## Librerías / dependencias

- No agregar dependencias.
- Reutilizar `http` de `src/services/http.ts` y TanStack Query v5 ya instalado.
- No modificar `overrides.lightningcss` ni la configuración global del cliente HTTP.

## Decisiones de implementación

- El body del POST debe contener `groupId`, `title` y los campos definidos por `CreateTaskInput`; `description`, `priority`, `assigneeId` y `dueDate` se incluyen solo cuando fueron informados, evitando enviar `undefined` explícitamente.
- La respuesta del POST es la fuente de verdad y debe tiparse como `Task`; no se debe insertar manualmente en caché ni construir una tarea local.
- La invalidación debe apuntar a la key de listado del `groupId` devuelto. Una respuesta exitosa sin `groupId` debe tratarse como contrato inválido o impedir una invalidación ambigua, según el mecanismo de validación ya disponible; nunca invalidar una key global accidentalmente.
- Los filtros de `listTasks` deben conservarse como argumento opcional y, si se conectan a la key, deben representar la misma forma de parámetros usada por `useTasks`; no introducir cambios de API fuera de esta feature.

## Riesgos / preguntas abiertas

- Confirmar durante la implementación el contrato OpenAPI sobre si `groupId` pertenece al body del POST; este plan sigue la suposición de la spec: body `{ groupId, ...input }`.
- Confirmar si el backend devuelve siempre `groupId`. Si no lo hace, debe definirse una validación de contrato antes de invalidar, sin caer en una invalidación global.
- El service todavía contiene stubs locales para update/delete/get; no deben refactorizarse en este ciclo para evitar ampliar el alcance.
- Las pruebas automatizadas solo deben agregarse si ya existe infraestructura en el repositorio; no introducir un runner nuevo como parte de esta tarea.

## Verificación

- `npm run typecheck`
- `npm run lint`
- Si existe infraestructura de tests: prueba focalizada del service y de `useCreateTask`.
- Revisión final del diff: solo debe existir `docs/plans/crear-tareas.md` como archivo creado por esta solicitud; el implementer posterior deberá tocar únicamente las superficies indicadas arriba.
