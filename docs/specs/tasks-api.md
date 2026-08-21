# API de Tasks (Tareas)

## Contexto / Problema

La app no tiene implementados los servicios de integración con la API ni los hooks de TanStack Query para consumir dichos servicios para el recurso Tasks. La API está documentada en http://192.168.1.39:3000/api/docs#/Tasks y expone endpoints para gestionar tareas. Las tareas pertenecen a grupos, pero esta spec se enfoca exclusivamente en la implementación de los servicios y hooks de Tasks, asumiendo que el groupId se obtiene de otra fuente (screen, navigation o params).

## Objetivos

- Implementar el servicio de API (`src/lib/api/tasks.ts`) que abstrae las llamadas HTTP al backend para tareas.
- Crear hooks de TanStack Query (`src/hooks/`) que expongan los queries y mutations para las operaciones de Tasks.
- Configurar el cliente HTTP con soporte para autenticación (token) y manejo de errores.
- Implementar el modelo de datos de Task con sus relaciones (groupId).
- Seguir las convenciones del proyecto: estado de servidor en TanStack Query, servicios en `src/lib/api/`, hooks en `src/hooks/`.

## No-objetivos

- Implementar el servicio de Groups (se asume que el groupId se obtiene de otra fuente).
- Implementar el servicio de Subtasks (se enfoca solo en Tasks).
- Implementar las pantallas que consumen estos hooks (lo hará otra iteración).
- Manejo de refresh token automático (se asume token válido).
- Implementación de offline-first o cache avanzado (solo cache por defecto de TanStack Query).
- Paginación, infinite scroll o filtros complejos (solo operaciones básicas CRUD).
- Permisos granulares (role-based access control) - se asume que el usuario autenticado puede gestionar sus propios recursos.

## Supuestos

- La API está accesible en http://192.168.1.39:3000/api (URL base configurable).
- La API expone endpoints RESTful para Tasks según la documentación en Swagger.
- El token de autenticación (cuando exista) se envía en el header `Authorization: Bearer <token>`.
- La estructura de carpetas existente se respeta: `src/lib/api/` para servicios, `src/hooks/` para hooks.
- TanStack Query v5 ya está configurado en `src/lib/query-client.ts`.
- Tasks pertenecen a Groups (tienen un campo `groupId`).
- El groupId se pasa como parámetro a los hooks de queries (ej. `useTasks(groupId)`).

## Requerimientos funcionales

- [ ] **RF-1: Cliente HTTP base** — Crear `src/lib/api/client.ts` con una instancia de `fetch` o `axios` que:
  - Configure la base URL (`API_BASE_URL`).
  - Inyecte el header `Authorization` leyendo el token del auth-store (si existe).
  - Maneje respuestas de error de forma consistente (lanzar errores con mensaje).
- [ ] **RF-2: Servicio de Tasks** — Crear `src/lib/api/tasks.ts` con funciones para:
  - GET /tasks/groups/:groupId/tasks → Listado de tareas de un grupo
  - GET /tasks/:id → Detalle de una tarea
  - POST /tasks/groups/:groupId/tasks → Crear nueva tarea en un grupo
  - PUT /tasks/:id → Actualizar tarea existente
  - DELETE /tasks/:id → Eliminar tarea
- [ ] **RF-3: Hook de queries de Tasks** — Crear `src/hooks/use-tasks.ts` con hooks `useTasks` (por groupId), `useTask` (por ID) usando `useQuery`.
- [ ] **RF-4: Hook de mutations de Tasks** — Crear `src/hooks/use-task-mutations.ts` con hooks `useCreateTask`, `useUpdateTask`, `useDeleteTask`.
- [ ] **RF-5: Constante de API_BASE_URL** — Definir `API_BASE_URL` en `src/constants/api.ts` (o similar) para centralizar la configuración.
- [ ] **RF-6: Tipos TypeScript** — Definir interfaces en `src/lib/api/types.ts` para `Task` y sus respectivos Input types según la documentación de la API.

## Requerimientos no funcionales

- **Tipeado**: Todo el código debe pasar `npm run typecheck` sin errores. Interfaces deben reflejar exactamente los contratos de la API.
- **Estilos**: Biome (spaces/2, single quotes, semicolons always, trailing commas all, lineWidth 100).
- **Performance**: Configurar `staleTime` razonable (ej. 5 min) para reducir peticiones innecesarias. Usar `select` en queries cuando solo se necesita parte de los datos.
- **Seguridad**: El token se obtiene del auth-store (Zustand). No se hardcodea. El cliente no expone el token en logs ni errores.
- **Manejo de errores**: Los servicios lanzan errores con mensajes claros. Los hooks exponen `error` para que las pantallas puedan mostrar feedback.
- **Testing**: El código debe ser testeable (inyectar cliente HTTP mockable en tests futuros).

## Datos / API

### Endpoints (según documentación Swagger en /api/docs#/Tasks)

**NOTA**: Revisar la documentación en http://192.168.1.39:3000/api/docs#/Tasks para ajustar nombres exactos y payloads. A continuación se asume una estructura RESTful típica:

#### Tasks
```
GET    /api/tasks/groups/:groupId/tasks  → Listado de tareas de un grupo
GET    /api/tasks/:id                     → Detalle de una tarea
POST   /api/tasks/groups/:groupId/tasks  → Crear nueva tarea en un grupo
PUT    /api/tasks/:id                     → Actualizar tarea existente
DELETE /api/tasks/:id                     → Eliminar tarea
```

### Tipos TypeScript (ejemplo, ajustar según docs reales)

```ts
// src/lib/api/types.ts

// Tasks
export interface Task {
  id: string;
  groupId: string;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed';
  priority?: 'low' | 'medium' | 'high';
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskInput {
  groupId: string;
  title: string;
  description?: string;
  status?: Task['status'];
  priority?: Task['priority'];
  dueDate?: string;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  status?: Task['status'];
  priority?: Task['priority'];
  dueDate?: string;
}
```

### Cliente HTTP (`src/lib/api/client.ts`)

```ts
import { API_BASE_URL } from '@/constants/api';

export async function request<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const token = authStore.getState().token; // Importar auth-store

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Error desconocido' }));
    throw new Error(error.message || `Error ${response.status}`);
  }

  return response.json();
}
```

### Servicio de Tasks (`src/lib/api/tasks.ts`)

```ts
import { request } from './client';
import type { Task, CreateTaskInput, UpdateTaskInput } from './types';

export const tasksApi = {
  listByGroup: (groupId: string) => request<Task[]>(`/tasks/groups/${groupId}/tasks`),
  get: (id: string) => request<Task>(`/tasks/${id}`),
  create: (groupId: string, data: Omit<CreateTaskInput, 'groupId'>) =>
    request<Task>(`/tasks/groups/${groupId}/tasks`, {
      method: 'POST',
      body: JSON.stringify({ ...data, groupId }),
    }),
  update: (id: string, data: UpdateTaskInput) => request<Task>(`/tasks/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id: string) => request<void>(`/tasks/${id}`, {
    method: 'DELETE',
  }),
};
```

### Hooks de Queries de Tasks (`src/hooks/use-tasks.ts`)

```ts
import { useQuery } from '@tanstack/react-query';
import { tasksApi } from '@/lib/api/tasks';
import type { Task } from '@/lib/api/types';

export function useTasks(groupId: string) {
  return useQuery({
    queryKey: ['tasks', groupId],
    queryFn: () => tasksApi.listByGroup(groupId),
    enabled: !!groupId,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

export function useTask(id: string) {
  return useQuery({
    queryKey: ['tasks', id],
    queryFn: () => tasksApi.get(id),
    enabled: !!id,
  });
}
```

### Hooks de Mutations de Tasks (`src/hooks/use-task-mutations.ts`)

```ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { tasksApi } from '@/lib/api/tasks';
import type { CreateTaskInput, UpdateTaskInput } from '@/lib/api/types';

export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ groupId, data }: { groupId: string; data: Omit<CreateTaskInput, 'groupId'> }) =>
      tasksApi.create(groupId, data),
    onSuccess: (_, { groupId }) => {
      queryClient.invalidateQueries({ queryKey: ['tasks', groupId] });
    },
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTaskInput }) =>
      tasksApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['tasks', id] });
    },
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => tasksApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}
```

## UI / Navegación

Esta spec no incluye cambios en UI ni navegación. Los hooks creados serán consumidos por pantallas en iteraciones futuras:
- Lista de tareas de un grupo
- Detalle de tarea
- Formularios de creación/edición de tareas

## Manejo de errores y edge cases

| Caso | Comportamiento |
| --- | --- |
| Error de red (sin conexión) | El cliente lanza error con mensaje. El hook expone `error` para que la pantalla muestre feedback. |
| 401 (no autorizado) | El cliente lanza error. El interceptor global (ya existente en query-client) maneja logout y redirect. |
| 403 (forbidden) | El cliente lanza error. Ocurre cuando el usuario intenta acceder/eliminar una tarea que no le pertenece. |
| 404 (recurso no encontrado) | El cliente lanza error. El hook `useTask` debe manejar este caso (opcional: mostrar estado "no encontrado"). |
| 500 (error del servidor) | El cliente lanza error. La pantalla muestra mensaje genérico. |
| Token no disponible | El cliente no envía header `Authorization`. Si el endpoint requiere auth, el backend responde 401. |
| Query con ID vacío | `useTask(id)` usa `enabled: !!id` para no ejecutar query hasta que haya ID válido. |
| Query con groupId vacío | `useTasks(groupId)` usa `enabled: !!groupId` para no ejecutar query hasta que haya groupId válido. |
| Mutation fallida | El hook expone `error`. La pantalla debe mostrar feedback inline. El estado previo de TanStack Query no se modifica. |

## Estrategia de testing

- **Typecheck**: `npm run typecheck` debe pasar sin errores tras los cambios.
- **Lint**: `npm run lint:fix` debe pasar sin warnings.
- **Pruebas manuales** (requiere backend accesible):
  1. Usar `useTasks(groupId)` → debe listar tareas de un grupo.
  2. Usar `useCreateTask` → debe crear tarea en grupo y refrescar lista.
  3. Usar `useUpdateTask` → debe actualizar tarea y refrescar lista/detalle.
  4. Usar `useDeleteTask` → debe eliminar tarea y refrescar lista.
  5. Verificar que el token se envía en header (inspeccionar network).
  6. Simular 401 → debe activar interceptor global (logout).
  7. Simular 403 → debe mostrar error de permisos.
- **Pruebas unitarias** (futuro): Mock del cliente HTTP para testear servicios y hooks sin backend real.

## Preguntas abiertas

- **URL base exacta**: ¿Es `http://192.168.1.39:3000/api` o otra variante? Se configurará en constante.
- **Autenticación**: ¿La API requiere token para todos los endpoints o algunos son públicos? El cliente envía token solo si existe.
- **Estructura de entidades**: ¿Los campos exactos de Task son los asumidos? Revisar docs de Swagger.
- **Filtros**: ¿Los endpoints GET soportan filtros (status, búsqueda)? Se extenderá en iteración futura.

## Criterios de aceptación

### Cliente HTTP y Configuración
- [ ] El cliente HTTP en `src/lib/api/client.ts` configura base URL e inyecta header `Authorization` con token del auth-store.
- [ ] La constante `API_BASE_URL` está definida en `src/constants/api.ts`.
- [ ] El cliente maneja errores HTTP (lanza errores con mensaje claro).

### Tipos TypeScript
- [ ] Los tipos en `src/lib/api/types.ts` definen interfaces para `Task` y sus Input types.
- [ ] Los tipos reflejan los contratos de la API según la documentación de Swagger.

### Servicio de API
- [ ] El servicio `src/lib/api/tasks.ts` implementa funciones para CRUD de tasks por grupo.

### Hooks de Queries
- [ ] El hook `useTasks(groupId)` usa `useQuery` con `queryKey: ['tasks', groupId]` y `enabled: !!groupId`.
- [ ] El hook `useTask(id)` usa `useQuery` con `queryKey: ['tasks', id]` y `enabled: !!id`.

### Hooks de Mutations
- [ ] Los hooks de mutations de tasks (`useCreateTask`, `useUpdateTask`, `useDeleteTask`) invalidan queries relevantes en `onSuccess`.

### Calidad de Código
- [ ] `npm run typecheck` pasa sin errores.
- [ ] `npm run lint:fix` pasa sin warnings.
- [ ] El código sigue las convenciones de Biome (espacios, comillas, semicolons, etc.).
