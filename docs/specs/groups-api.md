# API de Groups

## Contexto / Problema

La app no tiene implementados los servicios de integración con la API ni los hooks de TanStack Query para gestionar grupos (Groups). La API está documentada en http://192.168.1.39:3000/api/docs#/Tasks y expone endpoints para crear, editar, eliminar grupos y gestionar sus miembros. Actualmente el estado de servidor no está conectado a ningún backend real para esta entidad. Para que la app funcione correctamente se necesita el manejo completo de Groups:
- CRUD de grupos (creación, edición, eliminación)
- Gestión de miembros (agregar/eliminar usuarios a un grupo)

## Objetivos

- Implementar el servicio de API (`src/lib/api/groups.ts`) que abstrae las llamadas HTTP al backend para Groups.
- Crear hooks de TanStack Query (`src/hooks/use-groups.ts`, `src/hooks/use-group-mutations.ts`) que expongan los queries y mutations para las operaciones de Groups.
- Configurar el cliente HTTP con soporte para autenticación (token) y manejo de errores.
- Implementar el modelo de datos de Groups con Members.
- Seguir las convenciones del proyecto: estado de servidor en TanStack Query, servicios en `src/lib/api/`, hooks en `src/hooks/`.

## No-objetivos

- Implementar las pantallas que consumen estos hooks (lo hará otra iteración).
- Implementar endpoints de Tasks ni Subtasks (están en specs separadas).
- Manejo de refresh token automático (se asume token válido).
- Implementación de offline-first o cache avanzado (solo cache por defecto de TanStack Query).
- Paginación, infinite scroll o filtros complejos (solo operaciones básicas CRUD).
- Permisos granulares (role-based access control) - se asume que el usuario autenticado puede gestionar sus propios recursos.

## Supuestos

- La API está accesible en http://192.168.1.39:3000/api (URL base configurable).
- La API expone endpoints RESTful para Groups según la documentación en Swagger.
- El token de autenticación (cuando exista) se envía en el header `Authorization: Bearer <token>`.
- La estructura de carpetas existente se respeta: `src/lib/api/` para servicios, `src/hooks/` para hooks.
- TanStack Query v5 ya está configurado en `src/lib/query-client.ts`.
- Groups tienen Members (usuarios asociados al grupo).
- Las relaciones se manejan mediante IDs (groupId en Member).

## Requerimientos funcionales

- [ ] **RF-1: Cliente HTTP base** — Crear `src/lib/api/client.ts` con una instancia de `fetch` o `axios` que:
  - Configure la base URL (`API_BASE_URL`).
  - Inyecte el header `Authorization` leyendo el token del auth-store (si existe).
  - Maneje respuestas de error de forma consistente (lanzar errores con mensaje).
- [ ] **RF-2: Servicio de Groups** — Crear `src/lib/api/groups.ts` con funciones para:
  - GET /tasks/groups → Listado de grupos
  - GET /tasks/groups/:id → Detalle de un grupo
  - POST /tasks/groups → Crear nuevo grupo
  - PUT /tasks/groups/:id → Editar grupo (nombre, descripción)
  - DELETE /tasks/groups/:id → Eliminar grupo
  - POST /tasks/groups/:id/members → Agregar miembro al grupo
  - DELETE /tasks/groups/:id/members/:memberId → Eliminar miembro del grupo
- [ ] **RF-3: Hook de queries de Groups** — Crear `src/hooks/use-groups.ts` con hooks `useGroups`, `useGroup` (por ID) usando `useQuery`.
- [ ] **RF-4: Hook de mutations de Groups** — Crear `src/hooks/use-group-mutations.ts` con hooks `useCreateGroup`, `useUpdateGroup`, `useDeleteGroup`, `useAddGroupMember`, `useRemoveGroupMember`.
- [ ] **RF-5: Constante de API_BASE_URL** — Definir `API_BASE_URL` en `src/constants/api.ts` (o similar) para centralizar la configuración.
- [ ] **RF-6: Tipos TypeScript** — Definir interfaces en `src/lib/api/types.ts` para `Group`, `Member` y sus respectivos Input types según la documentación de la API.

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

#### Groups
```
GET    /api/tasks/groups              → Listado de grupos
GET    /api/tasks/groups/:id          → Detalle de un grupo
POST   /api/tasks/groups              → Crear nuevo grupo
PUT    /api/tasks/groups/:id          → Editar grupo
DELETE /api/tasks/groups/:id          → Eliminar grupo
POST   /api/tasks/groups/:id/members  → Agregar miembro al grupo
DELETE /api/tasks/groups/:id/members/:memberId → Eliminar miembro del grupo
```

### Tipos TypeScript (ejemplo, ajustar según docs reales)

```ts
// src/lib/api/types.ts

// Groups
export interface Group {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  members?: Member[];
}

export interface CreateGroupInput {
  name: string;
  description?: string;
}

export interface UpdateGroupInput {
  name?: string;
  description?: string;
}

// Members
export interface Member {
  id: string;
  groupId: string;
  userId: string;
  role?: 'admin' | 'member';
  joinedAt: string;
}

export interface AddMemberInput {
  userId: string;
  role?: Member['role'];
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

### Servicio de Groups (`src/lib/api/groups.ts`)

```ts
import { request } from './client';
import type { Group, CreateGroupInput, UpdateGroupInput, AddMemberInput } from './types';

export const groupsApi = {
  list: () => request<Group[]>('/tasks/groups'),
  get: (id: string) => request<Group>(`/tasks/groups/${id}`),
  create: (data: CreateGroupInput) => request<Group>('/tasks/groups', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id: string, data: UpdateGroupInput) => request<Group>(`/tasks/groups/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id: string) => request<void>(`/tasks/groups/${id}`, {
    method: 'DELETE',
  }),
  addMember: (groupId: string, data: AddMemberInput) =>
    request<Member>(`/tasks/groups/${groupId}/members`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  removeMember: (groupId: string, memberId: string) =>
    request<void>(`/tasks/groups/${groupId}/members/${memberId}`, {
      method: 'DELETE',
    }),
};
```

### Hooks de Queries de Groups (`src/hooks/use-groups.ts`)

```ts
import { useQuery } from '@tanstack/react-query';
import { groupsApi } from '@/lib/api/groups';
import type { Group } from '@/lib/api/types';

export function useGroups() {
  return useQuery({
    queryKey: ['groups'],
    queryFn: groupsApi.list,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

export function useGroup(id: string) {
  return useQuery({
    queryKey: ['groups', id],
    queryFn: () => groupsApi.get(id),
    enabled: !!id,
  });
}
```

### Hooks de Mutations de Groups (`src/hooks/use-group-mutations.ts`)

```ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { groupsApi } from '@/lib/api/groups';
import type { CreateGroupInput, UpdateGroupInput, AddMemberInput } from '@/lib/api/types';

export function useCreateGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateGroupInput) => groupsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
    },
  });
}

export function useUpdateGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateGroupInput }) =>
      groupsApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      queryClient.invalidateQueries({ queryKey: ['groups', id] });
    },
  });
}

export function useDeleteGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => groupsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
    },
  });
}

export function useAddGroupMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ groupId, data }: { groupId: string; data: AddMemberInput }) =>
      groupsApi.addMember(groupId, data),
    onSuccess: (_, { groupId }) => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      queryClient.invalidateQueries({ queryKey: ['groups', groupId] });
    },
  });
}

export function useRemoveGroupMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ groupId, memberId }: { groupId: string; memberId: string }) =>
      groupsApi.removeMember(groupId, memberId),
    onSuccess: (_, { groupId }) => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      queryClient.invalidateQueries({ queryKey: ['groups', groupId] });
    },
  });
}
```

## UI / Navegación

Esta spec no incluye cambios en UI ni navegación. Los hooks creados serán consumidos por pantallas en iteraciones futuras:
- Lista de grupos (home o tab específico)
- Detalle de grupo con gestión de miembros
- Formularios de creación/edición de grupos
- Pantalla para agregar/eliminar miembros

## Manejo de errores y edge cases

| Caso | Comportamiento |
| --- | --- |
| Error de red (sin conexión) | El cliente lanza error con mensaje. El hook expone `error` para que la pantalla muestre feedback. |
| 401 (no autorizado) | El cliente lanza error. El interceptor global (ya existente en query-client) maneja logout y redirect. |
| 403 (forbidden) | El cliente lanza error. Ocurre cuando el usuario intenta acceder/eliminar un grupo que no le pertenece. |
| 404 (recurso no encontrado) | El cliente lanza error. El hook `useGroup` debe manejar este caso (opcional: mostrar estado "no encontrado"). |
| 500 (error del servidor) | El cliente lanza error. La pantalla muestra mensaje genérico. |
| Token no disponible | El cliente no envía header `Authorization`. Si el endpoint requiere auth, el backend responde 401. |
| Query con ID vacío | `useGroup(id)` usa `enabled: !!id` para no ejecutar query hasta que haya ID válido. |
| Mutation fallida | El hook expone `error`. La pantalla debe mostrar feedback inline. El estado previo de TanStack Query no se modifica. |
| Eliminar grupo con tareas | Si el backend permite eliminar grupos con tareas, se invalidan queries de tasks del grupo. Si no, devuelve 400/409. |
| Agregar miembro ya existente | El backend debe validar y retornar 409 si el usuario ya es miembro del grupo. |

## Estrategia de testing

- **Typecheck**: `npm run typecheck` debe pasar sin errores tras los cambios.
- **Lint**: `npm run lint:fix` debe pasar sin warnings.
- **Pruebas manuales** (requiere backend accesible):
  1. Usar `useGroups` → debe listar grupos.
  2. Usar `useCreateGroup` → debe crear grupo y refrescar lista.
  3. Usar `useUpdateGroup` → debe actualizar grupo y refrescar lista/detalle.
  4. Usar `useDeleteGroup` → debe eliminar grupo y refrescar lista.
  5. Usar `useAddGroupMember` → debe agregar miembro y refrescar grupo.
  6. Usar `useRemoveGroupMember` → debe eliminar miembro y refrescar grupo.
  7. Verificar que el token se envía en header (inspeccionar network).
  8. Simular 401 → debe activar interceptor global (logout).
  9. Simular 403 → debe mostrar error de permisos.
- **Pruebas unitarias** (futuro): Mock del cliente HTTP para testear servicios y hooks sin backend real.

## Preguntas abiertas

- **URL base exacta**: ¿Es `http://192.168.1.39:3000/api` o otra variante? Se configurará en constante.
- **Autenticación**: ¿La API requiere token para todos los endpoints o algunos son públicos? El cliente envía token solo si existe.
- **Estructura de entidades**: ¿Los campos exactos de Group y Member son los asumidos? Revisar docs de Swagger.
- **Cascada de eliminación**: ¿El backend permite eliminar grupos con tareas, o requiere eliminar tareas primero?
- **Roles de miembros**: ¿El backend soporta roles (admin, member) con permisos diferentes? Se asume soporte básico.
- **Paginación**: ¿El endpoint GET de groups soporta paginación? Si es así, se extenderá en iteración futura.
- **Filtros**: ¿El endpoint GET de groups soporta filtros (búsqueda, etc.)? Se extenderá en iteración futura.

## Criterios de aceptación

### Cliente HTTP y Configuración
- [ ] El cliente HTTP en `src/lib/api/client.ts` configura base URL e inyecta header `Authorization` con token del auth-store.
- [ ] La constante `API_BASE_URL` está definida en `src/constants/api.ts`.
- [ ] El cliente maneja errores HTTP (lanza errores con mensaje claro).

### Tipos TypeScript
- [ ] Los tipos en `src/lib/api/types.ts` definen interfaces para `Group`, `Member` y sus Input types.
- [ ] Los tipos reflejan los contratos de la API según la documentación de Swagger.

### Servicio de API
- [ ] El servicio `src/lib/api/groups.ts` implementa funciones para CRUD de groups y gestión de members.

### Hooks de Queries
- [ ] El hook `useGroups` en `src/hooks/use-groups.ts` usa `useQuery` con `queryKey: ['groups']` y `staleTime` configurado.
- [ ] El hook `useGroup(id)` usa `useQuery` con `queryKey: ['groups', id]` y `enabled: !!id`.

### Hooks de Mutations
- [ ] Los hooks de mutations de groups (`useCreateGroup`, `useUpdateGroup`, `useDeleteGroup`, `useAddGroupMember`, `useRemoveGroupMember`) invalidan queries relevantes en `onSuccess`.

### Calidad de Código
- [ ] `npm run typecheck` pasa sin errores.
- [ ] `npm run lint:fix` pasa sin warnings.
- [ ] El código sigue las convenciones de Biome (espacios, comillas, semicolons, etc.).
