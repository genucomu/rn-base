# Plan: Servicios y Hooks de React Query para API

## Referencia

- Spec: `docs/specs/react-query-services.md`

## Estado de tareas

| # | Tarea | Archivos | Estado | Deps |
| --- | --- | --- | --- | --- |
| T1 | Constante API_BASE_URL | `src/constants/api.ts` | pending | — |
| T2 | Tipos TypeScript | `src/lib/api/types.ts` | pending | — |
| T3 | Cliente HTTP base | `src/lib/api/client.ts` | pending | T1, T2 |
| T4 | Servicio de Groups | `src/lib/api/groups.ts` | pending | T2, T3 |
| T5 | Servicio de Tasks | `src/lib/api/tasks.ts` | pending | T2, T3 |
| T6 | Servicio de Subtasks | `src/lib/api/subtasks.ts` | pending | T2, T3 |
| T7 | Hooks de queries de Groups | `src/hooks/use-groups.ts` | pending | T4 |
| T8 | Hooks de mutations de Groups | `src/hooks/use-group-mutations.ts` | pending | T4 |
| T9 | Hooks de queries de Tasks | `src/hooks/use-tasks.ts` | pending | T5 |
| T10 | Hooks de mutations de Tasks | `src/hooks/use-task-mutations.ts` | pending | T5 |
| T11 | Hooks de queries de Subtasks | `src/hooks/use-subtasks.ts` | pending | T6 |
| T12 | Hooks de mutations de Subtasks | `src/hooks/use-subtask-mutations.ts` | pending | T6 |
| T13 | Verificación final (typecheck + lint) | — | pending | T1–T12 |

## Cambios por archivo

| Archivo | Acción | Descripción |
| --- | --- | --- |
| `src/constants/api.ts` | **crear** | Constante `API_BASE_URL` que lee de `process.env.EXPO_PUBLIC_API_URL` con fallback a `http://192.168.1.39:3000/api`. Sigue patrón existente en `auth.ts`. |
| `src/lib/api/types.ts` | **crear** | Interfaces TypeScript para `Group`, `Task`, `Subtask`, `Member` y sus Input types (`CreateGroupInput`, `UpdateGroupInput`, etc.). Basarse en la spec y ajustar según docs de Swagger si difieren. |
| `src/lib/api/client.ts` | **crear** | Función `request<T>(endpoint, options)` que usa `fetch`, configura base URL desde `API_BASE_URL`, inyecta header `Authorization: Bearer <token>` leyendo de `auth-store`, maneja errores HTTP lanza `ApiError` con mensaje claro. Reutilizar patrón de `auth.ts`. |
| `src/lib/api/groups.ts` | **crear** | Objeto `groupsApi` con métodos: `list()`, `get(id)`, `create(data)`, `update(id, data)`, `delete(id)`, `addMember(groupId, data)`, `removeMember(groupId, memberId)`. Todos usan `request()` del cliente. |
| `src/lib/api/tasks.ts` | **crear** | Objeto `tasksApi` con métodos: `listByGroup(groupId)`, `get(id)`, `create(groupId, data)`, `update(id, data)`, `delete(id)`. Todos usan `request()` del cliente. |
| `src/lib/api/subtasks.ts` | **crear** | Objeto `subtasksApi` con métodos: `listByTask(taskId)`, `get(id)`, `create(taskId, data)`, `update(id, data)`, `delete(id)`. Todos usan `request()` del cliente. |
| `src/hooks/use-groups.ts` | **crear** | Hooks `useGroups()` y `useGroup(id)` usando `useQuery` de TanStack Query. `staleTime: 5 * 60 * 1000`. `queryKey: ['groups']` y `['groups', id]`. `enabled: !!id` para el segundo. |
| `src/hooks/use-group-mutations.ts` | **crear** | Hooks `useCreateGroup()`, `useUpdateGroup()`, `useDeleteGroup()`, `useAddGroupMember()`, `useRemoveGroupMember()` usando `useMutation`. Invalidan queries relevantes en `onSuccess` (usar `queryClient.invalidateQueries`). |
| `src/hooks/use-tasks.ts` | **crear** | Hooks `useTasks(groupId)` y `useTask(id)` usando `useQuery`. `staleTime: 5 * 60 * 1000`. `queryKey: ['tasks', groupId]` y `['tasks', id]`. `enabled: !!groupId` y `enabled: !!id`. |
| `src/hooks/use-task-mutations.ts` | **crear** | Hooks `useCreateTask()`, `useUpdateTask()`, `useDeleteTask()` usando `useMutation`. Invalidan queries relevantes en `onSuccess`. |
| `src/hooks/use-subtasks.ts` | **crear** | Hooks `useSubtasks(taskId)` y `useSubtask(id)` usando `useQuery`. `staleTime: 5 * 60 * 1000`. `queryKey: ['subtasks', taskId]` y `['subtasks', id]`. `enabled: !!taskId` y `enabled: !!id`. |
| `src/hooks/use-subtask-mutations.ts` | **crear** | Hooks `useCreateSubtask()`, `useUpdateSubtask()`, `useDeleteSubtask()` usando `useMutation`. Invalidan queries relevantes en `onSuccess`. |

## Descomposición en tareas

### T1 — Constante API_BASE_URL

- **Archivos**: crear `src/constants/api.ts`
- **Qué hacer**: Exportar constante `API_BASE_URL` que lee de `process.env.EXPO_PUBLIC_API_URL` con fallback a `http://192.168.1.39:3000/api`. La variable de entorno actual es `http://192.168.1.39:3000` (sin `/api`), así que la constante debe agregar `/api` o los servicios deben usar endpoints relativos.
- **Dependencias**: ninguna

### T2 — Tipos TypeScript

- **Archivos**: crear `src/lib/api/types.ts`
- **Qué hacer**: Definir interfaces según la spec:
  - `Group`, `CreateGroupInput`, `UpdateGroupInput`
  - `Member`, `AddMemberInput`
  - `Task`, `CreateTaskInput`, `UpdateTaskInput`
  - `Subtask`, `CreateSubtaskInput`, `UpdateSubtaskInput`
  - Todos los campos opcionales para update (partial types)
  - Exportar tipos reutilizables
- **Dependencias**: ninguna

### T3 — Cliente HTTP Base

- **Archivos**: crear `src/lib/api/client.ts`
- **Qué hacer**: Crear función genérica `request<T>(endpoint: string, options?: RequestInit): Promise<T>`:
  - Importar `API_BASE_URL` de `@/constants/api`
  - Importar `useAuthStore` y usar `useAuthStore.getState().token` para obtener el token
  - Configurar headers: `Content-Type: application/json`, `Authorization: Bearer ${token}` si token existe
  - Usar `fetch` con `${API_BASE_URL}${endpoint}`
  - Manejar errores: si `!response.ok`, parsear body JSON y lanzar `ApiError` (reutilizar clase de `auth.ts`)
  - Si parsing falla, lanzar error genérico
  - Si la URL es 401, el interceptor global en `query-client.ts` ya maneja logout
- **Dependencias**: requiere T1 (API_BASE_URL), T2 (tipos para return type)

### T4 — Servicio de Groups

- **Archivos**: crear `src/lib/api/groups.ts`
- **Qué hacer**: Exportar objeto `groupsApi` con métodos:
  - `list(): Promise<Group[]>` → GET `/tasks/groups`
  - `get(id: string): Promise<Group>` → GET `/tasks/groups/${id}`
  - `create(data: CreateGroupInput): Promise<Group>` → POST `/tasks/groups`
  - `update(id: string, data: UpdateGroupInput): Promise<Group>` → PUT `/tasks/groups/${id}`
  - `delete(id: string): Promise<void>` → DELETE `/tasks/groups/${id}`
  - `addMember(groupId: string, data: AddMemberInput): Promise<Member>` → POST `/tasks/groups/${groupId}/members`
  - `removeMember(groupId: string, memberId: string): Promise<void>` → DELETE `/tasks/groups/${groupId}/members/${memberId}`
  - Todos los métodos usan `request()` del cliente
- **Dependencias**: requiere T2 (tipos), T3 (cliente)

### T5 — Servicio de Tasks

- **Archivos**: crear `src/lib/api/tasks.ts`
- **Qué hacer**: Exportar objeto `tasksApi` con métodos:
  - `listByGroup(groupId: string): Promise<Task[]>` → GET `/tasks/groups/${groupId}/tasks`
  - `get(id: string): Promise<Task>` → GET `/tasks/${id}`
  - `create(groupId: string, data: Omit<CreateTaskInput, 'groupId'>): Promise<Task>` → POST `/tasks/groups/${groupId}/tasks`
  - `update(id: string, data: UpdateTaskInput): Promise<Task>` → PUT `/tasks/${id}`
  - `delete(id: string): Promise<void>` → DELETE `/tasks/${id}`
  - Todos los métodos usan `request()` del cliente
- **Dependencias**: requiere T2 (tipos), T3 (cliente)

### T6 — Servicio de Subtasks

- **Archivos**: crear `src/lib/api/subtasks.ts`
- **Qué hacer**: Exportar objeto `subtasksApi` con métodos:
  - `listByTask(taskId: string): Promise<Subtask[]>` → GET `/tasks/${taskId}/subtasks`
  - `get(id: string): Promise<Subtask>` → GET `/subtasks/${id}`
  - `create(taskId: string, data: Omit<CreateSubtaskInput, 'taskId'>): Promise<Subtask>` → POST `/tasks/${taskId}/subtasks`
  - `update(id: string, data: UpdateSubtaskInput): Promise<Subtask>` → PUT `/subtasks/${id}`
  - `delete(id: string): Promise<void>` → DELETE `/subtasks/${id}`
  - Todos los métodos usan `request()` del cliente
- **Dependencias**: requiere T2 (tipos), T3 (cliente)

### T7 — Hooks de Queries de Groups

- **Archivos**: crear `src/hooks/use-groups.ts`
- **Qué hacer**: Exportar hooks:
  - `useGroups()`: `useQuery` con `queryKey: ['groups']`, `queryFn: groupsApi.list`, `staleTime: 5 * 60 * 1000`
  - `useGroup(id: string)`: `useQuery` con `queryKey: ['groups', id]`, `queryFn: () => groupsApi.get(id)`, `enabled: !!id`, `staleTime: 5 * 60 * 1000`
- **Dependencias**: requiere T4 (groupsApi)

### T8 — Hooks de Mutations de Groups

- **Archivos**: crear `src/hooks/use-group-mutations.ts`
- **Qué hacer**: Exportar hooks:
  - `useCreateGroup()`: `useMutation` con `mutationFn: groupsApi.create`, `onSuccess: () => queryClient.invalidateQueries(['groups'])`
  - `useUpdateGroup()`: `useMutation` con `mutationFn: ({ id, data }) => groupsApi.update(id, data)`, `onSuccess: () => queryClient.invalidateQueries(['groups'])`
  - `useDeleteGroup()`: `useMutation` con `mutationFn: groupsApi.delete`, `onSuccess: () => queryClient.invalidateQueries(['groups'])`
  - `useAddGroupMember()`: `useMutation` con `mutationFn: ({ groupId, data }) => groupsApi.addMember(groupId, data)`, `onSuccess: (_, { groupId }) => queryClient.invalidateQueries(['groups', groupId])`
  - `useRemoveGroupMember()`: `useMutation` con `mutationFn: ({ groupId, memberId }) => groupsApi.removeMember(groupId, memberId)`, `onSuccess: (_, { groupId }) => queryClient.invalidateQueries(['groups', groupId])`
- **Dependencias**: requiere T4 (groupsApi)

### T9 — Hooks de Queries de Tasks

- **Archivos**: crear `src/hooks/use-tasks.ts`
- **Qué hacer**: Exportar hooks:
  - `useTasks(groupId: string)`: `useQuery` con `queryKey: ['tasks', groupId]`, `queryFn: () => tasksApi.listByGroup(groupId)`, `enabled: !!groupId`, `staleTime: 5 * 60 * 1000`
  - `useTask(id: string)`: `useQuery` con `queryKey: ['tasks', id]`, `queryFn: () => tasksApi.get(id)`, `enabled: !!id`, `staleTime: 5 * 60 * 1000`
- **Dependencias**: requiere T5 (tasksApi)

### T10 — Hooks de Mutations de Tasks

- **Archivos**: crear `src/hooks/use-task-mutations.ts`
- **Qué hacer**: Exportar hooks:
  - `useCreateTask()`: `useMutation` con `mutationFn: ({ groupId, data }) => tasksApi.create(groupId, data)`, `onSuccess: (_, { groupId }) => queryClient.invalidateQueries(['tasks', groupId])`
  - `useUpdateTask()`: `useMutation` con `mutationFn: ({ id, data }) => tasksApi.update(id, data)`, `onSuccess: (_, { id }) => queryClient.invalidateQueries(['tasks'])`
  - `useDeleteTask()`: `useMutation` con `mutationFn: tasksApi.delete`, `onSuccess: (_, { id }) => queryClient.invalidateQueries(['tasks'])`
- **Dependencias**: requiere T5 (tasksApi)

### T11 — Hooks de Queries de Subtasks

- **Archivos**: crear `src/hooks/use-subtasks.ts`
- **Qué hacer**: Exportar hooks:
  - `useSubtasks(taskId: string)`: `useQuery` con `queryKey: ['subtasks', taskId]`, `queryFn: () => subtasksApi.listByTask(taskId)`, `enabled: !!taskId`, `staleTime: 5 * 60 * 1000`
  - `useSubtask(id: string)`: `useQuery` con `queryKey: ['subtasks', id]`, `queryFn: () => subtasksApi.get(id)`, `enabled: !!id`, `staleTime: 5 * 60 * 1000`
- **Dependencias**: requiere T6 (subtasksApi)

### T12 — Hooks de Mutations de Subtasks

- **Archivos**: crear `src/hooks/use-subtask-mutations.ts`
- **Qué hacer**: Exportar hooks:
  - `useCreateSubtask()`: `useMutation` con `mutationFn: ({ taskId, data }) => subtasksApi.create(taskId, data)`, `onSuccess: (_, { taskId }) => queryClient.invalidateQueries(['subtasks', taskId])`
  - `useUpdateSubtask()`: `useMutation` con `mutationFn: ({ id, data }) => subtasksApi.update(id, data)`, `onSuccess: (_, { taskId }) => queryClient.invalidateQueries(['subtasks', taskId])`
  - `useDeleteSubtask()`: `useMutation` con `mutationFn: subtasksApi.delete`, `onSuccess: (_, { taskId }) => queryClient.invalidateQueries(['subtasks', taskId])`
- **Dependencias**: requiere T6 (subtasksApi)

### T13 — Verificación final

- **Archivos**: todos los anteriores
- **Qué hacer**: Correr `npm run typecheck` y `npm run lint:fix` para verificar que no hay errores ni warnings
- **Dependencias**: requiere T1–T12

## Librerías / dependencias

- No se requieren nuevas librerías. TanStack Query v5 ya está instalado y configurado.
- Si se necesita agregar algo adicional, usar `npx expo install` para módulos nativos.

## Riesgos / dependencias

- **Estructura de endpoints**: Los endpoints asumidos en la spec pueden diferir de la API real. Si al implementar los servicios fallan los requests, ajustar según la documentación de Swagger en http://192.168.1.39:3000/api/docs#/Tasks
- **URL base**: La variable de entorno actual es `http://192.168.1.39:3000` (sin `/api`). Verificar en T1 si la constante debe agregar `/api` o si los endpoints deben incluirlo.
- **Auth**: El token se obtiene de `auth-store`. Verificar que el store tiene el método correcto para obtener el token (`useAuthStore.getState().token`).

## Verificación

- `npm run typecheck`
- `npm run lint:fix`
