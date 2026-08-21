# API de Subtasks

## Contexto / Problema

Las subtareas (subtasks) son un componente fundamental del sistema de gestión de tareas. Las subtareas pertenecen a tareas (tasks) y permiten descomponer una tarea en pasos más pequeños y accionables. La API expone endpoints para gestionar subtareas según la documentación en http://192.168.1.39:3000/api/docs#/Tasks. Actualmente no existe implementación de servicios ni hooks de TanStack Query para subtareas.

## Objetivos

- Implementar el servicio de API (`src/lib/api/subtasks.ts`) que abstrae las llamadas HTTP al backend para subtareas.
- Crear hooks de TanStack Query (`src/hooks/use-subtasks.ts` y `src/hooks/use-subtask-mutations.ts`) que exponen los queries y mutations para las operaciones de subtareas.
- Definir los tipos TypeScript para Subtask en `src/lib/api/types.ts`.
- Configurar el cache de TanStack Query para optimizar las peticiones de subtareas.
- Seguir las convenciones del proyecto: estado de servidor en TanStack Query, servicios en `src/lib/api/`, hooks en `src/hooks/`.

## No-objetivos

- Implementar las pantallas que consumen estos hooks (lo hará otra iteración).
- Implementar el cliente HTTP base (se asume que ya existe en `src/lib/api/client.ts`).
- Implementar servicios de Groups o Tasks (ya están o estarán en sus propias specs).
- Manejo de refresh token automático (se asume token válido).
- Implementación de offline-first o cache avanzado (solo cache por defecto de TanStack Query).
- Paginación, infinite scroll o filtros complejos (solo operaciones básicas CRUD).

## Supuestos

- La API está accesible en http://192.168.1.39:3000/api (URL base configurable).
- La API expone endpoints RESTful para Subtasks según la documentación en Swagger.
- El token de autenticación se envía en el header `Authorization: Bearer <token>` a través del cliente HTTP existente.
- El cliente HTTP (`src/lib/api/client.ts`) ya está implementado y configurado.
- Los tipos TypeScript para Task ya están definidos (Subtask tiene relación con Task).
- TanStack Query v5 ya está configurado en `src/lib/query-client.ts`.
- Subtasks pertenecen a Tasks (relación taskId → Task).
- El backend permite eliminar tareas con subtareas (o maneja la cascada de eliminación).

## Requerimientos funcionales

- [ ] **RF-1: Tipos TypeScript** — Definir interfaces en `src/lib/api/types.ts` para `Subtask`, `CreateSubtaskInput` y `UpdateSubtaskInput` según la documentación de la API.
- [ ] **RF-2: Servicio de Subtasks** — Crear `src/lib/api/subtasks.ts` con funciones para:
  - GET /tasks/:taskId/subtasks → Listado de subtareas de una tarea
  - GET /subtasks/:id → Detalle de una subtarea
  - POST /tasks/:taskId/subtasks → Crear nueva subtarea
  - PUT /subtasks/:id → Actualizar subtarea existente
  - DELETE /subtasks/:id → Eliminar subtarea
- [ ] **RF-3: Hook de queries de Subtasks** — Crear `src/hooks/use-subtasks.ts` con hooks `useSubtasks` (por taskId) y `useSubtask` (por ID) usando `useQuery`.
- [ ] **RF-4: Hook de mutations de Subtasks** — Crear `src/hooks/use-subtask-mutations.ts` con hooks `useCreateSubtask`, `useUpdateSubtask`, `useDeleteSubtask`.
- [ ] **RF-5: Invalidación de cache** — Configurar `onSuccess` en las mutations para invalidar queries relevantes de subtasks y tasks.

## Requerimientos no funcionales

- **Tipeado**: Todo el código debe pasar `npm run typecheck` sin errores. Interfaces deben reflejar exactamente los contratos de la API.
- **Estilos**: Biome (spaces/2, single quotes, semicolons always, trailing commas all, lineWidth 100).
- **Performance**: Configurar `staleTime` razonable (ej. 5 min) para reducir peticiones innecesarias. Usar `enabled: !!taskId` para evitar queries con IDs vacíos.
- **Seguridad**: El token se inyecta a través del cliente HTTP existente. No se hardcodea.
- **Manejo de errores**: Los servicios lanzan errores con mensajes claros. Los hooks exponen `error` para que las pantallas puedan mostrar feedback.
- **Testing**: El código debe ser testeable (inyectar cliente HTTP mockable en tests futuros).

## Datos / API

### Endpoints (según documentación Swagger en /api/docs#/Tasks)

**NOTA**: Revisar la documentación en http://192.168.1.39:3000/api/docs#/Tasks para ajustar nombres exactos y payloads. A continuación se asume una estructura RESTful típica:

```
GET    /api/tasks/:taskId/subtasks  → Listado de subtareas de una tarea
GET    /api/subtasks/:id            → Detalle de una subtarea
POST   /api/tasks/:taskId/subtasks  → Crear nueva subtarea
PUT    /api/subtasks/:id            → Actualizar subtarea existente
DELETE /api/subtasks/:id            → Eliminar subtarea
```

### Tipos TypeScript (ejemplo, ajustar según docs reales)

```ts
// src/lib/api/types.ts

export interface Subtask {
  id: string;
  taskId: string;
  title: string;
  description?: string;
  status: 'pending' | 'completed';
  createdAt: string;
  updatedAt: string;
}

export interface CreateSubtaskInput {
  taskId: string;
  title: string;
  description?: string;
  status?: Subtask['status'];
}

export interface UpdateSubtaskInput {
  title?: string;
  description?: string;
  status?: Subtask['status'];
}
```

### Servicio de Subtasks (`src/lib/api/subtasks.ts`)

```ts
import { request } from './client';
import type { Subtask, CreateSubtaskInput, UpdateSubtaskInput } from './types';

export const subtasksApi = {
  listByTask: (taskId: string) => request<Subtask[]>(`/tasks/${taskId}/subtasks`),
  get: (id: string) => request<Subtask>(`/subtasks/${id}`),
  create: (taskId: string, data: Omit<CreateSubtaskInput, 'taskId'>) =>
    request<Subtask>(`/tasks/${taskId}/subtasks`, {
      method: 'POST',
      body: JSON.stringify({ ...data, taskId }),
    }),
  update: (id: string, data: UpdateSubtaskInput) => request<Subtask>(`/subtasks/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id: string) => request<void>(`/subtasks/${id}`, {
    method: 'DELETE',
  }),
};
```

### Hooks de Queries de Subtasks (`src/hooks/use-subtasks.ts`)

```ts
import { useQuery } from '@tanstack/react-query';
import { subtasksApi } from '@/lib/api/subtasks';
import type { Subtask } from '@/lib/api/types';

export function useSubtasks(taskId: string) {
  return useQuery({
    queryKey: ['subtasks', taskId],
    queryFn: () => subtasksApi.listByTask(taskId),
    enabled: !!taskId,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

export function useSubtask(id: string) {
  return useQuery({
    queryKey: ['subtasks', id],
    queryFn: () => subtasksApi.get(id),
    enabled: !!id,
  });
}
```

### Hooks de Mutations de Subtasks (`src/hooks/use-subtask-mutations.ts`)

```ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { subtasksApi } from '@/lib/api/subtasks';
import type { CreateSubtaskInput, UpdateSubtaskInput } from '@/lib/api/types';

export function useCreateSubtask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, data }: { taskId: string; data: Omit<CreateSubtaskInput, 'taskId'> }) =>
      subtasksApi.create(taskId, data),
    onSuccess: (_, { taskId }) => {
      queryClient.invalidateQueries({ queryKey: ['subtasks', taskId] });
      queryClient.invalidateQueries({ queryKey: ['tasks', taskId] });
    },
  });
}

export function useUpdateSubtask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateSubtaskInput }) =>
      subtasksApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['subtasks'] });
      queryClient.invalidateQueries({ queryKey: ['subtasks', id] });
    },
  });
}

export function useDeleteSubtask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => subtasksApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subtasks'] });
    },
  });
}
```

## UI / Navegación

Esta spec no incluye cambios en UI ni navegación. Los hooks creados serán consumidos por pantallas en iteraciones futuras:
- Detalle de tarea con lista de subtareas
- Formularios de creación/edición para subtasks
- Gestión de estado de subtasks (marcar como completada/pendiente)

## Manejo de errores y edge cases

| Caso | Comportamiento |
| --- | --- |
| Error de red (sin conexión) | El cliente lanza error con mensaje. El hook expone `error` para que la pantalla muestre feedback. |
| 401 (no autorizado) | El cliente lanza error. El interceptor global (ya existente en query-client) maneja logout y redirect. |
| 403 (forbidden) | El cliente lanza error. Ocurre cuando el usuario intenta acceder/eliminar una subtarea que no le pertenece. |
| 404 (recurso no encontrado) | El cliente lanza error. El hook `useSubtask` debe manejar este caso (opcional: mostrar estado "no encontrado"). |
| 500 (error del servidor) | El cliente lanza error. La pantalla muestra mensaje genérico. |
| Token no disponible | El cliente no envía header `Authorization`. Si el endpoint requiere auth, el backend responde 401. |
| Query con ID vacío | `useSubtask(id)` usa `enabled: !!id` para no ejecutar query hasta que haya ID válido. |
| Query con taskId vacío | `useSubtasks(taskId)` usa `enabled: !!taskId` para no ejecutar query hasta que haya taskId válido. |
| Mutation fallida | El hook expone `error`. La pantalla debe mostrar feedback inline. El estado previo de TanStack Query no se modifica. |
| Eliminar tarea con subtareas | Si el backend permite eliminar tareas con subtareas, se invalidan queries de subtasks. Si no, devuelve 400/409. |

## Estrategia de testing

- **Typecheck**: `npm run typecheck` debe pasar sin errores tras los cambios.
- **Lint**: `npm run lint:fix` debe pasar sin warnings.
- **Pruebas manuales** (requiere backend accesible):
  1. Usar `useSubtasks(taskId)` → debe listar subtareas de una tarea.
  2. Usar `useCreateSubtask` → debe crear subtarea y refrescar lista.
  3. Usar `useUpdateSubtask` → debe actualizar subtarea y refrescar lista/detalle.
  4. Usar `useDeleteSubtask` → debe eliminar subtarea y refrescar lista.
  5. Verificar que el token se envía en header (inspeccionar network).
  6. Simular 401 → debe activar interceptor global (logout).
  7. Simular 403 → debe mostrar error de permisos.
- **Pruebas unitarias** (futuro): Mock del cliente HTTP para testear servicios y hooks sin backend real.

## Preguntas abiertas

- **URL base exacta**: ¿Es `http://192.168.1.39:3000/api` o otra variante? Se usará la constante existente en `src/constants/api.ts`.
- **Autenticación**: ¿La API requiere token para todos los endpoints de subtasks o algunos son públicos? El cliente envía token solo si existe.
- **Estructura de entidades**: ¿Los campos exactos de Subtask son los asumidos? Revisar docs de Swagger.
- **Cascada de eliminación**: ¿El backend permite eliminar tareas con subtareas, o requiere eliminar subtareas primero?
- **Paginación**: ¿Los endpoints GET soportan paginación? Si es así, se extenderá en iteración futura.
- **Filtros**: ¿Los endpoints GET soportan filtros (status, búsqueda)? Se extenderá en iteración futura.

## Criterios de aceptación

### Tipos TypeScript
- [ ] Los tipos en `src/lib/api/types.ts` definen interfaces para `Subtask`, `CreateSubtaskInput` y `UpdateSubtaskInput`.
- [ ] Los tipos reflejan los contratos de la API según la documentación de Swagger.

### Servicio de API
- [ ] El servicio `src/lib/api/subtasks.ts` implementa funciones para CRUD de subtasks por tarea.
- [ ] El servicio usa el cliente HTTP existente (`src/lib/api/client.ts`).

### Hooks de Queries
- [ ] El hook `useSubtasks(taskId)` usa `useQuery` con `queryKey: ['subtasks', taskId]`, `enabled: !!taskId` y `staleTime` configurado.
- [ ] El hook `useSubtask(id)` usa `useQuery` con `queryKey: ['subtasks', id]` y `enabled: !!id`.

### Hooks de Mutations
- [ ] El hook `useCreateSubtask` invalida queries `['subtasks', taskId]` y `['tasks', taskId]` en `onSuccess`.
- [ ] El hook `useUpdateSubtask` invalida queries `['subtasks']` y `['subtasks', id]` en `onSuccess`.
- [ ] El hook `useDeleteSubtask` invalida queries `['subtasks']` en `onSuccess`.

### Calidad de Código
- [ ] `npm run typecheck` pasa sin errores.
- [ ] `npm run lint:fix` pasa sin warnings.
- [ ] El código sigue las convenciones de Biome (espacios, comillas, semicolons, etc.).
