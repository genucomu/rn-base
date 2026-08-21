# Plan: API de tareas

## Referencia

- Spec: `docs/specs/tasks-api.md`

## Cambios por archivo

| Archivo | Acción | Descripción |
| --- | --- | --- |
| `src/features/tasks/types.ts` | crear | Definición de `Task`, filtros y payloads de creación/edición. |
| `src/features/tasks/api.ts` | crear | Endpoints para list, detail, create, update y remove de tareas. |
| `src/features/tasks/queries.ts` | crear | Hooks de TanStack Query con invalidación por `groupId` y filtros. |
| `src/features/tasks/index.ts` | crear | Export del módulo. |
| `src/app/(tabs)/groups/[id]/tasks.tsx` | crear | Pantalla de listado de tareas por grupo. |
| `src/app/(tabs)/groups/[id]/tasks/[taskId].tsx` | crear | Pantalla de detalle de tarea y subtareas asociadas. |
| `src/features/groups/types.ts` | revisar | Ajustar vínculo de grupos y tareas si se comparte modelado. |

## Descomposición en tareas

1. **T1 — Definir el modelo de tarea**: archivos que toca: `src/features/tasks/types.ts`; incluir `status`, `priority`, `assigneeId`, `dueDate`, `groupId` y timestamps.
2. **T2 — Crear la capa HTTP de tareas**: archivos que toca: `src/features/tasks/api.ts`; implementar `listTasks`, `getTask`, `createTask`, `updateTask` y `deleteTask` con manejo de filtros por estado y prioridad.
3. **T3 — Hooks de query y mutation**: archivos que toca: `src/features/tasks/queries.ts`; definir `useTasks`, `useTask`, `useCreateTask`, `useUpdateTask`, `useDeleteTask` con `queryKey` por `groupId`.
4. **T4 — Pantalla de listado**: archivos que toca: `src/app/(tabs)/groups/[id]/tasks.tsx`; construir filtros, empty state, cards de tareas y actions de navegar al detalle.
5. **T5 — Pantalla de detalle**: archivos que toca: `src/app/(tabs)/groups/[id]/tasks/[taskId].tsx`; mostrar metadata, estado, due date, descripción y navegación a subtareas.
6. **T6 — Validación de concurrencia y estados**: archivos que toca: `src/features/tasks/*` y pantallas asociadas; asegurar que cambios de estado y mutaciones no rompan la lista ni el detalle.

## Librerías / dependencias

- No requiere dependencias nuevas.
- Debe reutilizar el cliente HTTP base ya definido en la refactorización.

## Riesgos / dependencias

- La API puede devolver `status` como `todo`/`in_progress`/`done`/`blocked` o un conjunto distinto; el modelado del frontend debe centralizar este mapping.
- El cálculo del progreso de la tarea puede depender de subtareas, por lo que la pantalla de detalle debe recibir ese dato o derivarlo desde el backend.
- Si la colección de tareas crece, el listado de filtros necesita paginación o query params limitados; eso debe quedar definido antes de implementar la UI final.

## Verificación

- `npm run typecheck`
- `npm run lint:fix`
- Validación manual:
  - listado con filtros
  - Creación de tarea
  - cambio de estado y prioridad
  - eliminación de tarea
  - detalle con metadata y due date
