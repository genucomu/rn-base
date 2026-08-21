# API de tareas

## Contexto / Problema

La app necesita un modelo de tareas que pueda organizar trabajo dentro de grupos o proyectos. Sin una API consistente, cada pantalla de tareas tendrá diferentes definiciones de estado, fechas, prioridad y filtros, resultando en inconsistencias de UX y complejidad de sincronización entre vistas.

## Objetivos

- Definir el dominio base de una tarea.
- Establecer endpoints para listar, crear, editar y eliminar tareas.
- Definir estados, prioridades, relación con grupos y subtareas.
- Alinear la API con el flujo de TanStack Query y la arquitectura del proyecto.

## No-objetivos

- No definir un sistema de calendarización avanzado ni recurrencia de tareas.
- No incluir comentarios, archivos adjuntos, o etiquetas complejas en esta fase.
- No modelar permisos de usuario por tarea más allá del acceso al grupo asociado.

## Supuestos

- Cada tarea pertenece a un grupo y puede tener cero o muchas subtareas.
- Las tareas requieren estado visible (`todo`, `in_progress`, `done`, `blocked` o equivalente) y prioridad.
- La API puede soportar filtros por estado, prioridad y asignado.

## Requerimientos funcionales

- [ ] RF-1: El usuario puede listar tareas de un grupo.
- [ ] RF-2: El usuario puede recuperar el detalle de una tarea por id.
- [ ] RF-3: El usuario puede crear una tarea con título, descripción y metadata mínima.
- [ ] RF-4: El usuario puede actualizar el estado, prioridad, fecha de vencimiento y responsable.
- [ ] RF-5: El usuario puede eliminar una tarea o marcarla finalizada.
- [ ] RF-6: La API debe soportar filtros por estado y prioridad en la colección.
- [ ] RF-7: La tarea debe reflejar conteos y relación con subtareas asociadas.

## Requerimientos no funcionales

- Rendimiento: paginación o limitación de resultados cuando la colección crece.
- Consistencia: timestamps de creación, actualización y cierre.
- Observabilidad: respuestas con `meta` opcional para conteos de filtros.
- Seguridad: un usuario no autorizado no puede acceder a tareas ajenas.

## Datos / API

### Entidad Task

- `id: string`
- `groupId: string`
- `title: string`
- `description?: string`
- `status: 'todo' | 'in_progress' | 'done' | 'blocked'`
- `priority: 'low' | 'medium' | 'high'`
- `assigneeId?: string`
- `dueDate?: string`
- `completedAt?: string`
- `createdAt: string`
- `updatedAt: string`

### Endpoints sugeridos

- `GET /groups/:groupId/tasks`
- `GET /groups/:groupId/tasks/:id`
- `POST /groups/:groupId/tasks`
- `PATCH /groups/:groupId/tasks/:id`
- `DELETE /groups/:groupId/tasks/:id`
- `GET /groups/:groupId/tasks?status=...&priority=...`

### Query / mutation strategy

- `useTasks(groupId, filters)`
- `useTask(groupId, taskId)`
- `useCreateTask`, `useUpdateTask`, `useDeleteTask`
- Invalidación de `tasks` y `task` por grupo tras cambios.

## UI / Navegación

- Pantalla de listado por grupo.
- Filtros por estado y prioridad.
- Pantalla de detalle con subtareas, due date y cambios de estado.
- Empty state para grupos sin tareas y loading durante mutaciones.

## Manejo de errores y edge cases

- Título vacío: error de validación.
- Tarea no encontrada: 404.
- Fecha vencida: no bloquear la operación, pero sí marcar visualmente el riesgo.
- Estado finalizado sin subtareas pendientes: permitir o no según regla de negocio.
- Mutaciones concurrentes: usar optimistic updates controlados o invalidación tras éxito.

## Estrategia de testing

- Typecheck: `npm run typecheck`.
- Lint/format: `npm run lint:fix`.
- Validación manual:
  - listar tareas junto a filtros
  - crear tarea con título mínimo
  - cambiar estado a `done`
  - actualizar prioridad y due date
  - borrar tarea y verificar remoción del listado

## Preguntas abiertas

- ¿Las tareas pueden estar fuera de un grupo o solo dentro de one? (se asume que siempre pertenecen a un grupo).
- ¿Se requiere un `deletedAt` para eliminar tareas, o soft delete simple? 

## Criterios de aceptación

- [ ] Existe un modelo de tarea documentado y consistente con la estructura de grupos.
- [ ] Los endpoints CRUD para tareas están definidos con estados y filtros relevantes.
- [ ] La relación con subtareas y grupos queda clara y compatible con la app.
- [ ] La feature define una estrategia de cache para TanStack Query.
- [ ] La spec está lista para avanzar a la fase de plan técnico o implementación.
