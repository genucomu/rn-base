# Plan: API de subtareas

## Referencia

- Spec: `docs/specs/subtasks-api.md`

## Cambios por archivo

| Archivo | Acción | Descripción |
| --- | --- | --- |
| `src/features/subtasks/types.ts` | crear | Definición de `Subtask`, payloads y ordenamiento. |
| `src/features/subtasks/api.ts` | crear | Endpoints de list, create, update, delete y reorder. |
| `src/features/subtasks/queries.ts` | crear | Hooks de TanStack Query para la colección de subtareas. |
| `src/features/subtasks/index.ts` | crear | Export del módulo. |
| `src/app/(tabs)/groups/[id]/tasks/[taskId]/subtasks.tsx` | crear | Pantalla de gestión de subtareas dentro del detalle de tarea. |
| `src/features/tasks/types.ts` | revisar | Verificar cómo refleja la tarea principal el progreso de subtareas. |
| `src/features/tasks/queries.ts` | revisar | Invalidar la tarea principal cuando cambia el estado de subtareas. |

## Descomposición en tareas

1. **T1 — Modelar `Subtask`**: archivos que toca: `src/features/subtasks/types.ts`; definir `id`, `taskId`, `title`, `status`, `order`, y campos de timestamp. La parte clave es dejar explícito el orden de visualización.
2. **T2 — API de subtareas**: archivos que toca: `src/features/subtasks/api.ts`; crear endpoints para listar, crear, actualizar y borrar subtareas, con una ruta de reorder si la UX lo necesita.
3. **T3 — Hooks de consulta/mutación**: archivos que toca: `src/features/subtasks/queries.ts`; `useSubtasks`, `useCreateSubtask`, `useUpdateSubtask`, `useDeleteSubtask` y `useReorderSubtasks` con invalidación del detalle de la tarea.
4. **T4 — UI de subtareas**: archivos que toca: `src/app/(tabs)/groups/[id]/tasks/[taskId]/subtasks.tsx`; crear checklist con estado finalizado y visual feedback para `todo`/`done`/`blocked`.
5. **T5 — Sincronización con la tarea padre**: archivos que toca: `src/features/tasks/queries.ts`, `src/features/tasks/types.ts`; recalcular progreso y reflejar el estado de la tarea principal cuando cambia la colección de subtareas.
6. **T6 — Verificación de edge cases**: archivos que toca: `src/features/subtasks/*` y pantallas relevantes; cubrir título vacío, reordenamientos, eliminación y errores de validación.

## Librerías / dependencias

- No requiere librerías nuevas.
- La implementación debe correr sobre el cliente HTTP centralizado y la estructura de queries actual.

## Riesgos / dependencias

- El backend puede manejar reorder con un endpoint específico o por actualización incremental; el plan debe dejar espaciado para ambas estrategias mientras se mantiene una API consistente.
- El progreso de la tarea principal puede depender del backend o del cliente; la implementación debe documentar la fuente de verdad para evitar inconsistencias.
- La estructura exacta de `status` puede variar (`done`, `todo`, `blocked`), por lo que debe mapearese en el módulo antes de renderizar la UI.

## Verificación

- `npm run typecheck`
- `npm run lint:fix`
- Validación manual:
  - crear subtarea válida
  - completar subtarea
  - reordenar lista
  - borrar subtarea
  - manejar error por título vacío
