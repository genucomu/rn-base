# Crear tareas

## Contexto / Problema

El módulo de tareas ya define los tipos `Task` y `CreateTaskInput`, y el listado usa el endpoint `GET /tasks/tasks`. Sin embargo, `createTask` todavía crea registros en un arreglo local en memoria, por lo que una tarea creada no se persiste en la API ni queda disponible para otros clientes o sesiones.

Este ciclo debe conectar la creación con la API y exponerla mediante una mutación de TanStack Query. La implementación de pantallas, formularios y cualquier otro trabajo de UI queda fuera de esta spec y se realizará en un ciclo posterior.

## Objetivos

- Persistir tareas nuevas mediante `POST /tasks/tasks`.
- Reutilizar los tipos de tarea existentes y el cliente HTTP compartido.
- Exponer la operación como una mutación `useCreateTask` compatible con el patrón actual de TanStack Query.
- Centralizar las query keys de tareas y refrescar el listado del grupo después de una creación exitosa.

## No-objetivos

- No implementar ni modificar pantallas, formularios, componentes, navegación o tabs.
- No implementar actualización, eliminación, detalle o listado de tareas más allá de los ajustes de keys necesarios para la invalidación.
- No cambiar el modelo de estados, prioridades ni la relación entre tareas, grupos y subtareas.
- No agregar dependencias nuevas ni modificar el cliente HTTP global.

## Supuestos

- `groupId` es obligatorio para crear una tarea y se recibe como argumento de `createTask` y `useCreateTask`.
- El endpoint de creación es `POST /tasks/tasks`, consistente con el endpoint de listado ya usado por `listTasks`.
- El backend recibe `groupId` junto con los campos de `CreateTaskInput` en el body del POST: `{ groupId, ...input }`.
- La API devuelve una entidad `Task` completa, incluyendo `id`, `groupId`, estado inicial y timestamps.
- La validación de campos obligatorios y las reglas de autorización son responsabilidad de la API; el cliente conserva únicamente la validación/normalización ya existente que no contradiga el contrato remoto.
- La query del listado seguirá identificándose por grupo y, cuando corresponda, por filtros; las keys deberán quedar centralizadas en `src/lib/query-keys.ts`.

## Requerimientos funcionales

- [ ] RF-1: `createTask(groupId, input)` debe invocar `http.post<Task>('/tasks/tasks', body)` y no modificar almacenamiento local en memoria.
- [ ] RF-2: El body debe incluir el `groupId` y los campos definidos por `CreateTaskInput`: `title`, `description`, `priority`, `assigneeId` y `dueDate`, omitiendo los opcionales no informados según el contrato actual.
- [ ] RF-3: El service debe retornar la respuesta tipada como `Promise<Task>` y propagar los errores producidos por `http`, incluyendo errores HTTP, autenticación y validación.
- [ ] RF-4: `useCreateTask(groupId?)` debe usar `useMutation` y ejecutar el service solo cuando exista un `groupId`; si falta, debe mantener el guard existente y producir un error explícito de parámetro faltante.
- [ ] RF-5: Tras una creación exitosa, la mutación debe invalidar la query de tareas del `groupId` devuelto por la API para que el listado se recupere desde el servidor.
- [ ] RF-6: Las keys de tareas deben definirse en `src/lib/query-keys.ts`, incluyendo al menos `all`, `list(groupId, params?)` y `detail(groupId, id)` o una estructura equivalente que preserve separación por grupo.
- [ ] RF-7: El hook de listado de tareas debe reutilizar las query keys centralizadas para que la invalidación de `useCreateTask` alcance las consultas existentes, sin strings de key duplicados en `src/features/tasks/queries.ts`.

## Requerimientos no funcionales

- Mantener la arquitectura existente: services solo llaman a la API; hooks solo coordinan TanStack Query; los tipos permanecen separados.
- Reutilizar `src/services/http.ts` para inyección del token y refresh automático ante `401`; no implementar un fetch alternativo.
- Mantener compatibilidad con TypeScript estricto, alias `@/*` y las convenciones de Biome.
- No introducir actualizaciones optimistas: la fuente de verdad tras la creación será la respuesta de la API y el refetch del listado.

## Datos / API

### Tipos existentes a reutilizar

- `Task` y `CreateTaskInput` en `src/features/tasks/types.ts`.
- `PaginatedResponse<Task>` para el listado existente.

### Endpoint

```text
POST /tasks/tasks
```

Body esperado por esta implementación:

```json
{
  "groupId": "group-id",
  "title": "Nueva tarea",
  "description": "Descripción opcional",
  "priority": "medium",
  "assigneeId": "user-id",
  "dueDate": "2026-10-01T00:00:00.000Z"
}
```

La respuesta debe ser una entidad `Task`. El service debe ubicarse en `src/features/tasks/api.ts`, reutilizando la instancia `http` de `src/services/http.ts`. No debe conservarse el arreglo local ni la espera artificial usada por el stub actual para crear tareas.

### Archivos previstos

- `src/features/tasks/api.ts`: reemplazar la implementación local de `createTask` por el POST tipado.
- `src/features/tasks/queries.ts`: adaptar `useCreateTask` y el listado a las keys centralizadas; conservar el patrón de `useMutation` e invalidación.
- `src/lib/query-keys.ts`: agregar el namespace de tareas con claves por grupo, listado y detalle.
- `src/features/tasks/types.ts`: reutilizar los tipos existentes; modificar solo si la respuesta real del endpoint exige una corrección de contrato validada.

## UI / Navegación

No se implementa UI en este ciclo. No se modifican `src/app/`, `src/components/`, tabs ni rutas. Un spec futuro deberá conectar `useCreateTask` con un formulario y definir estados visuales de carga, éxito y error.

## Manejo de errores y edge cases

- `groupId` ausente en el hook o service: conservar un error explícito de parámetro requerido antes de llamar a la API.
- `title` vacío: no inventar una respuesta local; propagar la validación del backend, salvo que el contrato existente se confirme como validación cliente obligatoria.
- `401`: debe seguir el flujo automático de refresh de `http` y propagarse si la sesión no puede renovarse.
- `4xx` o `5xx`: la mutación debe quedar en estado de error y no invalidar el listado como si la creación hubiera sido exitosa.
- Respuesta exitosa sin `groupId`: tratarla como contrato inválido o impedir una invalidación ambigua; no invalidar una key global accidentalmente.
- Creaciones concurrentes: cada éxito debe invalidar el listado del grupo; no usar actualización optimista en esta fase.

## Estrategia de testing

- `npm run typecheck` para validar los tipos del body, la respuesta y las keys.
- `npm run lint` para verificar el formato y las reglas de Biome sin modificar archivos.
- Prueba unitaria o mock del service, si el proyecto incorpora infraestructura de tests: verificar que `createTask` hace `POST /tasks/tasks` con `groupId` y el input, y retorna la respuesta.
- Prueba del hook, si existe infraestructura de tests: verificar que una creación exitosa invalida únicamente el listado del grupo creado y que un error no invalida queries.
- Verificación manual de red: crear una tarea autenticado, confirmar el request `POST /tasks/tasks`, revisar que la respuesta sea un `Task` y que el listado vuelva a consultarse.

## Preguntas abiertas

- Confirmar en el contrato OpenAPI del backend si `groupId` pertenece al body del POST o si se espera como query parameter. Esta spec asume body por ser un endpoint no anidado y porque el service actual recibe el grupo como argumento.
- Confirmar si los campos opcionales deben enviarse explícitamente como `undefined` o eliminarse del body antes de serializar; ambas opciones deben respetar el DTO del backend.
- Confirmar si la API devuelve siempre el `groupId` en la respuesta de creación.

## Criterios de aceptación

- [ ] `createTask` deja de usar el arreglo local y realiza un `POST /tasks/tasks` mediante `src/services/http.ts`.
- [ ] El request incluye `groupId` y los datos de `CreateTaskInput`, y la respuesta queda tipada como `Task`.
- [ ] `useCreateTask` ejecuta la mutación con el patrón de TanStack Query y conserva el guard para `groupId` faltante.
- [ ] Las query keys de tareas están centralizadas y el listado de tareas las reutiliza.
- [ ] Una creación exitosa invalida el listado del grupo correspondiente; una fallida no realiza invalidación de éxito.
- [ ] No se modifican pantallas, componentes, rutas ni navegación.
- [ ] `npm run typecheck` y `npm run lint` pasan después de la implementación.
- [ ] La spec queda lista para que un plan futuro implemente servicios, mutación y hooks sin incluir trabajo de UI.